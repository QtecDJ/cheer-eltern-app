"use client";

import { useState, useEffect } from "react";
import OneSignal from "react-onesignal";

export function useOneSignalPush() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Wait for OneSignal initialization
    const waitForInit = async () => {
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max wait
      
      while (attempts < maxAttempts) {
        try {
          // Check if OneSignal is initialized by trying to access it
          const isSupported = await OneSignal.Notifications.isPushSupported();
          if (isSupported !== undefined) {
            setInitialized(true);
            return true;
          }
        } catch (error) {
          // Not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return false;
    };

    waitForInit().then(ready => {
      if (ready) {
        checkStatus();
      } else {
        console.warn('[OneSignal] Initialization timeout');
        setLoading(false);
      }
    });
  }, []);

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
      
      console.log('[OneSignal] Status - Permission:', permission, 'OptedIn:', isOptedIn);
      
      // Only show as enabled if BOTH permission is granted AND user is opted in
      setEnabled(permission === "granted" && (isOptedIn ?? false));
      setLoading(false);
    } catch (error) {
      console.error("[OneSignal] Status check error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;

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
  }, [initialized]);

  const toggle = async () => {
    if (loading || !initialized) {
      console.warn('[OneSignal] Not ready yet');
      return;
    }
    
    setLoading(true);
    try {
      if (enabled) {
        // Opt-out (unsubscribe)
        console.log('[OneSignal] Opting out...');
        await OneSignal.User.PushSubscription.optOut();
        setEnabled(false);
        console.log('[OneSignal] Opted out successfully');
      } else {
        // Opt-in (subscribe)
        console.log('[OneSignal] Starting opt-in process...');
        try {
          // Check if permission is already granted
          const currentPermission = await OneSignal.Notifications.permissionNative;
          console.log('[OneSignal] Current permission:', currentPermission);
          
          if (currentPermission === "granted") {
            // Already granted, just opt in
            console.log('[OneSignal] Permission already granted, opting in...');
            await OneSignal.User.PushSubscription.optIn();
            
            // Wait a moment for subscription to be created
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
            console.log('[OneSignal] Opt-in result:', isOptedIn);
            setEnabled(isOptedIn ?? false);
          } else if (currentPermission === "denied") {
            // User previously denied, show message
            console.warn('[OneSignal] Push notifications were denied. User must enable them in system settings.');
            alert('Push-Benachrichtigungen wurden blockiert. Bitte aktiviere sie in deinen Browser- oder Geräteeinstellungen.');
            setEnabled(false);
          } else {
            // Request permission first
            console.log('[OneSignal] Requesting permission...');
            await OneSignal.Notifications.requestPermission();
            
            // Wait for permission to be processed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newPermission = await OneSignal.Notifications.permissionNative;
            console.log('[OneSignal] New permission:', newPermission);
            
            if (newPermission === "granted") {
              // Permission granted, now opt in to create subscription
              console.log('[OneSignal] Permission granted, opting in...');
              await OneSignal.User.PushSubscription.optIn();
              
              // Wait a moment for subscription to be created
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
              console.log('[OneSignal] Opt-in result:', isOptedIn);
              setEnabled(isOptedIn ?? false);
            } else {
              console.log('[OneSignal] Permission not granted');
              setEnabled(false);
            }
          }
        } catch (permError: unknown) {
          // Handle slidedown dismissal or other errors
          const errorMessage = (permError as Error).message;
          console.warn('[OneSignal] Permission/opt-in error:', errorMessage);
          
          // Check if it's just a dismissal
          if (errorMessage.includes('dismissed') || errorMessage.includes('closed')) {
            console.log('[OneSignal] User dismissed the prompt');
          } else {
            console.error('[OneSignal] Unexpected error:', permError);
          }
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
