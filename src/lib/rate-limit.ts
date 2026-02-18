/**
 * Rate Limiting Utility
 * 
 * Einfache In-Memory Rate Limiting Implementation.
 * Für Produktion mit mehreren Servern sollte Redis/Upstash verwendet werden.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-Memory Storage für Request-Timestamps
const requests = new Map<string, number[]>();

export interface RateLimitOptions {
  requests: number;  // Maximale Anzahl Requests
  window: number;    // Zeitfenster in Sekunden
}

/**
 * Rate Limiting Middleware
 * 
 * @param options - Konfiguration (requests pro window)
 * @returns Middleware-Funktion
 */
export function rateLimit(options: RateLimitOptions) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const windowMs = options.window * 1000;
    
    // Hole bisherige Requests für diesen Client
    const requestTimestamps = requests.get(identifier) || [];
    
    // Filtere nur Requests innerhalb des Zeitfensters
    const recentRequests = requestTimestamps.filter(time => now - time < windowMs);
    
    // Prüfe ob Limit überschritten
    if (recentRequests.length >= options.requests) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return NextResponse.json(
        { 
          error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(options.requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((oldestRequest + windowMs) / 1000)),
          }
        }
      );
    }
    
    // Füge aktuellen Request hinzu
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    // Cleanup alte Einträge (1% Chance)
    if (Math.random() < 0.01) {
      cleanup(windowMs * 2); // Cleanup nach 2x window
    }
    
    // Request erlaubt
    return null;
  };
}

/**
 * Extrahiert eindeutigen Client-Identifier aus Request
 * Verwendet IP-Adresse oder Session-ID
 */
function getClientIdentifier(request: NextRequest): string {
  // Versuche IP-Adresse aus Headers zu extrahieren
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    // Erste IP aus x-forwarded-for Liste
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback auf Session-Cookie (falls vorhanden)
  const sessionCookie = request.cookies.get('member_session');
  if (sessionCookie) {
    return `session:${sessionCookie.value}`;
  }
  
  // Fallback auf 'unknown' (wird alle unbekannten Clients zusammenfassen)
  console.warn('[rate-limit] Could not identify client, using fallback');
  return 'unknown';
}

/**
 * Entfernt alte Request-Einträge aus dem Speicher
 */
function cleanup(maxAge: number) {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, timestamps] of requests.entries()) {
    const recent = timestamps.filter(time => now - time < maxAge);
    
    if (recent.length === 0) {
      requests.delete(key);
      cleaned++;
    } else if (recent.length < timestamps.length) {
      requests.set(key, recent);
    }
  }
  
  if (cleaned > 0) {
    console.log(`[rate-limit] Cleaned up ${cleaned} expired entries`);
  }
}

/**
 * Vordefinierte Rate Limit Presets
 */
export const RateLimitPresets = {
  // Authentifizierung: Sehr strikt
  AUTH: { requests: 5, window: 60 * 5 },      // 5 requests per 5 minutes
  
  // Schreib-Operationen: Moderat
  WRITE: { requests: 30, window: 60 },        // 30 requests per minute
  
  // Lese-Operationen: Großzügig
  READ: { requests: 100, window: 60 },        // 100 requests per minute
  
  // Upload: Sehr strikt
  UPLOAD: { requests: 10, window: 60 * 10 },  // 10 requests per 10 minutes
  
  // Standard: Ausgewogen
  STANDARD: { requests: 60, window: 60 },     // 60 requests per minute
};

/**
 * Helper um Rate Limit in API Route zu verwenden
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request, RateLimitPresets.WRITE);
 *   if (rateLimitResult) return rateLimitResult;
 *   
 *   // Handle request...
 * }
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const limiter = rateLimit(options);
  return limiter(request);
}
