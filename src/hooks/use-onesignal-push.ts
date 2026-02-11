"use client";

import { useState, useEffect } from "react";
import OneSignal from "react-onesignal";

export function useOneSignalPush() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if OneSignal is supported
        const isSupported = await OneSignal.Notifications.isPushSupported();
        setSupported(isSupported);

        if (!isSupported) {
          setLoading(false);
          return;
        }

        // Check permission status
        const permission = await OneSignal.Notifications.permissionNative;
        setEnabled(permission === "granted");
        setLoading(false);
      } catch (error) {
        console.error("[OneSignal] Status check error:", error);
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const toggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (enabled) {
        // Opt-out (unsubscribe)
        await OneSignal.User.PushSubscription.optOut();
        setEnabled(false);
      } else {
        // Opt-in (subscribe)
        await OneSignal.Notifications.requestPermission();
        const permission = await OneSignal.Notifications.permissionNative;
        setEnabled(permission === "granted");
      }
    } catch (error) {
      console.error("[OneSignal] Toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, supported, toggle };
}
