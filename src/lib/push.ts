// Web Push Utility - VAPID
import webpush from 'web-push';

// VAPID keys from env
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: any) {
    // Handle different types of errors
    const errorCode = error.code || error.statusCode;
    
    // 410 = subscription expired, 404 = not found, 401 = unauthorized (expired token)
    // These should be removed from the database
    if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 401) {
      console.warn(`Push subscription expired/invalid (${error.statusCode}):`, {
        endpoint: subscription.endpoint.substring(0, 60) + '...'
      });
      return { success: false, expired: true };
    }
    
    // Temporary network errors - log as warning, not error
    if (errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
      console.warn(`Push notification temporary network error (${errorCode}):`, {
        host: error.host,
        code: errorCode,
        endpoint: subscription.endpoint.substring(0, 50) + '...'
      });
      return { success: false, temporary: true, error: error.message };
    }
    
    // Other errors - log as error
    console.error('Push send error:', error);
    return { success: false, error: error.message };
  }
}

export function getVapidPublicKey() {
  return vapidPublicKey;
}
