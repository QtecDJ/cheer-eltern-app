/**
 * Beispiel-Komponente für Version-Based Content Caching
 * 
 * Zeigt praktische Implementierung für Event Descriptions
 * 
 * VERWENDUNG:
 * Kopiere diese Komponente und passe sie an deine Bedürfnisse an
 */

"use client";

import { useVersionedContent } from '@/lib/use-versioned-content';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';

// ============================================
// EXAMPLE 1: Event Description
// ============================================

interface EventDescriptionProps {
  eventId: number;
  eventUpdatedAt: string; // ISO timestamp from server
  showCacheIndicator?: boolean;
}

export function EventDescriptionCached({
  eventId,
  eventUpdatedAt,
  showCacheIndicator = false,
}: EventDescriptionProps) {
  const { content, loading, error, isFromCache, refetch } = useVersionedContent<{
    description: string;
    longDescription?: string;
  }>({
    key: `event-${eventId}-description`,
    fetcher: async () => {
      const res = await fetch(`/api/events/${eventId}/description`);
      if (!res.ok) throw new Error('Failed to load event description');
      return res.json();
    },
    version: eventUpdatedAt,
    ttl: 14 * 24 * 60 * 60 * 1000, // 14 Tage (Event Descriptions ändern sich selten)
  });

  // Loading State (nur beim ersten Laden, nicht bei cached)
  if (loading && !content) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900">Fehler beim Laden</h4>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Content
  if (!content) return null;

  return (
    <div className="space-y-4">
      {/* Cache Indicator (optional) */}
      {showCacheIndicator && isFromCache && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
          <Clock className="w-3 h-3" />
          <span>Aus Cache geladen</span>
        </div>
      )}

      {/* Description */}
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700">{content.description}</p>
        {content.longDescription && (
          <div className="mt-4 text-gray-600">
            {content.longDescription}
          </div>
        )}
      </div>

      {/* Manual Refresh (optional) */}
      {isFromCache && (
        <button
          onClick={() => refetch()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Aktualisieren
        </button>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 2: Announcement Content
// ============================================

interface AnnouncementContentProps {
  announcementId: number;
  announcementUpdatedAt: string;
  category: string;
}

export function AnnouncementContentCached({
  announcementId,
  announcementUpdatedAt,
  category,
}: AnnouncementContentProps) {
  const { content, loading, error } = useVersionedContent<{
    title: string;
    content: string;
    priority: string;
  }>({
    key: `announcement-${announcementId}`,
    fetcher: async () => {
      const res = await fetch(`/api/announcements/${announcementId}`);
      if (!res.ok) throw new Error('Failed to load announcement');
      return res.json();
    },
    version: announcementUpdatedAt,
    ttl: 3 * 24 * 60 * 60 * 1000, // 3 Tage (Announcements häufiger aktualisiert)
  });

  if (loading && !content) {
    return <AnnouncementSkeleton />;
  }

  if (error || !content) {
    return null; // Silent fail für Listen
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[content.priority as keyof typeof priorityColors] || priorityColors.low}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold">{content.title}</h3>
        <span className="text-xs px-2 py-1 rounded bg-white/50">
          {category}
        </span>
      </div>
      <p className="text-sm whitespace-pre-line">{content.content}</p>
    </div>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Info Text Section
// ============================================

interface InfoSectionProps {
  sectionId: string;
  title: string;
  lastUpdated?: string;
}

export function InfoSectionCached({
  sectionId,
  title,
  lastUpdated = '2026-01-01', // Default: very stable content
}: InfoSectionProps) {
  const { content, loading } = useVersionedContent<{
    html: string;
    updatedAt: string;
  }>({
    key: `info-${sectionId}`,
    fetcher: async () => {
      const res = await fetch(`/api/info/${sectionId}`);
      if (!res.ok) throw new Error('Failed to load info section');
      return res.json();
    },
    version: lastUpdated,
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 Tage (Info sehr stabil)
  });

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {loading && !content ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      ) : content ? (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : null}
    </section>
  );
}

// ============================================
// EXAMPLE 4: Cache Settings Component
// ============================================

export function CacheSettingsPanel() {
  const [showDetails, setShowDetails] = useState(false);
  
  // Import dynamisch um tree-shaking zu ermöglichen
  const [manager, setManager] = useState<any>(null);
  
  useState(() => {
    import('@/lib/content-cache-manager').then(mod => {
      setManager(mod);
    });
  });
  
  if (!manager) return null;
  
  const { useContentCacheManager, formatCacheStats } = manager;
  const { stats, clearCache, cleanupExpired, refresh } = useContentCacheManager();
  const formatted = formatCacheStats(stats);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Content Cache</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? 'Weniger' : 'Details'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Einträge</div>
            <div className="text-2xl font-bold">{formatted.totalEntries}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Storage</div>
            <div className="text-lg font-semibold">{formatted.storage}</div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium">{formatted.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IndexedDB</span>
              <span className="font-medium">
                {stats.indexedDBAvailable ? `${stats.indexedDBEntries} Einträge` : 'Nicht verfügbar'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">localStorage</span>
              <span className="font-medium">{stats.localStorageEntries} Einträge</span>
            </div>
            {stats.lastCleanup && (
              <div className="flex justify-between">
                <span className="text-gray-600">Letzter Cleanup</span>
                <span className="font-medium">
                  {new Date(stats.lastCleanup).toLocaleTimeString('de-DE')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={cleanupExpired}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cleanup
          </button>
          <button
            onClick={async () => {
              if (confirm('Möchtest du den gesamten Content Cache löschen?')) {
                await clearCache();
              }
            }}
            disabled={stats.isClearing}
            className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {stats.isClearing ? 'Lösche...' : 'Cache löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export const ContentCacheExamples = {
  EventDescriptionCached,
  AnnouncementContentCached,
  InfoSectionCached,
  CacheSettingsPanel,
};
