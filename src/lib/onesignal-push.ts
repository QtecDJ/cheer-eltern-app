// OneSignal Push Notification Utility - Server Side

const ONESIGNAL_API_URL = "https://api.onesignal.com";
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

interface OneSignalNotification {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

/**
 * Send push notification to a specific user via OneSignal Player ID
 */
export async function sendOneSignalPushToUser(
  oneSignalPlayerId: string,
  notification: OneSignalNotification
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] API keys not configured');
    return false;
  }

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [oneSignalPlayerId],
        headings: { en: notification.title },
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return false;
    }

    console.log('[OneSignal] Push sent successfully:', result.id);
    return true;
  } catch (error) {
    console.error('[OneSignal] Send error:', error);
    return false;
  }
}

/**
 * Send push notification to a user by looking up their OneSignal ID from external_user_id
 */
export async function sendOneSignalPushByExternalUserId(
  externalUserId: string,
  notification: OneSignalNotification
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] API keys not configured');
    return false;
  }

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [externalUserId],
        headings: { en: notification.title },
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return false;
    }

    console.log('[OneSignal] Push sent successfully:', result.id);
    return true;
  } catch (error) {
    console.error('[OneSignal] Send error:', error);
    return false;
  }
}

/**
 * Send push notification to multiple users by their member IDs
 */
export async function sendOneSignalPushToMultipleUsers(
  memberIds: number[],
  notification: OneSignalNotification
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] API keys not configured');
    return false;
  }

  if (memberIds.length === 0) {
    console.warn('[OneSignal] No member IDs provided');
    return false;
  }

  const externalUserIds = memberIds.map(id => `member_${id}`);

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: externalUserIds,
        headings: { en: notification.title },
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return false;
    }

    console.log(`[OneSignal] Push sent to ${memberIds.length} users:`, result.id);
    return true;
  } catch (error) {
    console.error('[OneSignal] Send error:', error);
    return false;
  }
}
