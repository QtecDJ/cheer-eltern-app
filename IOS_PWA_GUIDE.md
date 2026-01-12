# iOS PWA Optimization Guide v1.8.2

## ⚠️ WICHTIG: NON-DESTRUCTIVE ENHANCEMENT

**Diese iOS Optimierungen sind ADDITIV und OPTIONAL!**
- Alle v1.8.0 Database Optimizations bleiben INTAKT
- Alle v1.8.1 Client-Side Caching Features bleiben INTAKT  
- Keine Änderungen an Server Components oder Queries
- iOS Features sind eine zusätzliche Optimization-Schicht

---

## 📱 iOS Safari PWA Limitations

### Kritische iOS Einschränkungen

1. **Keine Background Sync API**
   - Service Worker wird nach ~3 Sekunden im Hintergrund beendet
   - Keine long-running Tasks möglich
   - Push Notifications nur sehr limitiert

2. **Aggressives Cache Eviction**
   - iOS löscht Caches bei niedrigem Speicher automatisch
   - Caches werden ohne Warnung gelöscht
   - localStorage kann in Private Mode komplett deaktiviert sein

3. **Service Worker Lifecycle**
   - SW wird bei App Pause sofort gestoppt
   - Visibility API ist zuverlässiger als pageshow/pagehide
   - SW Startup Latency ist höher als auf Android

4. **Storage Limits**
   - localStorage: ~5MB total für gesamte App
   - Cache API: ~50MB (aber wird aggressiv gelöscht)
   - IndexedDB: ~50MB (weniger aggressiv gelöscht)

5. **Network Behavior**
   - iOS kann offline sein trotz WiFi Icon
   - Langsame Verbindung wird nicht immer korrekt erkannt
   - fetch() kann hängen bleiben ohne Timeout

---

## 🚀 iOS Optimization Strategy

### 1. iOS-Safe Caching (`src/lib/ios-pwa.ts`)

```typescript
import { isIOS, isIOSPWA, setIOSCache, getIOSCache } from '@/lib/ios-pwa';

// iOS Detection
if (isIOS()) {
  console.log('Running on iOS');
  
  if (isIOSPWA()) {
    console.log('Running as PWA');
  }
}

// iOS-safe localStorage wrapper
// - Automatisch 500KB Limit pro Item
// - Graceful fallback wenn localStorage voll/disabled
// - Auto-cleanup von expired items

setIOSCache('my-data', { foo: 'bar' }, 5 * 60 * 1000); // 5 min TTL
const data = getIOSCache('my-data');
```

**Features:**
- 500KB Limit pro Cache Item (iOS safe)
- Automatischer Fallback bei Cache Eviction
- Expired Items werden automatisch gelöscht
- Funktioniert auch wenn localStorage disabled ist

### 2. iOS Lifecycle Management

```typescript
import { IOSLifecycleManager } from '@/lib/ios-pwa';

const manager = new IOSLifecycleManager({
  onLaunch: () => {
    console.log('App gestartet auf iOS');
    // Prefetch kritische Daten
  },
  
  onResume: () => {
    console.log('App resumed auf iOS');
    // Revalidate cached data
  },
  
  onPause: () => {
    console.log('App paused auf iOS');
    // Cleanup & save state
  },
});

// Cleanup wenn Component unmountet
manager.destroy();
```

**Detects:**
- App Launch (erster Start)
- App Resume (zurück aus Hintergrund)
- App Pause (in Hintergrund)
- Verwendet Visibility API (zuverlässig auf iOS)

### 3. iOS-Safe Fetch mit Deduplication

```typescript
import { iosSafeFetch } from '@/lib/ios-pwa';

// Automatische Deduplication (500ms window)
// Verhindert doppelte Requests beim Resume
const data = await iosSafeFetch(
  'events-data',
  async () => {
    const response = await fetch('/api/events');
    return response.json();
  },
  { cacheTTL: 5 * 60 * 1000 } // 5 min
);
```

**Features:**
- 500ms Deduplication Window
- Cache-First Strategy (zeigt sofort cached data)
- Background Revalidation
- Automatisches Timeout Handling

---

## 🎣 React Hooks für iOS

### useIOSLifecycle - Lifecycle Handling

```typescript
'use client';
import { useIOSLifecycle } from '@/lib/use-ios-pwa';

export function MyComponent() {
  const { isIOS, isPWA } = useIOSLifecycle({
    onResume: () => {
      console.log('App resumed - revalidate data');
      // Trigger revalidation
    },
  });
  
  return (
    <div>
      {isIOS && <p>iOS Optimizations active</p>}
      {isPWA && <p>Running as PWA</p>}
    </div>
  );
}
```

