import dns from 'dns/promises';
import tls from 'tls';

const DOMAIN = '10-minute-mail.online';
const START_TIME = Date.now();

export const ALLOWED_EMAIL = '1994nidheesh@gmail.com';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

async function timedFetch(url, opts = {}) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    return { ok: r.ok, status: r.status, latencyMs: Date.now() - start, response: r };
  } catch (e) {
    return { ok: false, status: null, latencyMs: Date.now() - start, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Checks ────────────────────────────────────────────────────────────────────

export async function checkSite() {
  const result = await timedFetch(`https://${DOMAIN}`);
  return {
    up: result.ok || (result.status >= 200 && result.status < 500),
    status: result.status,
    latencyMs: result.latencyMs,
    error: result.error || null,
  };
}

export async function checkSsl() {
  return new Promise((resolve) => {
    const socket = tls.connect(443, DOMAIN, { servername: DOMAIN }, () => {
      try {
        const cert = socket.getPeerCertificate();
        const validTo = new Date(cert.valid_to);
        const daysLeft = Math.ceil((validTo - Date.now()) / 86_400_000);
        socket.destroy();
        resolve({
          ok: daysLeft > 0,
          daysLeft,
          validTo: cert.valid_to,
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          subject: cert.subject?.CN || null,
        });
      } catch (e) {
        socket.destroy();
        resolve({ ok: false, error: e.message });
      }
    });
    socket.on('error', (e) => resolve({ ok: false, error: e.message }));
    socket.setTimeout(8000, () => { socket.destroy(); resolve({ ok: false, error: 'timeout' }); });
  });
}

export async function checkDns() {
  try {
    const [aResult, mxResult, nsResult] = await Promise.allSettled([
      dns.resolve4(DOMAIN),
      dns.resolveMx(DOMAIN),
      dns.resolveNs(DOMAIN),
    ]);
    return {
      ok: aResult.status === 'fulfilled',
      aRecords: aResult.status === 'fulfilled' ? aResult.value : [],
      mxRecords: mxResult.status === 'fulfilled' ? mxResult.value : [],
      nsRecords: nsResult.status === 'fulfilled' ? nsResult.value : [],
      error: aResult.status === 'rejected' ? aResult.reason?.message : null,
    };
  } catch (e) {
    return { ok: false, aRecords: [], error: e.message };
  }
}

export async function checkRender() {
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!apiKey || !serviceId) return { configured: false };

  try {
    const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };
    const [svcRes, deplRes] = await Promise.all([
      fetch(`https://api.render.com/v1/services/${serviceId}`, { headers }),
      fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=5`, { headers }),
    ]);
    const svc = await svcRes.json();
    const deplData = await deplRes.json();
    const deploys = Array.isArray(deplData) ? deplData : (deplData.deploys || []);
    const service = svc.service || svc;

    return {
      configured: true,
      name: service.name,
      status: service.suspended === 'suspended' ? 'suspended' : (service.serviceDetails?.status || service.status || 'unknown'),
      plan: service.serviceDetails?.plan || service.plan,
      region: service.serviceDetails?.region || service.region,
      url: service.serviceDetails?.url || service.url,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      deploys: deploys.slice(0, 5).map(d => {
        const dep = d.deploy || d;
        return {
          id: dep.id,
          status: dep.status,
          trigger: dep.trigger,
          createdAt: dep.createdAt,
          finishedAt: dep.finishedAt,
        };
      }),
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}

export async function checkNamecheap() {
  const apiKey  = process.env.NAMECHEAP_API_KEY;
  const apiUser = process.env.NAMECHEAP_API_USER;
  const clientIp = process.env.NAMECHEAP_CLIENT_IP || '127.0.0.1';
  if (!apiKey || !apiUser) return { configured: false };

  try {
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.set('ApiUser', apiUser);
    url.searchParams.set('ApiKey', apiKey);
    url.searchParams.set('UserName', apiUser);
    url.searchParams.set('ClientIp', clientIp);
    url.searchParams.set('Command', 'namecheap.domains.getInfo');
    url.searchParams.set('DomainName', '10-minute-mail');
    url.searchParams.set('Tld', 'online');

    const r = await fetch(url.toString());
    const xml = await r.text();

    const attr  = (tag, a)  => { const m = xml.match(new RegExp(`<${tag}[^>]*\\s${a}="([^"]*)"`, 'i')); return m?.[1] ?? null; };
    const inner = (tag)     => { const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));   return m?.[1]?.trim() ?? null; };

    const expiryDate = inner('ExpiredDate') || attr('DomainDetails', 'ExpiredDate');
    const daysLeft   = expiryDate ? Math.ceil((new Date(expiryDate) - Date.now()) / 86_400_000) : null;

    return {
      configured: true,
      domain: DOMAIN,
      status:    attr('DomainGetInfoResult', 'Status') || 'unknown',
      expiryDate,
      daysLeft,
      autoRenew: attr('DomainDetails', 'AutoRenew') === 'true',
      locked:    attr('DomainDetails', 'IsLocked') === 'true',
      whoisGuard: inner('WhoisGuard') || attr('Whoisguard', 'Enabled'),
      registrar: 'Namecheap',
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}

