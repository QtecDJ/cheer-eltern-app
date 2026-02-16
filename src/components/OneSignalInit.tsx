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

        await OneSignal.init({
          appId,
          safari_web_id: "web.onesignal.auto.25811132-3882-4d1b-a1e7-3632ed052841",
          allowLocalhostAsSecureOrigin: true,
          // Prevent automatic prompts - user clicks bell icon to subscribe
          autoRegister: false,
          autoResubscribe: true,
        });

        isInitialized.current = true;
        console.log('[OneSignal] Initialisiert');

        // Set external user ID (Member ID)
        try {
          const response = await fetch('/api/member/me');
          if (response.ok) {
            const { memberId } = await response.json();
            await OneSignal.login(`member_${memberId}`);
            console.log('[OneSignal] External user ID gesetzt:', `member_${memberId}`);
            
            // Check if user already granted permission but is not opted in
            const permission = await OneSignal.Notifications.permissionNative;
            const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
            
            console.log('[OneSignal] Permission:', permission, 'OptedIn:', isOptedIn);
            
            // If permission is granted but not opted in, opt in automatically (iOS PWA fix)
            if (permission === 'granted' && !isOptedIn) {
              console.log('[OneSignal] Auto opt-in for existing permission');
              await OneSignal.User.PushSubscription.optIn();
            }
          }
        } catch (error) {
          console.error('[OneSignal] Fehler beim Setzen der External User ID:', error);
        }
      } catch (error) {
        console.error('[OneSignal] Initialisierungs-Fehler:', error);
      }
    };

    initOneSignal();
  }, []);

  return null;
}
