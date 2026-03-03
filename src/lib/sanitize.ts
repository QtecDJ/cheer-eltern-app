/**
 * HTML Sanitization Utility
 *
 * Verwendet DOMPurify im Browser, um potentiell gefährlichen HTML-Content zu bereinigen.
 * Auf dem Server (SSR) wird der Inhalt unverändert zurückgegeben — alle Aufrufer
 * sind Client-Komponenten, die erst im Browser rendern.
 * So wird jsdom (und der ESM-Konflikt mit @exodus/bytes) nie server-seitig geladen.
 */

type DOMPurifyInstance = {
  sanitize(dirty: string, config?: Record<string, unknown>): string;
};

let purify: DOMPurifyInstance | null = null;

function getPurify(): DOMPurifyInstance | null {
  if (typeof window === 'undefined') return null;
  if (purify) return purify;
  // dompurify ist transitive Abhängigkeit von isomorphic-dompurify — direkt verwenden
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const createDOMPurify = require('dompurify');
  purify = typeof createDOMPurify === 'function'
    ? createDOMPurify(window)
    : createDOMPurify;
  return purify;
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a',
  'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img',
  'hr',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id', 'style',
  'src', 'alt', 'width', 'height', 'title',
];

const SAFE_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Bereinigt HTML-Content und entfernt gefährliche Tags/Attribute.
 * Im Browser via DOMPurify, auf dem Server Passthrough (kein jsdom).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  const dp = getPurify();
  if (!dp) return dirty; // server-side: kein jsdom, Passthrough
  return dp.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: SAFE_URI,
  });
}

/**
 * Bereinigt einzelne Attribute (z.B. title, alt) — entfernt alle HTML-Tags.
 */
export function sanitizeAttribute(attr: string): string {
  if (!attr) return '';
  const dp = getPurify();
  if (!dp) return attr;
  return dp.sanitize(attr, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Strikte Bereinigung (z.B. für Kommentare) — nur grundlegende Textformatierung.
 */
export function sanitizeHtmlStrict(dirty: string): string {
  if (!dirty) return '';
  const dp = getPurify();
  if (!dp) return dirty;
  return dp.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
