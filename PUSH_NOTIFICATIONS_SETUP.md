# Push-Benachrichtigungen Setup Guide

## ✅ Was wurde implementiert

Die Push-Benachrichtigungen sind jetzt vollständig in deine App integriert - iOS-optimiert und kompatibel mit allen bestehenden Optimierungen!

---

## 🚀 Nächste Schritte

### 1. Environment-Variable setzen

Erstelle eine `.env.local` Datei (falls noch nicht vorhanden) und füge den VAPID Public Key hinzu:

```bash
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BO7nt__RKbqZlG9z6GlXQ6pz3fbN3Uc77RKPUOksuG6mRFzOR4j8ijcVchwec1PDP2b2odULfoIE-SW6rqxQiyo
```

⚠️ **Wichtig:** Dieser Key ist nur ein Beispiel. Du musst deine eigenen VAPID Keys generieren!

### 2. VAPID Keys generieren

```bash
# Im Command Center Projekt oder mit web-push CLI
npx web-push generate-vapid-keys
```

Das gibt dir:
- **Public Key** → In `.env.local` als `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key** → Nur im Backend/Command Center verwenden (NIEMALS im Frontend!)

### 3. Datenbank Migration

```bash
cd eltern-app
npx prisma migrate dev --name add_push_subscriptions
npx prisma generate
```

Das erstellt die `push_subscriptions` Tabelle in deiner Datenbank.

### 4. Service Worker neu registrieren

Nach dem ersten Build registriert sich der Service Worker automatisch. Zur Sicherheit:

```bash
npm run dev
# Öffne http://localhost:3000
# Öffne Browser DevTools → Application → Service Workers
# Klicke "Unregister" falls vorhanden
# Reload die Seite → Service Worker wird neu registriert
```

---

## 🎯 Wie es funktioniert

### Für User (iOS & Android)

1. **Glocken-Icon** in der Home-Ansicht anklicken
2. Browser fragt nach **Notification-Permission** → Erlauben
3. Push-Benachrichtigungen sind **aktiv** ✅
4. Grüner Punkt zeigt aktiven Status

### Mobile Besonderheiten

#### iOS (Safari)
- Push funktioniert nur im **PWA-Modus** (App auf Home-Bildschirm installiert)
- Warnung wird angezeigt wenn noch nicht installiert
- iOS 16.4+ erforderlich

#### Android (Chrome/Firefox)
- Push funktioniert sofort im Browser
- Auch ohne PWA-Installation

---

## 📁 Was wurde erstellt/geändert

### Neue Dateien

✅ `src/lib/web-push.ts` - Push-Utilities mit iOS-Optimierung  
✅ `src/components/enable-push-notifications.tsx` - Push-Component  
✅ `src/app/api/push/subscribe/route.ts` - Subscribe Endpoint  
✅ `src/app/api/push/unsubscribe/route.ts` - Unsubscribe Endpoint  
✅ `src/app/api/push/resubscribe/route.ts` - Auto-Resubscribe bei Änderungen

### Geänderte Dateien

✅ `public/sw.js` - Service Worker mit Push-Support erweitert  
✅ `src/app/home-content.tsx` - Glocken-Button durch Push-Component ersetzt  
✅ `prisma/schema.prisma` - PushSubscription Model hinzugefügt  
✅ `.env.example` - VAPID Key Beispiel hinzugefügt

---

## 🔍 iOS-Optimierungen integriert

Alle deine bestehenden Optimierungen bleiben intakt:

### ✅ Content Cache
- Push-Component nutzt `ContentCacheUtils.isIOSDevice()`
- Keine Konflikte mit Caching-Strategien

### ✅ iOS PWA Detection
- Erkennt iOS PWA Mode automatisch
- Zeigt Hinweis wenn PWA-Installation fehlt

### ✅ Request Timeouts
- Kürzere Timeouts für iOS (8s statt 10s)
- Abort-Controller für sauberes Cleanup

### ✅ Offline-Fallback
- Push-Subscription wird gespeichert auch bei schlechter Verbindung
- Graceful degradation

---

## 🧪 Testen

### 1. Entwicklungs-Test

```bash
npm run dev
```

1. Öffne `http://localhost:3000`
2. Klicke auf das **Glocken-Icon**
3. Erlaube Benachrichtigungen
4. Icon wird **grün** bei aktivem Push

