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

        // Check both permission AND subscription status (important for iOS)
        const permission = await OneSignal.Notifications.permissionNative;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        // Only show as enabled if BOTH permission is granted AND user is opted in
        setEnabled(permission === "granted" && (isOptedIn ?? false));
        setLoading(false);
      } catch (error) {
        console.error("[OneSignal] Status check error:", error);
        setLoading(false);
      }
    };

    checkStatus();

    // Listen for subscription changes
    const handleSubscriptionChange = async () => {
      try {
        const permission = await OneSignal.Notifications.permissionNative;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        console.log('[OneSignal] Subscription changed - Permission:', permission, 'OptedIn:', isOptedIn);
        setEnabled(permission === "granted" && (isOptedIn ?? false));
      } catch (error) {
        console.error('[OneSignal] Subscription change error:', error);
      }
    };

    OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange);

    return () => {
      OneSignal.User.PushSubscription.removeEventListener('change', handleSubscriptionChange);
    };
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
        try {
          // Check if permission is already granted
          const currentPermission = await OneSignal.Notifications.permissionNative;
          
          if (currentPermission === "granted") {
            // Already granted, just opt in
            await OneSignal.User.PushSubscription.optIn();
            const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
            setEnabled(isOptedIn ?? false);
          } else if (currentPermission === "denied") {
            // User previously denied, can't do anything
            console.warn('[OneSignal] Push notifications were denied. User must enable them in browser settings.');
            setEnabled(false);
          } else {
            // Request permission first
            await OneSignal.Notifications.requestPermission();
            const newPermission = await OneSignal.Notifications.permissionNative;
            
            if (newPermission === "granted") {
              // Permission granted, now opt in to create subscription
              await OneSignal.User.PushSubscription.optIn();
              const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
              setEnabled(isOptedIn ?? false);
            } else {
              setEnabled(false);
            }
          }
        } catch (permError: unknown) {
          // Silently handle slidedown errors
          console.warn('[OneSignal] Permission request error (expected if dismissed):', (permError as Error).message);
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
