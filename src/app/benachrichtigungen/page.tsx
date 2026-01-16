"use client";

import { useNotifications } from '@/hooks/use-notifications';
import { Card } from '@/components/ui/card';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BenachrichtigungenPage() {
  const { notifications, unreadCount, loading, refresh, markAsRead } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Als gelesen markieren
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }

    // Navigieren wenn Link vorhanden
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAsRead(); // Keine IDs = alle markieren
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    
    return formatDate(dateString);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Benachrichtigungen</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} ungelesen
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Alle gelesen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Lade Benachrichtigungen...
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-semibold mb-2">Keine Benachrichtigungen</h2>
          <p className="text-muted-foreground">
            Du bist auf dem neuesten Stand!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="cursor-pointer"
            >
              <Card
                className={`p-4 hover:shadow-md transition-all ${
                  !notification.isRead 
                    ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                    : ''
                }`}
              >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-medium ${
                      !notification.isRead 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  {notification.link && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Zum Öffnen antippen →
                    </p>
                  )}
                </div>
              </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