### 2. Browser DevTools

```javascript
// Service Worker prüfen
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
});

// Push-Subscription prüfen
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});
```

### 3. Test-Benachrichtigung

Später kannst du vom Command Center eine Test-Push senden:

```bash
POST /api/push/send
{
  "userId": 123,
  "title": "Test Nachricht",
  "body": "Push funktioniert! 🎉"
}
```

---

## 📊 Datenbank-Struktur

### `push_subscriptions` Tabelle

```sql
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  endpoint    TEXT UNIQUE NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_member ON push_subscriptions(member_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

### Multi-Device Support

Ein User kann mehrere Subscriptions haben:
- Desktop Browser
- Mobile Browser
- iOS PWA
- Android PWA

Alle werden bei Push-Nachrichten benachrichtigt.

---

## 🎨 UI-Komponente

Die `EnablePushNotifications` Component hat zwei Modi:

### Kompakt (auf Home-Seite)
```tsx
<EnablePushNotifications userId={child.id} compact={true} />
```
- Zeigt nur Icon mit Status-Indikator
- Toggle bei Click
- Minimal UI

### Voll (in Settings)
```tsx
<EnablePushNotifications userId={child.id} />
```
- Vollständige Card mit Erklärung
- Status-Badges
- Action Buttons
- iOS-Hinweise

---

## ⚠️ Wichtige Hinweise

### HTTPS erforderlich

Push-Benachrichtigungen funktionieren nur über:
- ✅ `https://` (Production)
- ✅ `localhost` (Development)
- ❌ `http://` IP-Adressen (blockiert)

### iOS Limitierungen

- Push nur im **PWA-Modus** (installierte App)
- iOS 16.4+ erforderlich
- Permission-Request muss durch **User-Click** getriggert werden
- Max. 2 Action-Buttons pro Notification

### Permissions

- User muss **explizit zustimmen**
- Bei "Deny" kann nur über Browser-Einstellungen geändert werden
- Zeige klare Erklärung **bevor** Permission angefragt wird

---

## 🔄 Command Center Integration

Das Backend (Command Center) muss noch implementiert werden:

1. **VAPID Keys** in Backend `.env`
2. **web-push** Package installieren
3. **Sende-Logic** für Push-Nachrichten
4. **Reminder-Rules** für automatische Benachrichtigungen

Details siehe: `USER_CLIENT_PUSH_SETUP.md` (das Dokument das du beigefügt hast)

---

## 🐛 Debugging

### Service Worker Logs

```javascript
// In Browser Console
navigator.serviceWorker.addEventListener('message', event => {
  console.log('SW Message:', event.data);
});
```

### Push-Subscription debuggen

```javascript
// Aktuelle Subscription anzeigen
navigator.serviceWorker.ready.then(async reg => {
  const sub = await reg.pushManager.getSubscription();
  console.log('Subscription:', {
    endpoint: sub?.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))
    }
  });
});
```

### API-Calls prüfen

Öffne Network Tab und filtere nach:
- `/api/push/subscribe`
- `/api/push/unsubscribe`

---

## ✅ Checkliste vor Go-Live

- [ ] `.env.local` mit echtem VAPID Key erstellt
- [ ] Prisma Migration durchgeführt
- [ ] Service Worker neu registriert (Dev-Test)
- [ ] Push-Subscription erfolgreich (Dev-Test)
- [ ] iOS PWA getestet (TestFlight/echtes Gerät)
- [ ] Android Browser getestet
- [ ] HTTPS für Production konfiguriert
- [ ] Backend/Command Center kann Push senden
- [ ] Multi-Device Support getestet

---

## 📚 Weitere Dokumentation

- Siehe beigefügtes `USER_CLIENT_PUSH_SETUP.md` für Command Center Integration
- [Web Push API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [iOS PWA Limitations](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

---

## 🎉 Fertig!

Die Push-Benachrichtigungen sind jetzt **vollständig integriert** und **iOS-optimiert**!

Bei Fragen oder Problemen → Check die Browser Console für Logs mit `[webPush]` Prefix.
