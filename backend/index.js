import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getAllMetrics, getSelfHealth, ALLOWED_EMAIL } from './dashboard.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const JWT_SECRET = process.env.JWT_SECRET
  || createHash('sha256').update('10minmail-dash-' + (process.env.NODE_ENV || 'dev')).digest('hex');

// Simple 30-second metrics cache to avoid hammering external APIs
let _metricsCache = null;
let _metricsCacheTs = 0;

function requireDashAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.email !== ALLOWED_EMAIL) return res.status(403).json({ error: 'Access denied' });
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — please sign in again' });
  }
}

const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

// ── Provider constants ────────────────────────────────────────────────────────
// mail.tm + mail.gw: account-based, full HTML + attachment support, bearer auth
const MAIL_APIS = ['https://api.mail.tm', 'https://api.mail.gw'];

// 1secmail: no-auth public API, full HTML + inline image attachment support
const ONESECMAIL     = 'https://www.1secmail.com/api/v1/';
const ONESECMAIL_DOM = [
  '1secmail.com', '1secmail.org', '1secmail.net',
  'kzccv.com', 'qiott.com', 'wuuvo.com', 'icznn.com', 'ezztt.com',
];

const LIFESPAN_MS = 10 * 60 * 1000;

// ip → session
// mailtm:     { provider:'mailtm',     email, token, api, assignedAt }
// onesecmail: { provider:'onesecmail', email, login, domain, assignedAt }
const sessions = new Map();

