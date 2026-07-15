import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

// mail.tm and mail.gw share the same domain pool (same company).
// Guerrilla Mail is an independent provider with a stable public API.
const MAIL_APIS     = ['https://api.mail.tm', 'https://api.mail.gw'];
const GUERRILLAMAIL = 'https://api.guerrillamail.com/ajax.php';
const LIFESPAN_MS   = 10 * 60 * 1000;

// ip -> session object
// mailtm:        { provider:'mailtm',        email, token, api, assignedAt }
// guerrillamail: { provider:'guerrillamail', email, sidToken, assignedAt }
const sessions = new Map();

// Attachment metadata cache: `ip:msgId` → attachments[]
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

// ── Provisioning ─────────────────────────────────────────────────────────────

async function provisionGuerrillamail() {
  const res = await fetch(`${GUERRILLAMAIL}?f=get_email_address`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Guerrilla Mail returned ${res.status}`);
  const data = await res.json();
  if (!data.email_addr || !data.sid_token) throw new Error('Guerrilla Mail: unexpected response shape');
  return {
    provider: 'guerrillamail',
    email: data.email_addr.trim(),
    sidToken: data.sid_token,
  };
}

async function getActiveDomain(api) {
  const res = await fetch(`${api}/domains?page=1`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to list domains from ${api}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data['hydra:member'];
  if (!list?.length) throw new Error(`No domains available from ${api}`);
  return list[Math.floor(Math.random() * list.length)].domain;
}

async function provisionMailtm() {
  const apis = [...MAIL_APIS].sort(() => Math.random() - 0.5);
  let lastErr;
  for (const api of apis) {
    try {
      const domain   = await getActiveDomain(api);
      const username = randomStr(8) + Math.floor(Math.random() * 900 + 100) + randomStr(5);
      const password = randomStr(32);
      const address  = `${username}@${domain}`;

      const createRes = await fetch(`${api}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`Account creation failed (${createRes.status}): ${body}`);
      }

      const tokenRes = await fetch(`${api}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      if (!tokenRes.ok) throw new Error('Token fetch failed');
      const { token } = await tokenRes.json();

      return { provider: 'mailtm', email: address, token, api };
    } catch (err) {
      console.error(`[provisionMailbox] ${api} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

// Try mail.tm/mail.gw first; fall back to Guerrilla Mail if it fails.
async function provisionMailbox() {
  try   { return await provisionMailtm(); }
  catch (err) { console.error('[provision] mailtm failed, trying Guerrilla Mail:', err.message); }
  return provisionGuerrillamail();
}

function setSession(ip, data) {
  sessions.set(ip, data);
  console.log(`[+] Session for ${ip}: ${data.email} (${data.provider})`);
}

// Normalise "YYYY-MM-DD HH:MM:SS" (some providers) to ISO 8601
function parseDate(d) {
  if (!d) return new Date().toISOString();
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d) ? d.replace(' ', 'T') + 'Z' : d;
}