### useIOSCache - iOS-Safe Data Caching

```typescript
'use client';
import { useIOSCache } from '@/lib/use-ios-pwa';

export function EventsList() {
  const { data, loading, isFromCache, refetch } = useIOSCache(
    'events-list',
    async () => {
      const response = await fetch('/api/events');
      return response.json();
    },
    {
      cacheTTL: 5 * 60 * 1000, // 5 min
      revalidateOnResume: true, // Auto-revalidate on app resume
      showStaleWhileRevalidate: true, // Zeige cached data sofort
    }
  );
  
  return (
    <div>
      {isFromCache && <span>Cached</span>}
      {loading ? <Loading /> : <Events data={data} />}
    </div>
  );
}
```

**Features:**
- Cache-First mit Background Revalidation
- Automatisches Resume Revalidation
- Stale-While-Revalidate Pattern
- Loading States & Error Handling

### useIOSAutoRevalidate - Automatic Resume Revalidation

```typescript
'use client';
import { useIOSAutoRevalidate } from '@/lib/use-ios-pwa';

export function HomePage() {
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    const response = await fetch('/api/home');
    const json = await response.json();
    setData(json);
  };
  
  // Automatisch revalidieren wenn App nach > 30s Pause resumed
  useIOSAutoRevalidate(fetchData, {
    enabled: true,
    minPauseDuration: 30 * 1000, // 30 seconds
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return <div>{data ? <Content data={data} /> : <Loading />}</div>;
}
```

### useIOSNetworkStatus - Network Detection

```typescript
'use client';
import { useIOSNetworkStatus } from '@/lib/use-ios-pwa';

export function MyComponent() {
  const { isOnline, isSlowConnection } = useIOSNetworkStatus();
  
  return (
    <div>
      {!isOnline && <OfflineWarning />}
      {isSlowConnection && <SlowConnectionWarning />}
    </div>
  );
}
```

### useIOSPrefetch - Prefetch Critical Data

```typescript
'use client';
import { useIOSPrefetch } from '@/lib/use-ios-pwa';

export function AppWrapper() {
  // Prefetch events data on app start (nach 1 Sekunde delay)
  useIOSPrefetch(
    'events-prefetch',
    async () => {
      const response = await fetch('/api/events');
      return response.json();
    },
    {
      enabled: true,
      onlyWhenOnline: true,
      delay: 1000, // 1s delay
    }
  );
  
  return <App />;
}
```

---

## 🛠️ Service Worker iOS Optimizations

### Automatische iOS Detection & Anpassungen

Der Service Worker (`public/sw.js`) erkennt automatisch iOS und passt sich an:

**iOS-spezifische Anpassungen:**
- ✅ Kürzere Cache TTLs (50% der normalen Zeit)
- ✅ Kleinere Cache-Limits (max 20 API responses statt 30)
- ✅ Kürzere Network Timeouts (max 3s statt 5s)
- ✅ Cache-First für kritische Endpoints
- ✅ Keine long-running Tasks

**Cache Durations auf iOS:**
```javascript
// Stabile Daten (z.B. teams, settings)
VERY_LONG: 15min (statt 30min)

// Normale Daten (z.B. members, profile)  
LONG: 5min (statt 10min)

// Häufig ändernde Daten (z.B. events, trainings)
MEDIUM: 2min (statt 5min)

// Zeitkritische Daten (z.B. attendance, RSVP)
SHORT: 1min (statt 2min)
```

---

## 📊 Performance Monitoring

### iOS Performance Metrics

```typescript
import { iosPerformanceMonitor } from '@/lib/ios-pwa';

// Get Metrics
const metrics = iosPerformanceMonitor.getMetrics();
console.log('Cache Hit Rate:', iosPerformanceMonitor.getCacheHitRate());
console.log('Total Hits:', metrics.cacheHits);
console.log('Total Misses:', metrics.cacheMisses);
console.log('App Resumes:', metrics.resumes);
console.log('Cache Size:', metrics.cacheSize);

// Reset Metrics
iosPerformanceMonitor.reset();
```

### React Hook für Metrics

