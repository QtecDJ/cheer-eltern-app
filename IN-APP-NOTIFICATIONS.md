# In-App Benachrichtigungssystem

## Übersicht

Dieses System ersetzt Web Push Notifications mit einem zuverlässigen, plattformübergreifenden In-App-Benachrichtigungssystem.

## Warum In-App statt Web Push?

Web Push hat sich als unzuverlässig erwiesen, insbesondere auf iOS PWAs:
- iOS Safari unterstützt Web Push nur eingeschränkt
- Komplexe Berechtigungsanfragen
- VAPID-Konfiguration fehleranfällig
- Inkonsistentes Verhalten zwischen Plattformen

Das In-App-System bietet:
- ✅ **100% Zuverlässigkeit** auf allen Plattformen (iOS, Android, Desktop)
- ✅ **Keine Berechtigungen** erforderlich
- ✅ **Sofortige Sichtbarkeit** wenn App geöffnet ist
- ✅ **Einfache Implementierung** ohne externe Abhängigkeiten
- ✅ **Bestehende Datenbank** wird genutzt (keine Schema-Änderungen)

## Architektur

### 1. Datenbank
Nutzt die bestehende `Notification` Tabelle:
```prisma
model Notification {
  id                Int              @id @default(autoincrement())
  memberId          Int
  type              String
  title             String
  message           String
  link              String?
  isRead            Boolean          @default(false)
  trainingSessionId Int?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  member            Member           @relation(fields: [memberId], references: [id], onDelete: Cascade)
  trainingSession   TrainingSession? @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  
  @@index([memberId])
  @@index([isRead])
}
```

### 2. API-Routen

#### GET/POST `/api/notifications`
- **GET**: Gibt letzte 50 Benachrichtigungen + unread count zurück
- **POST**: Erstellt Benachrichtigungen für mehrere Member (Batch-Erstellung)

```typescript
// GET Response
{
  notifications: Notification[],
  unreadCount: number
}

// POST Request
{
  memberIds: number[],
  type: string,
  title: string,
  message: string,
  link?: string,
  trainingSessionId?: number
}
```

#### POST `/api/notifications/mark-read`
Markiert Benachrichtigungen als gelesen:
```typescript
// Alle als gelesen markieren
{ markAll: true }

// Spezifische IDs markieren
{ notificationIds: [1, 2, 3] }
```

### 3. React Hook: `useNotifications`

Auto-Polling Hook mit intelligenten Features:
```typescript
const {
  notifications,    // Array aller Benachrichtigungen
  unreadCount,      // Anzahl ungelesener Benachrichtigungen
  loading,          // Loading-Status
  error,            // Fehler-Status
  refresh,          // Manuelle Aktualisierung
  markAsRead        // Benachrichtigungen als gelesen markieren
} = useNotifications();
```

**Features:**
- 🔄 **Auto-Polling** alle 30 Sekunden
- ⏸️ **Smart Pause**: Stoppt automatisch wenn App im Hintergrund (Battery-friendly)
- 🔍 **Visibility API**: Lädt sofort neu wenn App wieder in den Vordergrund kommt
- 📊 **Live Updates**: Echtzeit-Unread-Counter

### 4. Komponenten

#### `<NotificationCenter />`
Dropdown-Benachrichtigungszentrale mit:
- 🔔 Bell-Icon mit Badge (zeigt unread count)
- 📋 Dropdown mit letzten Benachrichtigungen
- ✓ "Alle als gelesen" markieren
- 🔗 Klickbare Benachrichtigungen mit Navigation
- 📱 Responsive Design

#### `/benachrichtigungen` Seite
Vollständige Benachrichtigungsansicht:
- 📜 Alle Benachrichtigungen in chronologischer Reihenfolge
- 🔄 Manueller Refresh-Button
- ✓ Bulk-Aktionen (alle als gelesen)
- 🎨 Visuelle Unterscheidung (ungelesen = blau)

## Integration

### 1. Im Header/Layout einbauen
```tsx
import { NotificationCenter } from '@/components/notification-center';

<header>
  {/* ...andere Header-Elemente */}
  <NotificationCenter />
</header>
```

### 2. Benachrichtigungen erstellen

#### Für einen einzelnen Member:
```typescript
await prisma.notification.create({
  data: {
    memberId: 123,
    type: 'training',
    title: 'Neues Training',
    message: 'Training morgen um 17:00 Uhr',
    link: '/training',
    isRead: false
  }
});
```

#### Für mehrere Member (z.B. ganzes Team):
```typescript
// Via API Route
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberIds: [1, 2, 3, 4],
    type: 'announcement',
    title: 'Wichtige Ankündigung',
    message: 'Training abgesagt wegen Wetter',
    link: '/info'
  })
});
```

## Benachrichtigungstypen

```typescript
type NotificationType = 
  | 'training'      // Training-bezogen
  | 'announcement'  // Wichtige Ankündigungen
  | 'info'          // Allgemeine Infos
  | 'reminder'      // Erinnerungen
  | 'assessment'    // Bewertungen
  | 'document';     // Dokumente
```

## Performance

- **Polling-Intervall**: 30 Sekunden (anpassbar)
- **Batch Size**: Letzte 50 Benachrichtigungen
- **Database Indexes**: Optimiert für `memberId` und `isRead`
- **Auto-Pause**: Kein Polling wenn App im Hintergrund
- **Minimal Overhead**: ~500 bytes pro Request

## Migration von Web Push

Das alte Push-System kann deaktiviert werden:

1. ~~`EnablePushNotifications` Komponente~~ - kann entfernt werden
2. ~~`/api/push/*` Routes~~ - können entfernt werden  
3. ~~`push_subscriptions` Tabelle~~ - kann optional entfernt werden
4. ~~Service Worker Push Handler~~ - kann vereinfacht werden
5. ~~VAPID Keys~~ - nicht mehr benötigt

## Testing

```bash
# Test-Benachrichtigungen erstellen
curl http://localhost:3000/api/test/create-notifications

# Oder im Browser öffnen:
# http://localhost:3000/api/test/create-notifications
```

## Vorteile im Überblick

| Feature | Web Push | In-App System |
|---------|----------|---------------|
| iOS Support | ❌ Sehr eingeschränkt | ✅ 100% |
| Berechtigungen | ❌ Erforderlich | ✅ Keine |
| Offline Meldungen | ❌ Komplex | ✅ Einfach |
| Setup-Komplexität | ❌ Hoch (VAPID, SW, etc.) | ✅ Minimal |
| Zuverlässigkeit | ⚠️ Inkonsistent | ✅ Sehr hoch |
| Battery Impact | ⚠️ Mittel | ✅ Minimal (smart pause) |
| Echtzeit Updates | ✅ Ja | ✅ Ja (30s Intervall) |

## Nächste Schritte

1. ✅ API-Routen implementiert
2. ✅ Hook mit Auto-Polling erstellt
3. ✅ NotificationCenter Komponente
4. ✅ Vollständige Benachrichtigungsseite
5. ⏳ Test in Production
6. ⏳ Alte Push-Komponenten entfernen
7. ⏳ Service Worker vereinfachen

## Support

Bei Fragen oder Problemen:
- Prüfe Browser Console auf Fehler
- Checke Network Tab für API-Calls
- Verifiziere Datenbank-Einträge
