// OneSignal Push Notification Utility - Server Side

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1";
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Strip HTML tags and decode common HTML entities from a string.
 * Safe to call on plain text as well.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate a string to maxLen characters, appending "…" if cut.
 */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

interface OneSignalNotification {
  title: string;
  /** iOS subtitle (shown between title and body) */
  subtitle?: string;
  body: string;
  url: string;
  icon?: string;
  /** OneSignal priority 1–10. Use 10 for urgent. Default: 7 */
  priority?: number;
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
        ...(notification.subtitle ? { subtitle: { en: notification.subtitle } } : {}),
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
        priority: notification.priority ?? 7,
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
        ...(notification.subtitle ? { subtitle: { en: notification.subtitle } } : {}),
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
        priority: notification.priority ?? 7,
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
        ...(notification.subtitle ? { subtitle: { en: notification.subtitle } } : {}),
        contents: { en: notification.body },
        url: notification.url,
        icon: notification.icon || '/icons/icon-192x192.png',
        chrome_web_icon: notification.icon || '/icons/icon-192x192.png',
        priority: notification.priority ?? 7,
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
