/**
 * Web Push Utilities für User Client
 * Registriert Service Worker und verwaltet Push-Subscriptions
 * 
 * iOS-OPTIMIERT:
 * - Nutzt bestehende iOS-Detection Utilities
 * - Kompatibel mit iOS PWA Optimierungen
 * - Kurze Request-Timeouts für iOS
 */

import { ContentCacheUtils } from './content-cache';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Konvertiert Base64-String zu Uint8Array für VAPID Key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registriert Service Worker (falls noch nicht registriert)
 * iOS-SAFE: Nutzt bereits registrierten SW von service-worker.tsx
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[webPush] Service Worker not supported');
    return null;
  }

  try {
    // Warte auf bestehende Registrierung (von service-worker.tsx)
    const registration = await navigator.serviceWorker.ready;
    console.log('[webPush] Using existing Service Worker registration');
    return registration;
  } catch (error) {
    console.error('[webPush] Service Worker not ready:', error);
    
    // Fallback: Versuche neu zu registrieren
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[webPush] Service Worker registered:', registration);
      await navigator.serviceWorker.ready;
      return registration;
    } catch (registerError) {
      console.error('[webPush] Service Worker registration failed:', registerError);
      return null;
    }
  }
}

/**
 * Abonniert Push-Benachrichtigungen
 * iOS-SAFE: Nutzt Content Cache Utils für iOS-Detection
 */
export async function subscribeToPush(userId: number): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('[webPush] VAPID Public Key not configured');
    throw new Error('VAPID Public Key fehlt - Umgebungsvariable nicht gesetzt');
  }

  try {
    console.log('[webPush] Getting service worker registration...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[webPush] Service worker ready');
    
    // Prüfe ob bereits abonniert
    console.log('[webPush] Checking existing subscription...');
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[webPush] Already subscribed to push notifications');
      // Subscription an Backend senden (falls noch nicht vorhanden)
      console.log('[webPush] Saving existing subscription to backend...');
      await savePushSubscription(userId, subscription);
      return subscription;
    }

    // Neue Subscription erstellen
    console.log('[webPush] Creating new push subscription...');
    console.log('[webPush] VAPID key length:', VAPID_PUBLIC_KEY.length);
    
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log('[webPush] Application server key converted');
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource
    });

    console.log('[webPush] New push subscription created:', subscription.endpoint.substring(0, 50) + '...');
    
    // An Backend senden
    console.log('[webPush] Saving subscription to backend...');
    await savePushSubscription(userId, subscription);
    console.log('[webPush] Subscription saved successfully');
    
    return subscription;
  } catch (error) {
    console.error('[webPush] Failed to subscribe to push:', error);
    if (error instanceof Error) {
      throw new Error(`Push-Subscription fehlgeschlagen: ${error.message}`);
    }
    throw new Error('Push-Subscription fehlgeschlagen');
  }
}

/**
 * Deabonniert Push-Benachrichtigungen
 * iOS-SAFE: Schneller Cleanup
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('[webPush] No active subscription');
      return true;
    }

    const endpoint = subscription.endpoint;
    
    // Von Push-Service abmelden
    const success = await subscription.unsubscribe();
    
    if (success) {
      console.log('[webPush] Unsubscribed from push service');
      // Von Backend entfernen
      await removePushSubscription(endpoint);
    }
    
    return success;
  } catch (error) {
    console.error('[webPush] Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Prüft aktuelle Notification Permission
 */
export async function checkPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Fordert Notification Permission an
 * iOS-SAFE: User-initiated request (muss durch Button-Click getriggert werden)
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[webPush] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[webPush] Permission result:', permission);
  return permission;
}

/**
 * Prüft ob User bereits abonniert ist
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return false;
    
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// ============================================
// API CALLS
// ============================================

/**
 * Speichert Push Subscription im Backend
 * iOS-OPTIMIERT: Timeout für langsame Netzwerke
 */
async function savePushSubscription(userId: number, subscription: PushSubscription): Promise<void> {
  const isIOS = ContentCacheUtils.isIOSDevice();
  const timeout = isIOS ? 8000 : 10000; // iOS: kürzerer Timeout

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Konvertiere Keys zu Base64
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    if (!p256dhKey || !authKey) {
      throw new Error('Missing subscription keys');
    }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save subscription: ${error}`);
    }

    console.log('[webPush] Subscription saved to backend');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[webPush] Failed to save subscription:', error);
    throw error;
  }
}

/**
 * Entfernt Push Subscription vom Backend
 * iOS-OPTIMIERT: Timeout für langsame Netzwerke
 */
async function removePushSubscription(endpoint: string): Promise<void> {
  const isIOS = ContentCacheUtils.isIOSDevice();
  const timeout = isIOS ? 5000 : 8000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to remove subscription: ${error}`);
    }

    console.log('[webPush] Subscription removed from backend');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[webPush] Failed to remove subscription:', error);
    // Don't throw - subscription is already removed locally
  }
}
