/**
 * Content Cache Test - Einfache Version
 * http://localhost:3000/cache-test
 */

'use client';

import { useState } from 'react';
import { useVersionedContent } from '@/lib/use-versioned-content';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function CacheTestPage() {
  // Test 1: Basic Content Loading
  const {
    content: content1,
    loading: loading1,
    error: error1,
    isFromCache: fromCache1,
    refetch: refetch1,
  } = useVersionedContent({
    key: 'test-content-1',
    fetcher: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        title: 'Test Content 1',
        text: 'Dies ist ein Test-Content um das Caching zu testen.',
        loadedAt: new Date().toLocaleTimeString('de-DE'),
      };
    },
    version: 'v1.0.0',
    ttl: 60 * 1000, // 1 Minute
  });

  // Test 2: Version Change
  const [version2, setVersion2] = useState('v1.0.0');
  const {
    content: content2,
    loading: loading2,
    isFromCache: fromCache2,
    refetch: refetch2,
  } = useVersionedContent({
    key: 'test-content-2',
    fetcher: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        title: 'Version Test',
        version: version2,
        loadedAt: new Date().toLocaleTimeString('de-DE'),
      };
    },
    version: version2,
    ttl: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Content Cache Test</h1>
          <p className="text-gray-600">Einfacher Test des Version-Based Caching</p>
          <p className="text-sm text-blue-600 mt-2">
            💡 Öffne die Console (F12) für detaillierte Logs: <code>[ContentCache]</code>
          </p>
        </div>

        {/* Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Test 1: Basic Caching</h3>
            
            {loading1 && !content1 ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : error1 ? (
              <div className="text-red-600">Error: {error1.message}</div>
            ) : content1 ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Content</div>
                  <div className="text-sm">{content1.text}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Loaded At</div>
                  <div className="font-mono text-sm">{content1.loadedAt}</div>
                </div>
                <div>
                  {fromCache1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      From Cache ✅
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Fresh Load 🔄
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            <button
              onClick={() => refetch1()}
              disabled={loading1}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>

          {/* Test 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Test 2: Version Change</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Version</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={version2}
                  onChange={(e) => setVersion2(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  onClick={() => setVersion2(`v${Math.random().toFixed(3)}`)}
                  className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Change
                </button>
              </div>
            </div>

            {loading2 && !content2 ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ) : content2 ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Version</div>
                  <div className="font-mono text-sm">{content2.version}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Loaded At</div>
                  <div className="font-mono text-sm">{content2.loadedAt}</div>
                </div>
                <div>
                  {fromCache2 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      From Cache (gleiche Version) ✅
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Fresh Load (neue Version) 🔄
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            <button
              onClick={() => refetch2()}
              disabled={loading2}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">✅ Test-Anleitung</h3>
          <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
            <li><strong>Test 1:</strong> Klicke mehrmals auf "Refresh" → Nach dem 1. Mal sollte "From Cache" angezeigt werden</li>
            <li><strong>Test 2:</strong> Klicke "Change" um Version zu ändern → Zeigt "Fresh Load" (neue Version)</li>
            <li>Klicke dann nochmal "Refresh" (ohne Version zu ändern) → Zeigt "From Cache" (gleiche Version)</li>
            <li><strong>Console:</strong> Öffne DevTools (F12) und sieh dir die <code className="bg-green-100 px-1 rounded">[ContentCache]</code> Logs an</li>
          </ol>
        </div>

        {/* Expected Logs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Erwartete Console Logs</h3>
          <div className="text-sm font-mono bg-white p-3 rounded border space-y-1">
            <div className="text-blue-600">[ContentCache] Initialized - iOS: false, PWA: false</div>
            <div className="text-orange-600">[ContentCache] 📥 Fetching fresh content: test-content-1</div>
            <div className="text-green-600">[ContentCache] ✅ Cache hit with matching version: test-content-1</div>
            <div className="text-purple-600">[ContentCache] 🔄 Cache hit but version outdated: test-content-2</div>
          </div>
        </div>
      </div>
    </div>
  );
}
