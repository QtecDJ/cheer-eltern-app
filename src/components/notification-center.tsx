"use client";

import { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { Card } from '@/components/ui/card';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationCenter() {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    // Als gelesen markieren
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }

    // Navigieren wenn Link vorhanden
    if (notification.link) {
      router.push(notification.link);
    }

    // Schließen
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAsRead(); // Keine IDs = alle markieren
  };

  const formatDate = (dateString: string) => {
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
    
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative">
      {/* Bell Button mit Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-6 w-6 text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Benachrichtigungen
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Alle gelesen
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Lade Benachrichtigungen...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Keine Benachrichtigungen</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 text-center">
                <button
                  onClick={() => {
                    router.push('/benachrichtigungen');
                    setIsOpen(false);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Alle anzeigen
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
