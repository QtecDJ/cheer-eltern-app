# OneSignal Push-Benachrichtigungen Setup

Vollständige Anleitung zur Integration von OneSignal für zuverlässige Push-Benachrichtigungen in der Infinity Cheer Allstars App.

## Warum OneSignal?

- ✅ **Bessere Browser-Kompatibilität** (besonders iOS/Safari)
- ✅ **Zuverlässigere Zustellung** 
- ✅ **Automatisches Subscription-Management**
- ✅ **Kostenloser Plan bis 10.000 Subscriber**
- ✅ **Analytics & Tracking**

---

## Teil 1: OneSignal Account & App Setup

### 1.1 Account erstellen

1. Gehe zu https://onesignal.com/
2. Klicke auf **Get Started Free**
3. Registriere dich mit deiner E-Mail (`qtec_production@icloud.com`)
4. Bestätige die E-Mail

### 1.2 Neue App erstellen

1. Nach Login klicke auf **New App/Website**
2. App-Name: `Infinity Cheer Allstars`
3. Wähle: **Web Push**
4. Klicke auf **Next: Configure Your Platform**

### 1.3 Web Push Konfiguration

#### Site Setup:
- **Site Name:** `Infinity Cheer Allstars`
- **Site URL (Production):** `https://cheer-eltern.vercel.app`
- **Auto Resubscribe:** ✅ An
- **Default Notification Icon:** Upload dein Logo (`/public/icons/icon-192x192.png`)

#### Advanced Settings:
- **Permission Prompt:** Verwende den Native Browser Prompt
- **Welcome Notification:** Aus (wir machen eigene)

### 1.4 Wichtige Keys kopieren

Nach der Erstellung findest du unter **Settings → Keys & IDs**:

```
App ID: [DEIN_APP_ID]
REST API Key: [DEIN_REST_API_KEY]
```

**⚠️ Diese brauchst du gleich!**

---

## Teil 2: Vercel Environment Variables

Gehe zu https://vercel.com → Dein Projekt → **Settings** → **Environment Variables**

Füge folgende hinzu:

| Key | Value | Environments |
|-----|-------|--------------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | [Dein OneSignal App ID] | Production, Preview, Development |
| `ONESIGNAL_REST_API_KEY` | [Dein REST API Key] | Production, Preview, Development |

**WICHTIG:** Die alten VAPID Keys kannst du behalten (als Backup), werden aber nicht mehr genutzt.

---

## Teil 3: Code-Integration

### 3.1 OneSignal SDK installieren

```bash
npm install react-onesignal
```

### 3.2 Dateien erstellen/anpassen

Ich erstelle jetzt automatisch alle benötigten Dateien für dich.

---

## Teil 4: OneSignal Dashboard Einstellungen

### 4.1 Notification Settings

**Settings → Typical Settings:**

1. **Default Language:** Deutsch
2. **Timezone:** Europe/Berlin
3. **Notification Types:**
   - ✅ Web Push
   - ✅ Chrome, Firefox, Safari
4. **Notification Sound:** Default

### 4.2 Permission Prompt (Optional)

Wenn du einen benutzerdefinierten Prompt willst:

**Messages → Permission Prompts:**
- **Title:** "Benachrichtigungen aktivieren"
- **Message:** "Erhalten Sie Updates zu neuen Nachrichten und wichtigen Informationen"
- **Allow Button:** "Aktivieren"
- **Cancel Button:** "Später"

### 4.3 Web Push Settings

**Settings → Platforms → Web Push → Configure:**

1. **Icon URL:** `https://cheer-eltern.vercel.app/icons/icon-192x192.png`
2. **Badge:** `https://cheer-eltern.vercel.app/icons/icon-96x96.png`
3. **Action Buttons:** Aus (wir nutzen eigene)

---

## Teil 5: Test & Verification

### 5.1 Nach dem Deployment