function formatFrom(from) {
  if (!from) return 'unknown';
  if (typeof from === 'string') return from;
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

// Replace cid: / attachment: references in src attrs and CSS url() with proxy URLs.
function replaceEmbeddedSrcs(html, msgId) {
  const proxy = (name) => `/api/messages/${msgId}/att/${encodeURIComponent(name.toLowerCase())}`;
  // <img src="cid:name@host"> and src="attachment:name"
  let out = html.replace(
    /src=(["']?)(?:cid:|attachment:)([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
    (match, q, name) => `src="${proxy(name)}"`
  );
  // CSS background-image: url("cid:name@host") / url(cid:name)
  out = out.replace(
    /url\((["']?)(?:cid:|attachment:)([^"'\s)@]*)(?:@[^"'\s)]*)?\1\)/gi,
    (match, q, name) => `url("${proxy(name)}")`
  );
  return out;
}

// ── GET /api/email ────────────────────────────────────────────────────────────
app.get('/api/email', async (req, res) => {
  const ip  = normalizeIp(req.ip);
  const now = Date.now();

  const existing = sessions.get(ip);
  if (existing && now - existing.assignedAt < LIFESPAN_MS) {
    return res.json({ email: existing.email, assignedAt: existing.assignedAt });
  }

  try {
    const data = await provisionMailbox();
    setSession(ip, { ...data, assignedAt: now });
    return res.json({ email: data.email, assignedAt: now });
  } catch (err) {
    console.error('[/api/email]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages ─────────────────────────────────────────────────────────
app.get('/api/messages', async (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });

  try {
    const cutoff = new Date(session.assignedAt);

    if (session.provider === 'guerrillamail') {
      const r = await fetch(`${GUERRILLAMAIL}?f=get_email_list&offset=0&sid_token=${session.sidToken}`);
      if (!r.ok) throw new Error(`Guerrilla Mail returned ${r.status}`);
      const data = await r.json();
      const list = Array.isArray(data.list) ? data.list : [];
      const messages = list
        .filter(m => new Date(parseInt(m.mail_timestamp, 10) * 1000) >= cutoff)
        .map(m => ({
          id:      String(m.mail_id),
          from:    m.mail_from || 'unknown',
          subject: m.mail_subject || '(no subject)',
          date:    new Date(parseInt(m.mail_timestamp, 10) * 1000).toISOString(),
          intro:   m.mail_excerpt || '',
          seen:    m.mail_read === 1 || m.mail_read === '1',
        }));
      return res.json({ messages });
    }

    // mail.tm / mail.gw
    const r = await fetch(`${session.api}/messages?page=1`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!r.ok) throw new Error(`${session.api} returned ${r.status}`);
    const data = await r.json();
    const rawList = Array.isArray(data) ? data : (data['hydra:member'] ?? []);
    const messages = rawList
      .filter(m => new Date(m.createdAt) >= cutoff)
      .map(m => ({
        id:      m.id,
        from:    formatFrom(m.from),
        subject: m.subject || '(no subject)',
        date:    m.createdAt,
        intro:   m.intro ?? '',
        seen:    m.seen ?? false,
      }));
    return res.json({ messages });
  } catch (err) {
    console.error('[/api/messages]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/:id ─────────────────────────────────────────────────────
app.get('/api/messages/:id', async (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });

  try {
    if (session.provider === 'guerrillamail') {
      const r = await fetch(`${GUERRILLAMAIL}?f=fetch_email&email_id=${req.params.id}&sid_token=${session.sidToken}`);
      if (!r.ok) throw new Error(`Guerrilla Mail returned ${r.status}`);
      const m = await r.json();

      const rawHtml = m.mail_body || null;
      return res.json({
        id:      String(m.mail_id),
        from:    m.mail_from || 'unknown',
        to:      session.email,
        subject: m.mail_subject || '(no subject)',
        date:    new Date(parseInt(m.mail_timestamp, 10) * 1000).toISOString(),
        text:    rawHtml ? rawHtml.replace(/<[^>]*>/g, '') : '',
        html:    rawHtml ? replaceEmbeddedSrcs(rawHtml, req.params.id) : null,
        cidMap:  {},
      });
    }

    // mail.tm / mail.gw
    const r = await fetch(`${session.api}/messages/${req.params.id}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!r.ok) throw new Error(`${session.api} returned ${r.status}`);
    const m = await r.json();

    const rawHtml = Array.isArray(m.html) && m.html.length > 0 ? m.html[0]
      : typeof m.html === 'string' && m.html ? m.html : null;

    const allAtts = m.attachments ?? [];
    attCache.set(`${ip}:${m.id}`, allAtts);
    setTimeout(() => attCache.delete(`${ip}:${m.id}`), 10 * 60 * 1000);

    return res.json({
      id:      m.id,
      from:    formatFrom(m.from),
      to:      (m.to ?? []).map(t => t.address).join(', '),
      subject: m.subject || '(no subject)',
      date:    m.createdAt,
      text:    Array.isArray(m.text) ? m.text.join('\n') : (m.text ?? ''),
      html:    rawHtml ? replaceEmbeddedSrcs(rawHtml, m.id) : null,
      cidMap:  {},
    });
  } catch (err) {
    console.error('[/api/messages/:id]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/:id/att/:name ──────────────────────────────────────────
// Streams an attachment from the right provider with auth.
app.get('/api/messages/:id/att/:name', async (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(403).end();

  const name = decodeURIComponent(req.params.name).toLowerCase();

  // Guerrilla Mail doesn't support attachment proxying.
  if (session.provider === 'guerrillamail') return res.status(404).end();

  // mail.tm / mail.gw
  let attachments = attCache.get(`${ip}:${req.params.id}`);
  if (!attachments) {
    try {
      const r = await fetch(`${session.api}/messages/${req.params.id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!r.ok) return res.status(404).end();
      const m = await r.json();
      attachments = m.attachments ?? [];
      attCache.set(`${ip}:${req.params.id}`, attachments);
      setTimeout(() => attCache.delete(`${ip}:${req.params.id}`), 10 * 60 * 1000);
    } catch {
      return res.status(500).end();
    }
  }

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
    console.error('[mailtm att]', err.message);
    res.status(500).end();
  }
});

// ── POST /api/email/extend ────────────────────────────────────────────────────
app.post('/api/email/extend', (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session for this IP' });
  const newAssignedAt = Date.now();
  sessions.set(ip, { ...session, assignedAt: newAssignedAt });
  return res.json({ email: session.email, assignedAt: newAssignedAt });
});

// ── POST /api/email/renew ─────────────────────────────────────────────────────
app.post('/api/email/renew', async (req, res) => {
  const ip = normalizeIp(req.ip);
  try {
    const data = await provisionMailbox();
    setSession(ip, { ...data, assignedAt: Date.now() });
    return res.json({ email: data.email, assignedAt: Date.now() });
  } catch (err) {
    console.error('[/api/email/renew]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /sitemap.xml ──────────────────────────────────────────────────────────
app.get('/sitemap.xml', (_req, res) => {
  const BASE = 'https://10-minute-mail.online';
  const today = new Date().toISOString().split('T')[0];
  const langs = ['en','sq','ar','bg','ca','zh-CN','hr','cs','da','nl','eo','et','fi','fr','gl','de','el','he','hu','id','it','ja','ko','lv','lt','no','fa','pl','pt','ro','ru','sr','sk','sl','es','sv','th','tr','uk','vi'];
  const langUrls = langs.map(lang => `
  <url>
    <loc>${BASE}/?lang=${lang}</loc>
    <changefreq>weekly</changefreq>
    <priority>${lang === 'en' ? '0.9' : '0.7'}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join('');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${BASE}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>${langUrls}
</urlset>`);
});

// ── GET /robots.txt ───────────────────────────────────────────────────────────
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://10-minute-mail.online/sitemap.xml`);
});

// Serve built frontend in production (same-origin, no proxy needed)
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '../frontend/dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(join(DIST, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));