export async function checkMailProviders() {
  const [mailtm, mailgw, onesec] = await Promise.allSettled([
    (async () => {
      const { ok, latencyMs, response } = await timedFetch('https://api.mail.tm/domains?page=1');
      let domains = [];
      if (ok && response) {
        try { const d = await response.json(); domains = (Array.isArray(d) ? d : d['hydra:member'] || []).map(x => x.domain); } catch {}
      }
      return { ok, latencyMs, domains };
    })(),
    (async () => {
      const { ok, latencyMs } = await timedFetch('https://api.mail.gw/domains?page=1');
      return { ok, latencyMs };
    })(),
    (async () => {
      const { ok, latencyMs } = await timedFetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
      return { ok, latencyMs };
    })(),
  ]);

  return {
    mailtm:     { label: 'mail.tm',   ...(mailtm.status   === 'fulfilled' ? mailtm.value   : { ok: false, error: mailtm.reason?.message }) },
    mailgw:     { label: 'mail.gw',   ...(mailgw.status   === 'fulfilled' ? mailgw.value   : { ok: false, error: mailgw.reason?.message }) },
    onesecmail: { label: '1secmail',  ...(onesec.status   === 'fulfilled' ? onesec.value   : { ok: false, error: onesec.reason?.message }) },
  };
}

export function getSelfHealth(sessions) {
  const uptimeMs = Date.now() - START_TIME;
  const mem = process.memoryUsage();
  const byProvider = {};
  for (const [, s] of sessions) byProvider[s.provider] = (byProvider[s.provider] || 0) + 1;

  return {
    uptimeMs,
    uptimeHuman: formatDuration(uptimeMs),
    startTime: new Date(START_TIME).toISOString(),
    activeSessions: sessions.size,
    sessionsByProvider: byProvider,
    memoryMb: {
      rss:       +(mem.rss       / 1e6).toFixed(1),
      heapUsed:  +(mem.heapUsed  / 1e6).toFixed(1),
      heapTotal: +(mem.heapTotal / 1e6).toFixed(1),
    },
    nodeVersion: process.version,
    platform: process.platform,
  };
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export async function getAllMetrics(sessions) {
  const [site, ssl, dnsResult, render, namecheap, providers] = await Promise.allSettled([
    checkSite(),
    checkSsl(),
    checkDns(),
    checkRender(),
    checkNamecheap(),
    checkMailProviders(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    self: getSelfHealth(sessions),
    site:      site.status      === 'fulfilled' ? site.value      : { up: false, error: site.reason?.message },
    ssl:       ssl.status       === 'fulfilled' ? ssl.value       : { ok: false, error: ssl.reason?.message },
    dns:       dnsResult.status === 'fulfilled' ? dnsResult.value : { ok: false, error: dnsResult.reason?.message },
    render:    render.status    === 'fulfilled' ? render.value    : { configured: false, error: render.reason?.message },
    namecheap: namecheap.status === 'fulfilled' ? namecheap.value : { configured: false, error: namecheap.reason?.message },
    providers: providers.status === 'fulfilled' ? providers.value : {},
    costs: {
      render:    process.env.RENDER_PLAN_MONTHLY    ? { monthly: +process.env.RENDER_PLAN_MONTHLY, currency: 'USD' }  : { monthly: null },
      namecheap: process.env.NAMECHEAP_DOMAIN_ANNUAL ? { annual: +process.env.NAMECHEAP_DOMAIN_ANNUAL, currency: 'USD' } : { annual: null },
    },
  };
}
