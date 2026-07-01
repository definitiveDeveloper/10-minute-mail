import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

// mail.tm and mail.gw share the same domain pool (same company).
// 1secmail.com is an independent provider with 7 distinct domains.
const MAIL_APIS  = ['https://api.mail.tm', 'https://api.mail.gw'];
const ONESECMAIL = 'https://www.1secmail.com/api/v1/';
const LIFESPAN_MS = 10 * 60 * 1000;

// ip -> session object
// mailtm:   { provider:'mailtm',   email, token, api, assignedAt }
// 1secmail: { provider:'1secmail', email, login, domain, assignedAt }
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

async function provision1secmail() {
  const res = await fetch(`${ONESECMAIL}?action=genRandomMailbox&count=1`);
  if (!res.ok) throw new Error(`1secmail returned ${res.status}`);
  const [address] = await res.json();
  const at = address.indexOf('@');
  return {
    provider: '1secmail',
    email: address,
    login: address.slice(0, at),
    domain: address.slice(at + 1),
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

// Pick randomly: ~50% 1secmail (for domain diversity), ~50% mail.tm/mail.gw.
// Falls back to the other if the chosen one fails.
async function provisionMailbox() {
  const try1sec = Math.random() < 0.5;
  if (try1sec) {
    try   { return await provision1secmail(); }
    catch (err) { console.error('[provision] 1secmail failed, falling back:', err.message); }
    return provisionMailtm();
  } else {
    try   { return await provisionMailtm(); }
    catch (err) { console.error('[provision] mailtm failed, falling back:', err.message); }
    return provision1secmail();
  }
}

function setSession(ip, data) {
  sessions.set(ip, data);
  console.log(`[+] Session for ${ip}: ${data.email} (${data.provider})`);
}

// 1secmail returns "YYYY-MM-DD HH:MM:SS" (UTC); normalise to ISO
function parseDate(d) {
  if (!d) return new Date().toISOString();
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d) ? d.replace(' ', 'T') + 'Z' : d;
}

function formatFrom(from) {
  if (!from) return 'unknown';
  if (typeof from === 'string') return from;
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

// Replace cid: / attachment: src attrs with proxy URLs
function replaceEmbeddedSrcs(html, msgId) {
  return html.replace(
    /src=(["']?)(?:cid:|attachment:)([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
    (match, q, name) => `src="/api/messages/${msgId}/att/${encodeURIComponent(name.toLowerCase())}"`
  );
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

    if (session.provider === '1secmail') {
      const r = await fetch(`${ONESECMAIL}?action=getMessages&login=${session.login}&domain=${session.domain}`);
      if (!r.ok) throw new Error(`1secmail returned ${r.status}`);
      const list = await r.json();
      const messages = (Array.isArray(list) ? list : [])
        .filter(m => new Date(parseDate(m.date)) >= cutoff)
        .map(m => ({
          id:      String(m.id),
          from:    m.from || 'unknown',
          subject: m.subject || '(no subject)',
          date:    parseDate(m.date),
          intro:   '',
          seen:    false,
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
    if (session.provider === '1secmail') {
      const r = await fetch(
        `${ONESECMAIL}?action=readMessage&login=${session.login}&domain=${session.domain}&id=${req.params.id}`
      );
      if (!r.ok) throw new Error(`1secmail returned ${r.status}`);
      const m = await r.json();

      const allAtts = m.attachments ?? [];
      attCache.set(`${ip}:${req.params.id}`, allAtts);
      setTimeout(() => attCache.delete(`${ip}:${req.params.id}`), 10 * 60 * 1000);

      let processedHtml = m.htmlBody || null;
      if (processedHtml) {
        processedHtml = replaceEmbeddedSrcs(processedHtml, req.params.id);
        // Also replace bare filename srcs for known attachments
        for (const att of allAtts) {
          const esc = att.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          processedHtml = processedHtml.replace(
            new RegExp(`src=(["']?)${esc}\\1`, 'gi'),
            (_, q) => `src="/api/messages/${req.params.id}/att/${encodeURIComponent(att.filename.toLowerCase())}"`
          );
        }
      }

      return res.json({
        id:      String(m.id),
        from:    m.from || 'unknown',
        to:      session.email,
        subject: m.subject || '(no subject)',
        date:    parseDate(m.date),
        text:    m.textBody || m.body || '',
        html:    processedHtml,
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

  if (session.provider === '1secmail') {
    // Find original-case filename from cache (1secmail download is case-sensitive)
    let filename = name;
    const cached = attCache.get(`${ip}:${req.params.id}`);
    if (cached?.length) {
      const match = cached.find(a => a.filename.toLowerCase() === name);
      if (match) filename = match.filename;
    }
    try {
      const url = `${ONESECMAIL}?action=download&login=${session.login}&domain=${session.domain}&id=${req.params.id}&file=${encodeURIComponent(filename)}`;
      const attRes = await fetch(url);
      if (!attRes.ok) return res.status(attRes.status).end();
      const ext = filename.split('.').pop().toLowerCase();
      const ct  = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml', pdf:'application/pdf' }[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'private, max-age=300');
      const buf = await attRes.arrayBuffer();
      return res.send(Buffer.from(buf));
    } catch (err) {
      console.error('[1secmail att]', err.message);
      return res.status(500).end();
    }
  }

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));
