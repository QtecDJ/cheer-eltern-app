/**
 * HTML Sanitization Utility
 * 
 * Verwendet DOMPurify um potentiell gefährlichen HTML-Content zu bereinigen
 * und XSS-Angriffe zu verhindern.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Bereinigt HTML-Content und entfernt gefährliche Tags/Attribute
 * 
 * @param dirty - Unbereinigter HTML-String
 * @returns Sicherer HTML-String
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Text-Formatierung
      'p', 'br', 'strong', 'em', 'u', 's', 'span', 'div',
      // Überschriften
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Listen
      'ul', 'ol', 'li',
      // Links
      'a',
      // Quotes und Code
      'blockquote', 'code', 'pre',
      // Tabellen
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Bilder
      'img',
      // Sonstige
      'hr',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'width', 'height', 'title',
    ],
    // Nur sichere URLs erlauben (keine javascript:, data: etc.)
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Bereinigt einzelne Attribute (z.B. für title, alt)
 * Entfernt alle HTML-Tags
 * 
 * @param attr - Attribute-String
 * @returns Bereinigter Text
 */
export function sanitizeAttribute(attr: string): string {
  if (!attr) return '';
  
  return DOMPurify.sanitize(attr, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
}

/**
 * Bereinigt HTML mit strengeren Regeln (z.B. für Kommentare)
 * Erlaubt nur grundlegende Text-Formatierung
 * 
 * @param dirty - Unbereinigter HTML-String
 * @returns Sicherer HTML-String mit eingeschränkten Tags
 */
export function sanitizeHtmlStrict(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