```typescript
'use client';
import { useIOSPerformanceMetrics } from '@/lib/use-ios-pwa';

export function DebugPanel() {
  const { metrics, hitRate, reset } = useIOSPerformanceMetrics();
  
  return (
    <div>
      <h3>iOS Performance</h3>
      <p>Hit Rate: {hitRate.toFixed(1)}%</p>
      <p>Cache Hits: {metrics.cacheHits}</p>
      <p>Cache Misses: {metrics.cacheMisses}</p>
      <p>Resumes: {metrics.resumes}</p>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## 🎯 Usage Recommendations

### Wann welche Strategie?

#### 1. Critical Pages (Home, Events, Training)
**Empfehlung:** `useIOSCache` + `revalidateOnResume`

```typescript
const { data } = useIOSCache('events', fetcher, {
  cacheTTL: 5 * 60 * 1000,
  revalidateOnResume: true,
  showStaleWhileRevalidate: true,
});
```

**Warum?**
- Zeigt sofort cached data (instant UI)
- Background revalidation für fresh data
- Automatisch fresh nach app resume

#### 2. Secondary Pages (Info, Mitglieder)
**Empfehlung:** `useIOSAutoRevalidate`

```typescript
useIOSAutoRevalidate(fetchData, {
  minPauseDuration: 30 * 1000,
});
```

**Warum?**
- Einfacher als voller Cache
- Revalidiert nur bei längerer Pause
- Weniger Cache Storage needed

#### 3. Static Content (Teams, Settings)
**Empfehlung:** `useIOSPrefetch` beim App Start

```typescript
useIOSPrefetch('teams', fetchTeams, {
  delay: 1000,
});
```

**Warum?**
- Lädt im Hintergrund
- Cached für spätere Navigation
- Kein Initial Loading State

#### 4. Real-Time Data (Attendance, RSVP)
**Empfehlung:** Normaler Fetch ohne Cache

```typescript
// Kein iOS Cache für real-time data
const response = await fetch('/api/attendance');
```

**Warum?**
- Muss immer aktuell sein
- Kurze Cache TTL würde nicht helfen
- Network-First ist besser

---

## 🔍 Debugging auf iOS

### Safari Web Inspector verwenden

1. **iPhone Settings:**
   - Settings → Safari → Advanced → Web Inspector: ON

2. **Mac Safari:**
   - Develop → [Your iPhone] → [Your PWA]

3. **Console Logs checken:**
   ```javascript
   // iOS-spezifische Logs
   [SW] Detected iOS - applying iOS optimizations
   [iOS] Prefetching: events
   [iOS Hook] Revalidating on resume: events-list
   ```

### Storage Inspector

1. **Check localStorage:**
   ```javascript
   console.log('localStorage size:', 
     JSON.stringify(localStorage).length
   );
   ```

2. **Check Cache API:**
   ```javascript
   const keys = await caches.keys();
   console.log('Caches:', keys);
   ```

3. **Test Cache Eviction:**
   - Fülle Speicher bis iOS Cache evicted
   - Check ob App noch funktioniert
   - Überprüfe Fallback Behavior

---

## ⚠️ Common iOS Pitfalls

### 1. localStorage kann disabled sein
```typescript
// ✅ GOOD: Check vor Zugriff
import { setIOSCache } from '@/lib/ios-pwa';
setIOSCache('key', data); // Hat built-in fallback

// ❌ BAD: Direct localStorage access
localStorage.setItem('key', JSON.stringify(data)); // Kann crashen!
```

### 2. Service Worker wird sofort beendet
```typescript
// ✅ GOOD: Schnelle Operationen
self.addEventListener('fetch', (event) => {
  event.respondWith(handleFetch(event.request));
});

// ❌ BAD: Long-running Tasks
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(request).then(async (response) => {
      await longRunningOperation(); // Wird auf iOS abgebrochen!
      return response;
    })
  );
});
```

### 3. Cache kann jederzeit gelöscht werden
```typescript
// ✅ GOOD: Always check cache exists
const cached = getIOSCache('key');
if (cached) {
  // Use cached data
} else {
  // Fetch fresh
}

// ❌ BAD: Assume cache exists
const cached = getIOSCache('key');
return cached.data; // Kann null/undefined sein!
```

### 4. Background Sync funktioniert nicht
```typescript
// ✅ GOOD: Sofort senden oder queuen in localStorage
async function sendData(data) {
  try {
    await fetch('/api/data', { method: 'POST', body: JSON.stringify(data) });
  } catch {
    // Queue in localStorage für späteren Retry
    queueInLocalStorage(data);
  }
}

