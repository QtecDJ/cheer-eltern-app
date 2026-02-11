"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      
      if (!appId) {
        console.warn('[OneSignal] App ID nicht konfiguriert');
        return;
      }

      try {
        await OneSignal.init({
          appId,
          safari_web_id: "web.onesignal.auto.1fe1b6c7-0a56-4e4e-8f4d-90df2b33bc74",
          allowLocalhostAsSecureOrigin: true,
          // Prevent automatic prompts
          autoRegister: false,
          autoResubscribe: true,
        });

        console.log('[OneSignal] Initialisiert');

        // Set external user ID (Member ID)
        try {
          const response = await fetch('/api/member/me');
          if (response.ok) {
            const { memberId } = await response.json();
            await OneSignal.login(`member_${memberId}`);
            console.log('[OneSignal] External user ID gesetzt:', `member_${memberId}`);
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
