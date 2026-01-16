import { NextRequest, NextResponse } from "next/server";

/**
 * Test-Endpoint um Push-Konfiguration zu überprüfen
 */
export async function GET(request: NextRequest) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  return NextResponse.json({
    status: "ok",
    vapidPublicKeyConfigured: !!vapidPublicKey,
    vapidPublicKeyLength: vapidPublicKey?.length || 0,
    vapidPublicKeyPreview: vapidPublicKey ? vapidPublicKey.substring(0, 20) + "..." : "nicht gesetzt",
    vapidPrivateKeyConfigured: !!vapidPrivateKey,
    serviceWorkerSupport: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    notificationSupport: typeof window !== 'undefined' && 'Notification' in window,
    pushManagerSupport: typeof window !== 'undefined' && 'PushManager' in window,
  });
}