// `${ip}:${msgId}` → attachments[] — caches attachment metadata per message
const attCache = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomStr(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function normalizeIp(ip) {
  if (!ip || ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

// Normalise "YYYY-MM-DD HH:MM:SS" (1secmail) to ISO 8601
function parseDate(d) {
  if (!d) return new Date().toISOString();
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d) ? d.replace(' ', 'T') + 'Z' : d;
}

function formatFrom(from) {
  if (!from) return 'unknown';
  if (typeof from === 'string') return from;
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

// Replace cid: / attachment: src attrs and CSS url() with proxy paths.
function replaceEmbeddedSrcs(html, msgId) {
  const proxy = (name) => `/api/messages/${msgId}/att/${encodeURIComponent(name.toLowerCase())}`;
  return html
    .replace(
      /src=(["']?)(?:cid:|attachment:)([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
      (_, q, name) => `src="${proxy(name)}"`
    )
    .replace(
      /url\((["']?)(?:cid:|attachment:)([^"'\s)@]*)(?:@[^"'\s)]*)?\1\)/gi,
      (_, q, name) => `url("${proxy(name)}")`
    );
}

function setSession(ip, data) {
  sessions.set(ip, data);
  console.log(`[+] ${ip}: ${data.email} (${data.provider})`);
}

// ── Provisioning ─────────────────────────────────────────────────────────────

// 1secmail: no account needed — any address on their domains is a live inbox.
async function provisionOnesecmail() {
  const login  = randomStr(8) + Math.floor(Math.random() * 900 + 100) + randomStr(4);
  const domain = ONESECMAIL_DOM[Math.floor(Math.random() * ONESECMAIL_DOM.length)];
  const email  = `${login}@${domain}`;
  return { provider: 'onesecmail', email, login, domain };
}

async function getActiveDomain(api) {
  const res  = await fetch(`${api}/domains?page=1`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to list domains from ${api}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data['hydra:member'];
  if (!list?.length) throw new Error(`No domains from ${api}`);
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, password }),
      });
      if (!createRes.ok) throw new Error(`Account creation ${createRes.status}`);

      const tokenRes = await fetch(`${api}/token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, password }),
      });
      if (!tokenRes.ok) throw new Error('Token fetch failed');
      const { token } = await tokenRes.json();

      return { provider: 'mailtm', email: address, token, api };
    } catch (err) {
      console.error(`[provision] ${api} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

// Try mail.tm/mail.gw first (richer API); fall back to 1secmail.
async function provisionMailbox() {
  try   { return await provisionMailtm(); }
  catch (err) { console.error('[provision] mailtm failed, trying 1secmail:', err.message); }
  return provisionOnesecmail();
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
  if (!session) return res.status(404).json({ error: 'No active session' });

  try {
    const cutoff = new Date(session.assignedAt);

    // ── 1secmail ──
    if (session.provider === 'onesecmail') {
      const r = await fetch(
        `${ONESECMAIL}?action=getMessages&login=${session.login}&domain=${session.domain}`
      );
      if (!r.ok) throw new Error(`1secmail ${r.status}`);
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

    // ── mail.tm / mail.gw ──
    const r = await fetch(`${session.api}/messages?page=1`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!r.ok) throw new Error(`${session.api} ${r.status}`);
    const data    = await r.json();
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
  if (!session) return res.status(404).json({ error: 'No active session' });

  try {
    // ── 1secmail ──
    if (session.provider === 'onesecmail') {
      const r = await fetch(
        `${ONESECMAIL}?action=readMessage&login=${session.login}&domain=${session.domain}&id=${req.params.id}`
      );
      if (!r.ok) throw new Error(`1secmail ${r.status}`);
      const m = await r.json();

      // Cache attachment metadata so the proxy endpoint can serve them
      const atts = (m.attachments || []).map(a => ({
        filename:    a.filename,
        contentType: a.contentType,
        size:        a.size,
        // Full download URL — no auth needed for 1secmail
        downloadUrl: `${ONESECMAIL}?action=download&login=${session.login}&domain=${session.domain}&id=${req.params.id}&file=${encodeURIComponent(a.filename)}`,
      }));
      attCache.set(`${ip}:${req.params.id}`, atts);
      setTimeout(() => attCache.delete(`${ip}:${req.params.id}`), LIFESPAN_MS);

      const rawHtml = m.htmlBody || null;

      return res.json({
        id:      String(m.id),
        from:    m.from || 'unknown',
        to:      session.email,
        subject: m.subject || '(no subject)',
        date:    parseDate(m.date),
        text:    m.textBody || m.body || '',
        html:    rawHtml ? replaceEmbeddedSrcs(rawHtml, req.params.id) : null,
        cidMap:  {},
      });
    }

    // ── mail.tm / mail.gw ──
    const r = await fetch(`${session.api}/messages/${req.params.id}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!r.ok) throw new Error(`${session.api} ${r.status}`);
    const m = await r.json();

    const rawHtml = Array.isArray(m.html) && m.html.length > 0 ? m.html[0]
      : typeof m.html === 'string' && m.html ? m.html : null;

    const allAtts = m.attachments ?? [];
    attCache.set(`${ip}:${m.id}`, allAtts);
    setTimeout(() => attCache.delete(`${ip}:${m.id}`), LIFESPAN_MS);

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
app.get('/api/messages/:id/att/:name', async (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(403).end();

  const name = decodeURIComponent(req.params.name).toLowerCase();

  try {
    // ── 1secmail: download URL cached at read time, no auth required ──
    if (session.provider === 'onesecmail') {
      let atts = attCache.get(`${ip}:${req.params.id}`);
      if (!atts) {
        // Re-fetch the message to rebuild the cache if it expired
        const r = await fetch(
          `${ONESECMAIL}?action=readMessage&login=${session.login}&domain=${session.domain}&id=${req.params.id}`
        );
        if (!r.ok) return res.status(404).end();
        const m = await r.json();
        atts = (m.attachments || []).map(a => ({
          filename:    a.filename,
          contentType: a.contentType,
          downloadUrl: `${ONESECMAIL}?action=download&login=${session.login}&domain=${session.domain}&id=${req.params.id}&file=${encodeURIComponent(a.filename)}`,
        }));
        attCache.set(`${ip}:${req.params.id}`, atts);
        setTimeout(() => attCache.delete(`${ip}:${req.params.id}`), LIFESPAN_MS);
      }

      const att = atts.find(a => a.filename?.toLowerCase() === name)
                ?? (atts.length === 1 ? atts[0] : null);
      if (!att?.downloadUrl) return res.status(404).end();

      const attRes = await fetch(att.downloadUrl);
      if (!attRes.ok) return res.status(attRes.status).end();
      res.setHeader('Content-Type', att.contentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.send(Buffer.from(await attRes.arrayBuffer()));
    }

    // ── mail.tm / mail.gw: bearer-authenticated download ──
    let attachments = attCache.get(`${ip}:${req.params.id}`);
    if (!attachments) {
      const r = await fetch(`${session.api}/messages/${req.params.id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!r.ok) return res.status(404).end();
      const m = await r.json();
      attachments = m.attachments ?? [];
      attCache.set(`${ip}:${req.params.id}`, attachments);
      setTimeout(() => attCache.delete(`${ip}:${req.params.id}`), LIFESPAN_MS);
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

    const url = att.downloadUrl.startsWith('http')
      ? att.downloadUrl
      : `${session.api}${att.downloadUrl}`;
    const attRes = await fetch(url, { headers: { Authorization: `Bearer ${session.token}` } });
    if (!attRes.ok) return res.status(attRes.status).end();
    res.setHeader('Content-Type', att.contentType || 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(Buffer.from(await attRes.arrayBuffer()));
  } catch (err) {
    console.error('[att]', err.message);
    return res.status(500).end();
  }
});

// ── POST /api/email/extend ────────────────────────────────────────────────────
app.post('/api/email/extend', (req, res) => {
  const ip      = normalizeIp(req.ip);
  const session = sessions.get(ip);
  if (!session) return res.status(404).json({ error: 'No active session' });
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
  const BASE  = 'https://10-minute-mail.online';
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

// ── Dashboard: config (public) ────────────────────────────────────────────────
app.get('/api/dashboard/config', (_req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

// ── Dashboard: verify Google credential → issue JWT ───────────────────────────
app.post('/api/auth/verify-google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });
  if (!googleClient) return res.status(503).json({ error: 'Google Sign-In not configured on server (GOOGLE_CLIENT_ID missing)' });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email || email !== ALLOWED_EMAIL) {
      return res.status(403).json({ error: `Access denied: ${email || 'unknown email'}` });
    }

    const token = jwt.sign(
      { email, name: payload.name, picture: payload.picture },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token });
  } catch (e) {
    console.error('[auth/verify-google]', e.message);
    return res.status(401).json({ error: 'Token verification failed' });
  }
});

// ── Dashboard: metrics (protected) ───────────────────────────────────────────
app.get('/api/dashboard/metrics', requireDashAuth, async (req, res) => {
  const now = Date.now();
  if (_metricsCache && now - _metricsCacheTs < 30_000) {
    return res.json({ ..._metricsCache, cached: true });
  }
  try {
    const data = await getAllMetrics(sessions);
    _metricsCache = data;
    _metricsCacheTs = now;
    return res.json(data);
  } catch (e) {
    console.error('[dashboard/metrics]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── Dashboard: serve HTML ─────────────────────────────────────────────────────
// ── Static / SPA fallback ─────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '../frontend/dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('/dashboard', (_req, res) => res.sendFile(join(DIST, 'dashboard.html')));
  app.get('*', (req, res) => res.sendFile(join(DIST, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));