1. Öffne deine App: `https://cheer-eltern.vercel.app`
2. Login als User
3. Klicke auf das Bell-Icon (Benachrichtigungen)
4. Erlaube Benachrichtigungen im Browser-Dialog

### 5.2 Im OneSignal Dashboard prüfen

**Audience → All Users:**
- Du solltest jetzt 1 Subscriber sehen
- Status: **Subscribed**
- Browser & Device info

### 5.3 Test-Benachrichtigung senden

#### Option A: Über OneSignal Dashboard
1. **Messages → New Push**
2. **Audience:** Alle User
3. **Message:** "Test-Benachrichtigung"
4. **Launch URL:** `/messages`
5. **Send Message**

#### Option B: Über deine App
1. Lass jemand anderen dir eine Nachricht schreiben
2. Du solltest eine Push-Benachrichtigung bekommen
3. Auch wenn die App geschlossen ist!

---

## Teil 6: Features die jetzt funktionieren

✅ **Push-Benachrichtigungen bei:**
- Neue Nachricht für dich
- Antwort auf deine Nachricht
- Dir zugewiesene Nachricht

✅ **Funktioniert auf:**
- Chrome/Edge (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (Desktop & Mobile - iOS 16.4+)

✅ **Auch wenn:**
- App geschlossen ist
- Browser geschlossen ist
- Handy im Standby

---

## Teil 7: Wichtige URLs

### OneSignal
- **Dashboard:** https://app.onesignal.com/
- **Dokumentation:** https://documentation.onesignal.com/
- **Support:** https://onesignal.com/support

### Deine App
- **Production:** https://cheer-eltern.vercel.app
- **Admin Debug:** https://cheer-eltern.vercel.app/api/push/debug

---

## Teil 8: Troubleshooting

### Problem: Keine Benachrichtigungen auf iOS

**Lösung:**
1. iOS 16.4+ erforderlich
2. App muss als PWA zum Homescreen hinzugefügt sein
3. Safari → Einstellungen → Websites → Benachrichtigungen → Erlauben

### Problem: Subscriber wird nicht angezeigt

**Check:**
1. Browser-Konsole öffnen (F12)
2. Schaue nach OneSignal-Fehlern
3. Prüfe ob `NEXT_PUBLIC_ONESIGNAL_APP_ID` auf Vercel gesetzt ist
4. Hard-Refresh: `Ctrl+Shift+R` oder `Cmd+Shift+R`

### Problem: Push kommt nicht an

**Check:**
1. OneSignal Dashboard → Messages → Delivery
2. Status prüfen (Sent, Clicked, Failed)
3. Notification Permission im Browser prüfen
4. Do Not Disturb / Focus Mode ausschalten

---

## Teil 9: Migration von VAPID zu OneSignal

### Was passiert mit alten Subscriptions?

Die alten VAPID Push-Subscriptions in der Datenbank bleiben bestehen, werden aber nicht mehr genutzt. 

**Optional: Cleanup nach Migration (nach 1 Woche)**

```bash
# In der Datenbank
DELETE FROM "PushSubscription" WHERE "createdAt" < NOW() - INTERVAL '7 days';
```

Oder du lässt sie einfach - sie stören nicht.

---

## Teil 10: Kosten & Limits

### Free Plan (aktuell)
- ✅ 10.000 Subscribers
- ✅ Unlimited Notifications
- ✅ Basic Analytics
- ✅ All Channels (Web, Mobile)

### Wenn du wächst (später)

**Growth Plan** ($9/Monat):
- 30.000 Subscribers
- Advanced Segmentation
- A/B Testing
- Priority Support

**Pro Plan** ($99/Monat):
- 100.000 Subscribers
- All Features

---

## Support

Bei Fragen zu OneSignal:
- **Email:** support@onesignal.com
- **Chat:** Im Dashboard unten rechts
- **Community:** https://github.com/OneSignal

Bei Fragen zur App-Integration:
- Check Vercel Logs
- Check Browser Console
- Test mit `/api/push/debug` endpoint

---

*Letzte Aktualisierung: Februar 2026*
