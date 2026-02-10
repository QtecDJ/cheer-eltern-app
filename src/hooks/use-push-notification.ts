"use client";

import { useState, useEffect } from 'react';

export function usePushNotification() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if push is supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);

    if (isSupported) {
      checkStatus();
    }
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/push/status');
      const data = await res.json();
      setEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check push status:', error);
    }
  }

  async function subscribe() {
    if (!supported) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const { endpoint } = subscription;
      const keys = subscription.toJSON().keys;

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
      });

      setEnabled(true);
    } catch (error) {
      console.error('Push subscription failed:', error);
      alert('Push-Benachrichtigungen konnten nicht aktiviert werden.');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!supported) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        await fetch('/api/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setEnabled(false);
    } catch (error) {
      console.error('Push unsubscription failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (enabled) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }

  return { enabled, loading, supported, toggle };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