// ❌ BAD: Background Sync verwenden
registration.sync.register('send-data'); // Existiert nicht auf iOS!
```

---

## 📈 Expected Performance Improvements

### Network Requests

**Ohne iOS Optimizations:**
- Home Page: ~8 requests pro Navigation
- Events Page: ~6 requests pro Navigation  
- Total: ~14 requests

**Mit iOS Optimizations (nach warmup):**
- Home Page: ~1-2 requests (cached data, background revalidation)
- Events Page: ~0-1 requests (cached data)
- Total: ~1-3 requests (-80% reduction)

**Beim Resume nach Pause > 30s:**
- Zeigt sofort cached data (0ms loading)
- Background revalidation läuft parallel
- User sieht instant UI, fresh data in < 1s

### Data Transfer

**iOS Service Worker Cache-First:**
- ~60-70% weniger Data Transfer (zusätzlich zu v1.8.0)
- Kombiniert mit v1.8.0 Database Optimization: **~90% total reduction**

### User Experience

**Cold Start (erste App Öffnung):**
- Keine Verbesserung (muss laden)
- Prefetch läuft im Hintergrund

**Warm Navigation (nach Prefetch):**
- 0ms perceived loading time
- Instant UI durch cached data

**Resume nach Pause:**
- 0ms perceived loading time (cached data)
- Fresh data in ~500-1000ms (background revalidation)
- **Beste User Experience auf iOS!**

---

## 🚀 Quick Start Guide

### 1. Für neue Client Components

```typescript
'use client';
import { useIOSCache } from '@/lib/use-ios-pwa';

export function MyComponent() {
  const { data, loading, isFromCache } = useIOSCache(
    'my-data',
    async () => {
      const response = await fetch('/api/my-data');
      return response.json();
    },
    {
      cacheTTL: 5 * 60 * 1000,
      revalidateOnResume: true,
      showStaleWhileRevalidate: true,
    }
  );
  
  if (loading && !data) return <Loading />;
  return <Content data={data} />;
}
```

### 2. Für bestehende Pages mit Resume Revalidation

```typescript
'use client';
import { useIOSAutoRevalidate } from '@/lib/use-ios-pwa';

export function ExistingPage() {
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    const response = await fetch('/api/data');
    setData(await response.json());
  };
  
  // Add iOS resume revalidation
  useIOSAutoRevalidate(fetchData);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return <div>...</div>;
}
```

### 3. Lifecycle Events tracken

```typescript
'use client';
import { useIOSLifecycle } from '@/lib/use-ios-pwa';

export function App() {
  useIOSLifecycle({
    onLaunch: () => console.log('App launched'),
    onResume: () => console.log('App resumed'),
    onPause: () => console.log('App paused'),
  });
  
  return <YourApp />;
}
```

---

## ✅ Verification Checklist

Nach iOS Optimization Implementation:

- [ ] Service Worker updated auf v1.8.2
- [ ] `npm run build` läuft ohne Errors
- [ ] iOS Detection funktioniert (check Console auf iPhone)
- [ ] Cache-First funktioniert auf iOS (check Network tab)
- [ ] Resume revalidation funktioniert (App pausieren & resumieren)
- [ ] Storage bleibt unter Limits (check mit Safari Inspector)
- [ ] Fallbacks funktionieren (test mit vollem localStorage)
- [ ] Alle v1.8.0 Optimizations noch intakt (revalidate, queries)
- [ ] Alle v1.8.1 Caching Features noch intakt

---

## 🎓 Best Practices Summary

### DOs ✅
- Immer iOS Detection verwenden (`isIOS()`, `isIOSPWA()`)
- iOS-safe Cache Functions verwenden (`setIOSCache`, `getIOSCache`)
- Kürzere Cache TTLs auf iOS (50% der normalen Zeit)
- Cache-First für bessere Performance
- Background Revalidation für fresh data
- Visibility API für Lifecycle Detection
- Fallbacks für Cache Eviction implementieren

### DON'Ts ❌
- Kein direkter `localStorage` Zugriff ohne Check
- Keine Background Sync API verwenden
- Keine long-running Service Worker Tasks
- Nicht annehmen dass Caches persistent sind
- Nicht große Daten in localStorage speichern (> 500KB)
- Nicht auf Service Worker für kritische Operations verlassen

---

## 📚 Related Documentation

- [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) - v1.8.0 Database Optimizations
- [CLIENT_CACHE_GUIDE.md](./CLIENT_CACHE_GUIDE.md) - v1.8.1 Client-Side Caching
- [OPTIMIZATION_SAFETY.md](./OPTIMIZATION_SAFETY.md) - Safety Verification

---

**Version:** 1.8.2  
**Last Updated:** 2024  
**Author:** ICA-Dev Kai Püttmann
