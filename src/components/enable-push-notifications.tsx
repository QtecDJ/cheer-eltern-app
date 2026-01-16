"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  registerServiceWorker, 
  subscribeToPush, 
  unsubscribeFromPush, 
  checkPushPermission,
  requestPushPermission,
  isPushSubscribed
} from '@/lib/web-push';
import { ContentCacheUtils } from '@/lib/content-cache';
import { cn } from '@/lib/utils';

interface EnablePushNotificationsProps {
  userId: number;
  /** Kompakt-Modus: Nur Icon-Button ohne Card */
  compact?: boolean;
  /** Custom Styling */
  className?: string;
}

/**
 * Push-Benachrichtigungs Component
 * 
 * iOS-OPTIMIERT:
 * - Nutzt bestehende iOS-Detection
 * - User-initiated requests (iOS Requirement)
 * - Graceful degradation wenn nicht unterstützt
 */
export function EnablePushNotifications({ 
  userId, 
  compact = false,
  className 
}: EnablePushNotificationsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // iOS Detection
  const isIOS = ContentCacheUtils.isIOSDevice();
  const isIOSPWA = ContentCacheUtils.isIOSPWA();

  useEffect(() => {
    checkStatus();
    
    // Debug: Log VAPID Key Status
    if (typeof window !== 'undefined') {
      const hasVapidKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log('[EnablePushNotifications] VAPID Key configured:', hasVapidKey);
      if (!hasVapidKey) {
        console.error('[EnablePushNotifications] ⚠️ VAPID Public Key fehlt! Bitte Server neu starten nach .env Änderungen');
      }
    }
  }, []);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const currentPermission = await checkPushPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('[EnablePushNotifications] Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleEnable = async () => {
    // iOS Safari Check: Push nur in PWA-Modus
    if (isIOS && !isIOSPWA) {
      console.log('[EnablePushNotifications] iOS Safari detected - not in PWA mode');
      alert('📱 iOS: App zum Home-Bildschirm hinzufügen\n\nPush-Benachrichtigungen funktionieren auf iOS nur als installierte App.\n\nSo gehts:\n1. Tippe auf das Teilen-Symbol (⬆️)\n2. Wähle "Zum Home-Bildschirm"\n3. Tippe auf "Hinzufügen"\n4. Öffne die App vom Home-Bildschirm\n5. Aktiviere dann die Benachrichtigungen');
      return;
    }

    setLoading(true);
    
    // iOS spezifisches Feedback
    if (isIOS && isIOSPWA) {
      console.log('[EnablePushNotifications] iOS PWA detected - proceeding with caution');
    }
    
    try {
      console.log('[EnablePushNotifications] Starting push subscription...', {
        isIOS,
        isIOSPWA,
        hasNotificationAPI: 'Notification' in window,
        hasPushManager: 'PushManager' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        userAgent: navigator.userAgent.substring(0, 100)
      });
      
      // Prüfe ob Push Manager verfügbar ist
      if (!('PushManager' in window)) {
        console.error('[EnablePushNotifications] PushManager not available');
        throw new Error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      }
      
      // Prüfe Service Worker Support
      if (!('serviceWorker' in navigator)) {
        console.error('[EnablePushNotifications] Service Worker not supported');
        throw new Error('Service Worker wird nicht unterstützt');
      }
      
      // Timeout für den gesamten Prozess - viel länger für iOS
      const timeout = isIOS ? 45000 : 15000; // iOS: 45 Sekunden
      console.log('[EnablePushNotifications] Using timeout:', timeout, 'ms');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          console.error('[EnablePushNotifications] Timeout reached after', timeout, 'ms');
          reject(new Error('Timeout: Vorgang dauerte zu lange'));
        }, timeout)
      );

      const enablePromise = (async () => {
        // 1. Service Worker registrieren (falls noch nicht aktiv)
        console.log('[EnablePushNotifications] Step 1: Checking Service Worker...');
        const registration = await registerServiceWorker();
        if (!registration) {
          console.error('[EnablePushNotifications] Service Worker registration failed');
          throw new Error('Service Worker nicht verfügbar');
        }
        console.log('[EnablePushNotifications] ✓ Service Worker ready');

        // 2. Permission anfragen (MUSS durch User-Click getriggert werden - iOS Requirement)
        console.log('[EnablePushNotifications] Step 2: Requesting permission...');
        const newPermission = await requestPushPermission();
        console.log('[EnablePushNotifications] Permission response:', newPermission);
        setPermission(newPermission);

        if (newPermission !== 'granted') {
          console.warn('[EnablePushNotifications] Permission not granted:', newPermission);
          throw new Error('Benachrichtigungen wurden abgelehnt');
        }
        console.log('[EnablePushNotifications] ✓ Permission granted');

        // 3. Push abonnieren
        console.log('[EnablePushNotifications] Step 3: Subscribing to push...');
        const subscription = await subscribeToPush(userId);
        if (!subscription) {
          console.error('[EnablePushNotifications] Subscribe returned null');
          throw new Error('Push-Subscription fehlgeschlagen');
        }
        
        console.log('[EnablePushNotifications] ✓ Successfully subscribed');
        setIsSubscribed(true);
        
        // Optional: Show success feedback
        if ('vibrate' in navigator && !isIOS) {
          navigator.vibrate(200);
        }
      })();

      await Promise.race([enablePromise, timeoutPromise]);
      
    } catch (error) {
      console.error('[EnablePushNotifications] Error enabling:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      if (errorMessage.includes('Service Worker nicht verfügbar')) {
        alert('❌ Service Worker nicht verfügbar\n\nMögliche Gründe:\n• Du bist im InPrivate/Inkognito-Modus\n• Windows Benachrichtigungen sind deaktiviert\n• Browser-Einstellungen blockieren Service Worker\n\nLösung:\n• Öffne die Seite in einem normalen Browser-Fenster\n• Aktiviere Windows Benachrichtigungen\n• Teste auf dem Production-Server mit HTTPS');
      } else if (errorMessage.includes('Timeout')) {
        alert('⏱️ Zeitüberschreitung\n\nDie Anfrage dauerte zu lange.\n\n' + 
          (isIOS 
            ? 'iOS-Tipp: Stelle sicher, dass du eine stabile Internetverbindung hast und die App als PWA installiert ist.'
            : 'Bitte versuche es erneut oder überprüfe deine Internetverbindung.'));
      } else if (errorMessage.includes('abgelehnt')) {
        alert('❌ Benachrichtigungen abgelehnt\n\nDu hast Benachrichtigungen abgelehnt.\n\nSo aktivierst du sie:\n1. Klicke auf das Schloss-Symbol 🔒 in der Adressleiste\n2. Erlaube "Benachrichtigungen"\n3. Lade die Seite neu');
      } else {
        alert(`❌ Fehler\n\n${errorMessage}\n\nBitte versuche es später erneut.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        console.log('[EnablePushNotifications] Successfully unsubscribed');
      }
    } catch (error) {
      console.error('[EnablePushNotifications] Error disabling:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kompakt-Modus: Nur Icon-Button
  if (compact) {
    const handleClick = () => {
      if (permission === 'denied') {
        alert('❌ Push-Benachrichtigungen wurden blockiert.\n\nSo aktivierst du sie:\n\n1. Klicke auf das Schloss-Symbol 🔒 in der Adressleiste\n2. Erlaube "Benachrichtigungen"\n3. Lade die Seite neu');
        return;
      }
      
      // iOS Safari Check
      if (isIOS && !isIOSPWA) {
        alert('📱 iOS: App zum Home-Bildschirm hinzufügen\n\nPush-Benachrichtigungen funktionieren auf iOS nur als installierte App.\n\nSo gehts:\n1. Tippe auf das Teilen-Symbol (⬆️)\n2. Wähle "Zum Home-Bildschirm"\n3. Tippe auf "Hinzufügen"\n4. Öffne die App vom Home-Bildschirm\n5. Aktiviere dann die Benachrichtigungen');
        return;
      }
      
      if (isSubscribed) {
        handleDisable();
      } else {
        handleEnable();
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={loading || checkingStatus}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200",
          isSubscribed 
            ? "bg-primary/10 text-primary hover:bg-primary/20" 
            : permission === 'denied'
            ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
            : "hover:bg-secondary",
          (loading || checkingStatus) && "opacity-50 cursor-wait",
          className
        )}
        title={
          permission === 'denied' 
            ? 'Benachrichtigungen blockiert - Klicke für Hilfe' 
            : isSubscribed 
            ? 'Push-Benachrichtigungen aktiv' 
            : 'Push-Benachrichtigungen aktivieren'
        }
      >
        {loading || checkingStatus ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Bell className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </>
        ) : (
          <BellOff className="w-6 h-6" />
        )}
      </button>
    );
  }

  // Vollständige Card-Ansicht
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSubscribed ? "bg-green-100 dark:bg-green-950" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                isSubscribed ? "text-green-600 dark:text-green-400" : "text-gray-600"
              )} />
            </div>
            <CardTitle className="text-lg">Push-Benachrichtigungen</CardTitle>
          </div>
          
          {/* Status Badge */}
          {permission === 'granted' && isSubscribed && (
            <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Check className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          )}
          {permission === 'denied' && (
            <Badge variant="danger">
              <X className="h-3 w-3 mr-1" />
              Blockiert
            </Badge>
          )}
        </div>
      </CardHeader>

      <div className="px-4 pb-4 space-y-4">
        {/* iOS Warning */}
        {isIOS && !isIOSPWA && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm border border-amber-200 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
              📱 iOS Safari
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Für Push-Benachrichtigungen auf iOS, installiere die App auf deinem Home-Bildschirm.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            📬 Du erhältst Benachrichtigungen für:
          </p>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Neue Ankündigungen</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Training-Erinnerungen</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Wichtige Updates</span>
            </li>
          </ul>
        </div>

        {/* Permission Denied Info */}
        {permission === 'denied' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm border border-red-200 dark:border-red-800">
            <p className="font-medium text-red-900 dark:text-red-200 mb-1">
              ❌ Benachrichtigungen blockiert
            </p>
            <p className="text-red-700 dark:text-red-300">
              Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.
            </p>
          </div>
        )}

        {/* Action Button */}
        {permission !== 'denied' && (
          <button
            onClick={isSubscribed ? handleDisable : handleEnable}
            disabled={loading || checkingStatus}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-medium transition-all duration-200",
              "flex items-center justify-center gap-2",
              isSubscribed
                ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
              (loading || checkingStatus) && "opacity-50 cursor-wait"
            )}
          >
            {loading || checkingStatus ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loading ? 'Wird verarbeitet...' : 'Lade Status...'}
              </>
            ) : isSubscribed ? (
              <>
                <BellOff className="h-4 w-4" />
                Benachrichtigungen deaktivieren
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Benachrichtigungen aktivieren
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  );
}
