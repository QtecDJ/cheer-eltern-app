"use client";

import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  trainingSessionId: number | null;
}

export interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Hook für In-App Benachrichtigungen mit Auto-Polling
 * 
 * Features:
 * - Automatisches Polling alle 30 Sekunden
 * - Pausiert wenn App im Hintergrund (document.hidden)
 * - Manuelle Refresh-Funktion
 * - Unread Counter
 */
export function useNotifications() {
  const [data, setData] = useState<NotificationData>({
    notifications: [],
    unreadCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[useNotifications] Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds?: number[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(
          notificationIds 
            ? { notificationIds } 
            : { markAll: true }
        )
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Refresh nach markieren
      await fetchNotifications();
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
    }
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-polling alle 30 Sekunden
  useEffect(() => {
    // Nur pollen wenn App im Vordergrund
    if (document.hidden) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000); // 30 Sekunden

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Pollen wenn App wieder in den Vordergrund kommt
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchNotifications]);

  return {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead
  };
}
