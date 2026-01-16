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
    setLoading(true);
    try {
      // 1. Service Worker registrieren (falls noch nicht aktiv)
      const registration = await registerServiceWorker();
      if (!registration) {
        alert('❌ Service Worker nicht verfügbar\n\nMögliche Gründe:\n• Du bist im InPrivate/Inkognito-Modus\n• Windows Benachrichtigungen sind deaktiviert\n• Browser-Einstellungen blockieren Service Worker\n\nLösung:\n• Öffne die Seite in einem normalen Browser-Fenster\n• Aktiviere Windows Benachrichtigungen\n• Teste auf dem Production-Server mit HTTPS');
        setLoading(false);
        return;
      }

      // 2. Permission anfragen (MUSS durch User-Click getriggert werden - iOS Requirement)
      const newPermission = await requestPushPermission();
      setPermission(newPermission);

      if (newPermission !== 'granted') {
        console.warn('[EnablePushNotifications] Permission denied');
        return;
      }

      // 3. Push abonnieren
      const subscription = await subscribeToPush(userId);
      if (subscription) {
        setIsSubscribed(true);
        console.log('[EnablePushNotifications] Successfully subscribed');
        
        // Optional: Show success feedback
        if ('vibrate' in navigator && !isIOS) {
          navigator.vibrate(200);
        }
      }
    } catch (error) {
      console.error('[EnablePushNotifications] Error enabling:', error);
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
