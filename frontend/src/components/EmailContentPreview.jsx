import React, { useRef, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  const bg = s.getPropertyValue('--background').trim();
  const fg = s.getPropertyValue('--foreground').trim();
  return {
    bg: bg ? `hsl(${bg})` : '#ffffff',
    fg: fg ? `hsl(${fg})` : '#1a1a1a',
  };
}

// Split into two <style> blocks so we can swap only the theme block without touching the rest.
function makeHead(bg, fg) {
  const themeCSS = [
    `html{background:${bg};color:${fg}}`,
    `body{background:${bg};color:${fg};margin:0;padding:16px;`,
    `font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;`,
    `font-size:14px;line-height:1.6}`,
  ].join('');
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    // Suppress referrer header so sender CDNs don't gate images by origin
    '<meta name="referrer" content="no-referrer">',
    '<base target="_blank">',
    `<style id="__theme__">${themeCSS}</style>`,
    '<style>',
    'img{max-width:100%!important;height:auto!important;display:block}',
    'table{max-width:100%!important}',
    'td,th{word-break:break-word}',
    '*{box-sizing:border-box}',
    '</style>',
  ].join('');
}

// Handles both cid: and attachment: src schemes.
function buildSrcDoc(html, cidMap, bg, fg) {
  const HEAD = makeHead(bg, fg);
  let out = html.replace(
    /src=(["']?)(?:cid:|attachment:)([^"'\s>@]*)(?:@[^"'\s>]*)?\1/gi,
    (match, q, name) => {
      const key = name.toLowerCase();
      const uri = cidMap[key] || cidMap[key.replace(/\.[^.]+$/, '')];
      return uri ? `src="${uri}"` : match;
    }
  );
  if (/<head(\s[^>]*)?>/i.test(out)) return out.replace(/(<head(?:\s[^>]*)?>)/i, m => m + HEAD);
  if (/<body(\s[^>]*)?>/i.test(out)) return out.replace(/(<body(?:\s[^>]*)?>)/i, m => `<head>${HEAD}</head>${m}`);
  return `<!DOCTYPE html><html><head>${HEAD}</head><body>${out}</body></html>`;
}

function applyThemeToIframe(iframe) {
  try {
    const doc = iframe?.contentDocument;
    const style = doc?.getElementById('__theme__');
    if (!style) return;
    const { bg, fg } = getThemeColors();
    style.textContent = [
      `html{background:${bg};color:${fg}}`,
      `body{background:${bg};color:${fg};margin:0;padding:16px;`,
      `font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;`,
      `font-size:14px;line-height:1.6}`,
    ].join('');
  } catch (_) {}
}

export default function EmailContentPreview({ email, isLoading }) {
  const { t } = useI18n();
  const iframeRef = useRef(null);

  // On dark/light toggle, patch the iframe's theme style directly — no iframe reload.
  useEffect(() => {
    const observer = new MutationObserver(() => applyThemeToIframe(iframeRef.current));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Only rebuild srcDoc when the email actually changes, not on every render.
  const srcDoc = useMemo(() => {
    if (!email?.html) return null;
    const { bg, fg } = getThemeColors();
    return buildSrcDoc(email.html, email.cidMap ?? {}, bg, fg);
  }, [email?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8">
        <p className="text-sm text-center">{t('emailContentNotSelected')}</p>
      </div>
    );
  }

  if (isLoading || email._loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">{t('emailContentLoading')}</p>
      </div>
    );
  }

  const rawBodyText = typeof email.text === 'string' ? email.text : (email.text || []).join('\n');
  const bodyText = rawBodyText
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-5 pt-5 pb-4 border-b border-border/60 flex-shrink-0">
        <h2 className="text-base font-semibold text-foreground mb-3 leading-snug">
          {email.subject}
        </h2>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p><span className="font-medium text-foreground/80">{t('emailContentFrom')}:</span> {email.from}</p>
          {email.to && <p><span className="font-medium text-foreground/80">{t('emailContentTo')}:</span> {email.to}</p>}
          <p><span className="font-medium text-foreground/80">{t('emailContentDate')}:</span> {new Date(email.date).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {srcDoc ? (
          <iframe
            ref={iframeRef}
            key={email.id}
            srcDoc={srcDoc}
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            className="w-full border-0 rounded-lg bg-background"
            style={{ minHeight: 300 }}
            title="Email content"
            onLoad={e => {
              const iframe = e.target;
              const resize = () => {
                try {
                  const doc = iframe.contentDocument;
                  if (doc?.documentElement) {
                    iframe.style.height = doc.documentElement.scrollHeight + 'px';
                  }
                } catch (_) {}
              };
              resize();
              // Re-measure once all images inside the email have loaded
              try {
                const imgs = Array.from(iframe.contentDocument?.images ?? []);
                if (imgs.length > 0) {
                  let pending = imgs.length;
                  const done = () => { if (--pending === 0) resize(); };
                  imgs.forEach(img => {
                    if (img.complete) { done(); }
                    else { img.addEventListener('load', done); img.addEventListener('error', done); }
                  });
                }
              } catch (_) {}
            }}
          />
        ) : (
          <pre className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
            {bodyText || email.intro || '(no content)'}
          </pre>
        )}
      </div>
    </div>
  );
}
