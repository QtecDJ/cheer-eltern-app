// Web Push Utility - VAPID
import webpush from 'web-push';

// VAPID keys configuration - must be set at runtime
function getVapidConfig() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  
  return { vapidPublicKey, vapidPrivateKey, vapidSubject };
}

// Initialize VAPID details
function initVapidDetails() {
  const { vapidPublicKey, vapidPrivateKey, vapidSubject } = getVapidConfig();
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[PUSH] VAPID keys not configured - push notifications will not work');
    return false;
  }
  
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log('[PUSH] VAPID details initialized successfully');
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to set VAPID details:', error);
    return false;
  }
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
  // Ensure VAPID is initialized
  if (!initVapidDetails()) {
    console.error('[PUSH] Cannot send notification - VAPID not configured');
    return { success: false, error: 'VAPID not configured' };
  }
  
  try {
    console.log('[PUSH] Sending notification:', { 
      title: payload.title, 
      endpoint: subscription.endpoint.substring(0, 50) + '...' 
    });
    
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
    
    console.log('[PUSH] Notification sent successfully');
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
  const { vapidPublicKey } = getVapidConfig();
  return vapidPublicKey;
}
