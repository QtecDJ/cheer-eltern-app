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
        // Opt-in (subscribe) - use direct permission request to avoid slidedown errors
        try {
          // Check if permission is already granted
          const currentPermission = await OneSignal.Notifications.permissionNative;
          
          if (currentPermission === "granted") {
            // Already granted, just opt in
            await OneSignal.User.PushSubscription.optIn();
            setEnabled(true);
          } else if (currentPermission === "denied") {
            // User previously denied, can't do anything
            console.warn('[OneSignal] Push notifications were denied. User must enable them in browser settings.');
            setEnabled(false);
          } else {
            // Request permission
            await OneSignal.Notifications.requestPermission();
            const newPermission = await OneSignal.Notifications.permissionNative;
            setEnabled(newPermission === "granted");
          }
        } catch (permError: any) {
          // Silently handle slidedown errors
          console.warn('[OneSignal] Permission request error (expected if dismissed):', permError.message);
          setEnabled(false);
        }
      }
    } catch (error) {
      console.error("[OneSignal] Toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, supported, toggle };
}
