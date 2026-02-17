"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export function OneSignalInit() {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) {
      console.log('[OneSignal] Already initialized, skipping');
      return;
    }

    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      
      if (!appId) {
        console.warn('[OneSignal] App ID nicht konfiguriert');
        return;
      }

      try {
        // Check if OneSignal is already initialized
        if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
          console.log('[OneSignal] SDK already loaded, skipping init');
          isInitialized.current = true;
          return;
        }

        console.log('[OneSignal] Starting initialization...');

        await OneSignal.init({
          appId,
          safari_web_id: "web.onesignal.auto.25811132-3882-4d1b-a1e7-3632ed052841",
          allowLocalhostAsSecureOrigin: true,
          // Prevent automatic prompts - user clicks bell icon to subscribe
          autoRegister: false,
          autoResubscribe: true,
          // Service Worker path for better iOS PWA support
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
        });

        isInitialized.current = true;
        console.log('[OneSignal] Initialization complete');

        // Set external user ID (Member ID)
        try {
          const response = await fetch('/api/member/me');
          if (response.ok) {
            const { memberId } = await response.json();
            await OneSignal.login(`member_${memberId}`);
            console.log('[OneSignal] External user ID set:', `member_${memberId}`);
            
            // Check current subscription status
            const permission = await OneSignal.Notifications.permissionNative;
            const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
            const playerId = await OneSignal.User.PushSubscription.id;
            
            console.log('[OneSignal] Initial status - Permission:', permission, 'OptedIn:', isOptedIn, 'PlayerId:', playerId);
            
            // If permission is granted but not opted in, opt in automatically (iOS PWA fix)
            if (permission === 'granted' && !isOptedIn) {
              console.log('[OneSignal] Auto opt-in for existing permission (iOS fix)');
              try {
                await OneSignal.User.PushSubscription.optIn();
                console.log('[OneSignal] Auto opt-in successful');
              } catch (optInError) {
                console.error('[OneSignal] Auto opt-in failed:', optInError);
              }
            }
          }
        } catch (error) {
          console.error('[OneSignal] Failed to set external user ID:', error);
        }
      } catch (error) {
        console.error('[OneSignal] Initialization error:', error);
      }
    };

    initOneSignal();
  }, []);

  return null;
}
