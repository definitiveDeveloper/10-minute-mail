import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

// Both APIs are identical in interface; mail.gw is the companion service with a different domain pool.
const MAIL_APIS = ['https://api.mail.tm', 'https://api.mail.gw'];
const LIFESPAN_MS = 10 * 60 * 1000;

// ip -> { email, token, assignedAt, api }  (api = which provider was used)
const sessions = new Map();

// Attachment metadata cache so the proxy endpoint doesn't re-fetch the full message for each image.
// Key: `ip:msgId`, Value: attachments[]
const attCache = new Map();

function randomStr(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function normalizeIp(ip) {
  if (!ip || ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

async function getActiveDomain(api) {
  const res = await fetch(`${api}/domains?page=1`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to list domains from ${api}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data['hydra:member'];
  if (!list?.length) throw new Error(`No domains available from ${api}`);
  return list[Math.floor(Math.random() * list.length)].domain;
}

async function provisionMailbox() {
  // Shuffle API list so we try them in random order and fall back if one is down.
  const apis = [...MAIL_APIS].sort(() => Math.random() - 0.5);
  let lastErr;
  for (const api of apis) {
    try {
      const domain = await getActiveDomain(api);
      const username = randomStr(8) + Math.floor(Math.random() * 900 + 100) + randomStr(5);
      const password = randomStr(32);
      const address = `${username}@${domain}`;

      const createRes = await fetch(`${api}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
      });
      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`Account creation failed (${createRes.status}): ${body}`);
      }

      const tokenRes = await fetch(`${api}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
      });
      if (!tokenRes.ok) throw new Error('Token fetch failed');
      const { token } = await tokenRes.json();

      console.log(`[+] Provisioned via ${api}: ${address}`);
      return { address, token, api };
    } catch (err) {
      console.error(`[provisionMailbox] ${api} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

function formatFrom(from) {
  if (!from) return 'unknown';
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

// ── GET /api/email ──────────────────────────────────────────────────────────
// Returns the email assigned to this IP (creates one if new or expired).
app.get('/api/email', async (req, res) => {
  const ip = normalizeIp(req.ip);
  const now = Date.now();

  const existing = sessions.get(ip);
  if (existing && now - existing.assignedAt < LIFESPAN_MS) {
    return res.json({ email: existing.email, assignedAt: existing.assignedAt });
  }

  try {
    const { address, token, api } = await provisionMailbox();
    const assignedAt = now;
    sessions.set(ip, { email: address, token, assignedAt, api });
    return res.json({ email: address, assignedAt });
  } catch (err) {
    console.error('[/api/email]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages ───────────────────────────────────────────────────────
// Returns messages received after the session's assignedAt timestamp.
app.get('/api/messages', async (req, res) => {
  const ip = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });

  try {
    const r = await fetch(`${session.api}/messages?page=1`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    if (!r.ok) throw new Error(`${session.api} returned ${r.status}`);
    const data = await r.json();

    const cutoff = new Date(session.assignedAt);
    const rawList = Array.isArray(data) ? data : (data['hydra:member'] ?? []);
    const messages = rawList
      .filter(m => new Date(m.createdAt) >= cutoff)
      .map(m => ({
        id: m.id,
        from: formatFrom(m.from),
        subject: m.subject || '(no subject)',
        date: m.createdAt,
        intro: m.intro ?? '',
        seen: m.seen ?? false
      }));

    return res.json({ messages });
  } catch (err) {
    console.error('[/api/messages]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/:id ───────────────────────────────────────────────────
app.get('/api/messages/:id', async (req, res) => {
  const ip = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });

  try {
    const r = await fetch(`${session.api}/messages/${req.params.id}`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    if (!r.ok) throw new Error(`${session.api} returned ${r.status}`);
    const m = await r.json();

    // Handle both array and string forms of the html field
    const rawHtml = Array.isArray(m.html) && m.html.length > 0 ? m.html[0]
      : typeof m.html === 'string' && m.html ? m.html : null;

    // Cache attachment metadata so the proxy endpoint can find them without re-fetching.
    const allAtts = m.attachments ?? [];
    const cacheKey = `${ip}:${m.id}`;
    attCache.set(cacheKey, allAtts);
    setTimeout(() => attCache.delete(cacheKey), 10 * 60 * 1000);

    // Replace cid: / attachment: src refs with proxy URLs.
    // The proxy endpoint handles auth and streams the binary at image-load time.
    const processedHtml = rawHtml ? rawHtml.replace(
      /src=(["']?)(?:cid:|attachment:)([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
      (match, q, name) => `src="/api/messages/${m.id}/att/${encodeURIComponent(name.toLowerCase())}"`
    ) : null;

    return res.json({
      id: m.id,
      from: formatFrom(m.from),
      to: (m.to ?? []).map(t => t.address).join(', '),
      subject: m.subject || '(no subject)',
      date: m.createdAt,
      text: Array.isArray(m.text) ? m.text.join('\n') : (m.text ?? ''),
      html: processedHtml,
      cidMap: {}
    });
  } catch (err) {
    console.error('[/api/messages/:id]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/:id/att/:name ─────────────────────────────────────────
// Proxy endpoint: streams an attachment from mail.tm with auth.
// img src="/api/messages/:id/att/image.png" inside the sandboxed iframe works
// because Vite proxies /api → backend and the iframe has allow-same-origin.
app.get('/api/messages/:id/att/:name', async (req, res) => {
  const ip = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(403).end();

  const cacheKey = `${ip}:${req.params.id}`;
  let attachments = attCache.get(cacheKey);

  // If cache miss (e.g. backend restarted), re-fetch the message
  if (!attachments) {
    try {
      const r = await fetch(`${session.api}/messages/${req.params.id}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (!r.ok) return res.status(404).end();
      const m = await r.json();
      attachments = m.attachments ?? [];
      attCache.set(cacheKey, attachments);
      setTimeout(() => attCache.delete(cacheKey), 10 * 60 * 1000);
    } catch {
      return res.status(500).end();
    }
  }

  const name = decodeURIComponent(req.params.name).toLowerCase();

  // Resolve attachment: by filename → contentId → ATTACH000001 positional → single-attachment fallback
  let att = attachments.find(a => a.filename?.toLowerCase() === name);
  if (!att) {
    att = attachments.find(a => {
      const cid = (a.contentId ?? '').replace(/^<|>$/g, '').split('@')[0].toLowerCase();
      return cid === name;
    });
  }
  if (!att) {
    const m = name.match(/(\d+)$/);
    if (m) att = attachments[parseInt(m[1], 10) - 1];
  }
  if (!att && attachments.length === 1) att = attachments[0];

  if (!att?.downloadUrl) return res.status(404).end();

  try {
    const url = att.downloadUrl.startsWith('http') ? att.downloadUrl : `${session.api}${att.downloadUrl}`;
    const attRes = await fetch(url, { headers: { Authorization: `Bearer ${session.token}` } });
    if (!attRes.ok) return res.status(attRes.status).end();
    res.setHeader('Content-Type', att.contentType || 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=300');
    const buf = await attRes.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error('[att proxy]', err.message);
    res.status(500).end();
  }
});

// ── GET /api/messages/:id/html ─────────────────────────────────────────────
// Serves the email as a complete, renderable HTML document:
//   • Downloads inline MIME attachments (CID images) and embeds them as
//     base64 data URIs so images actually appear in the iframe.
//   • Injects responsive layout fixes and a postMessage height reporter.
//   • Always returns HTTP 200 — error states are rendered as HTML so the
//     browser never shows the gray "failed to load" iframe page.

const HEAD_INJECT = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<base target="_blank">',
  '<style>',
  'img{max-width:100%!important;height:auto!important}',
  'table{max-width:100%!important}',
  'td,th{word-break:break-word}',
  '*{box-sizing:border-box}',
  '</style>',
  '<script>',
  '(function(){',
  'function s(){',
  'var h=Math.max(document.body?document.body.scrollHeight:0,',
  'document.documentElement?document.documentElement.scrollHeight:0);',
  'try{parent.postMessage({type:"email-h",h:h},"*")}catch(e){}',
  '}',
  'document.addEventListener("DOMContentLoaded",s);',
  'window.addEventListener("load",s);',
  'setTimeout(s,600);setTimeout(s,1800);',
  '})();',
  '</script>',
].join('');

function injectHead(html) {
  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/(<head(?:\s[^>]*)?>)/i, (m) => m + HEAD_INJECT);
  }
  if (/<body(\s[^>]*)?>/i.test(html)) {
    return html.replace(/(<body(?:\s[^>]*)?>)/i, (m) => `<head>${HEAD_INJECT}</head>${m}`);
  }
  return `<!DOCTYPE html><html><head>${HEAD_INJECT}</head><body style="padding:12px;margin:0">${html}</body></html>`;
}

app.get('/api/messages/:id/html', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const ip = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) {
    return res.send(injectHead('<p style="font-family:sans-serif;color:#888;padding:12px">Session expired — please refresh the page to continue.</p>'));
  }

  try {
    const r = await fetch(`${MAILTM}/messages/${req.params.id}`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    if (!r.ok) throw new Error(`mail.tm returned ${r.status}`);
    const m = await r.json();

    const rawHtml = Array.isArray(m.html) && m.html.length > 0 ? m.html[0] : null;
    const rawText = Array.isArray(m.text) ? m.text.join('\n') : (m.text ?? '');

    // ── Build a CID → data URI map from inline attachments ──────────────────
    // mail.tm returns attachments with disposition=inline / related=true for
    // images embedded in the HTML via cid: references. We download each one
    // and embed it as a base64 data URI so they render in the sandboxed iframe.
    const cidMap = {};
    const atts = m.attachments ?? [];
    await Promise.all(
      atts
        .filter(a => a.related || a.disposition === 'inline')
        .map(async (att) => {
          try {
            const dlUrl = att.downloadUrl?.startsWith('http')
              ? att.downloadUrl
              : `${MAILTM}${att.downloadUrl}`;
            const ar = await fetch(dlUrl, { headers: { Authorization: `Bearer ${session.token}` } });
            if (!ar.ok) return;
            const buf = await ar.arrayBuffer();
            const dataUri = `data:${att.contentType};base64,${Buffer.from(buf).toString('base64')}`;
            // Index by filename (lowercased) and by attachment id so we can
            // match either `cid:image.png` or `cid:image.png@mail.domain`
            const name = (att.filename || att.id || '').toLowerCase();
            cidMap[name] = dataUri;
            if (att.id) cidMap[String(att.id)] = dataUri;
          } catch (e) {
            console.error(`[cid] ${att.filename}:`, e.message);
          }
        })
    );

    // ── Replace cid: references in the HTML ─────────────────────────────────
    function replaceCids(html) {
      // Matches: src="cid:filename.ext" / src='cid:...' / src=cid:...
      // Captures the filename part (before any @domain suffix)
      return html.replace(
        /src=(["']?)cid:([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
        (match, q, cidName) => {
          const key = cidName.toLowerCase();
          // Try exact filename, then strip extension, then try id
          const dataUri =
            cidMap[key] ||
            cidMap[key.replace(/\.[^.]+$/, '')] ||
            null;
          return dataUri ? `src="${dataUri}"` : match;
        }
      );
    }

    let body;
    if (rawHtml) {
      body = injectHead(replaceCids(rawHtml));
    } else {
      // Plain-text fallback
      const escaped = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      body = `<!DOCTYPE html><html><head>${HEAD_INJECT}` +
        `<style>body{padding:12px;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;font-size:14px;line-height:1.6}</style>` +
        `</head><body><pre style="white-space:pre-wrap;margin:0">${escaped}</pre></body></html>`;
    }

    res.send(body);
  } catch (err) {
    console.error('[/api/messages/:id/html]', err.message);
    res.send(injectHead(`<p style="font-family:sans-serif;color:#888;padding:12px">Could not load email: ${err.message}</p>`));
  }
});

// ── POST /api/email/extend ──────────────────────────────────────────────────
// Resets the session timer without changing the email address.
app.post('/api/email/extend', (req, res) => {
  const ip = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });
  const newAssignedAt = Date.now();
  sessions.set(ip, { ...session, assignedAt: newAssignedAt });
  console.log(`[~] Extended session for ${ip}: ${session.email}`);
  return res.json({ email: session.email, assignedAt: newAssignedAt });
});

// ── POST /api/email/renew ───────────────────────────────────────────────────
// Forces a brand-new mailbox regardless of existing session state.
app.post('/api/email/renew', async (req, res) => {
  const ip = normalizeIp(req.ip);
  try {
    const { address, token, api } = await provisionMailbox();
    const assignedAt = Date.now();
    sessions.set(ip, { email: address, token, assignedAt, api });
    return res.json({ email: address, assignedAt });
  } catch (err) {
    console.error('[/api/email/renew]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));
