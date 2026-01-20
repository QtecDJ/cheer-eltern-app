# Version 1.7.0 - Änderungsprotokoll

**Datum:** 12. Januar 2026  
**Version:** 1.7.0 (vorher 1.6.0)

## Hauptänderungen

### 1. Team-Coach-Zuordnung System
**Problem:** Nutzer können in einem Team Athlet sein, aber ein anderes Team trainieren.

**Lösung:**
- **Neues Datenbankfeld:** `coachTeamId` in der Member-Tabelle
  - `teamId` = Team in dem die Person Athlet/Mitglied ist
  - `coachTeamId` = Team das die Person als Coach trainiert
  
**Datenbank-Migration:**
- Datei: `add-coach-team.mjs`
- Spalte `coachTeamId` hinzugefügt (INTEGER, nullable)
- Bestehende Coaches: `coachTeamId` wurde von `teamId` kopiert
- Danach manuelle Zuweisung korrigiert

**Team-Zuordnungen (Stand nach Update):**
- **Team 1 (Kings & Queens):** Sandra Pohl, Sabrina Hertfelder (Coaches)
- **Team 2 (Princesses):** Julia Rebmann, Chantal Pohl (Coaches)
- **Team 3 (Sparkles):** Cedric Kaiser, Adriana Wenzel (Coaches)
- **Team 4 (Divas):** Sabrina Seefried, Saskia Samland, kai Püttmann (Coaches)

### 2. Anwesenheits-Filterung
**Änderungen in:** `src/app/info/anwesenheit/page.tsx`

**Vorher:**
```typescript
// Admins sehen ALLE Trainings, Coaches nur ihr Team
...(isAdmin ? {} : { teamId: coachTeamId })
```

**Nachher:**
```typescript
// Alle mit coachTeamId sehen nur ihr Coach-Team
// Nur Admins OHNE coachTeamId sehen alle Teams
...(coachTeamId ? { teamId: coachTeamId } : {})
```

**Begründung:** Sandra Pohl (admin) sah alle Trainings inkl. Divas, wollte aber nur Kings & Queens sehen.

### 3. Update-Feature mit Fortschrittsbalken
**Neue Dateien:**
- `src/app/updating/page.tsx` - Update-Seite mit animiertem Fortschrittsbalken

**Funktionsweise:**
1. Bei Login wird Version-Cookie geprüft (`app_version`)
2. Wenn Version unterschiedlich: Redirect zu `/updating`
3. Fortschrittsbalken füllt sich über 4 Sekunden
4. Zeigt neue Features an
5. Automatischer Redirect zur Startseite

**Änderungen in:** `src/app/login/actions.ts`
- Konstante `CURRENT_VERSION = "1.7.0"`
- Cookie `VERSION_COOKIE = "app_version"`
- Version-Check beim Login
- Redirect zu `/updating` bei Versions-Unterschied

**Für nächstes Update:**
1. Version in `package.json` erhöhen
2. `CURRENT_VERSION` in `src/app/login/actions.ts` anpassen
3. Feature-Liste in `src/app/updating/page.tsx` aktualisieren

### 4. Logout-Fehler behoben
**Problem:** "Something went wrong" beim Ausloggen

**Lösung in:** `src/app/login/actions.ts`
```typescript
export async function logoutAction() {
  try {
    await logout();
  } catch (error) {
    console.error("Logout error:", error);
  }
  redirect("/login");
}
```

### 5. Mitglieder-Info Filterung
**Änderungen in:** `src/app/info/mitglieder/page.tsx`
- Verwendet jetzt `coachTeamId` statt `teamId` für Trainer-Filter
- Admins mit `coachTeamId` sehen nur ihr Coach-Team
- Admins ohne `coachTeamId` sehen alle Teams

## Schema-Änderungen

**prisma/schema.prisma:**
```prisma
model Member {
  // ... andere Felder
  teamId        Int?          // Team als Athlet
  coachTeamId   Int?          // Team als Coach (NEU!)
  // ... weitere Felder
}
```

## Verworfene Ansätze

### Multi-Rollen mit String[]
**Versuch:** userRole von `String?` zu `String[]` ändern, damit Nutzer mehrere Rollen haben können (z.B. admin + coach)

**Problem:**
- TypeScript-Kompilierungsfehler
- Komplexe Array-Checks überall im Code
- Build-Fehler

**Lösung:** 
- Vollständiger Rollback durchgeführt
- Stattdessen separates `coachTeamId` Feld verwendet
- Einfacher und funktioniert einwandfrei

**Rollback-Dateien:**
- `rollback-to-string.mjs` - Datenbank-Migration zurück
- `rollback-to-string-v2.mjs` - Zweiter Versuch

## Debug-Tools erstellt

**Neue Dateien für Entwicklung:**
- `query-db.mjs` - Direkte Datenbank-Abfragen
- `check-sandra.mjs` - Sandra Pohls Daten prüfen
- `update-coach-teams.mjs` - Coach-Zuweisungen aktualisieren
- `add-coach-team.mjs` - coachTeamId Spalte hinzufügen
- `src/app/api/debug/trainers/route.ts` - Debug-API für Coach-Übersicht

**Veraltete Migrations-Dateien (nicht verwendet):**
- `migrate-roles.mjs`
- `assign-multiple-roles.mjs`
- `update-teams.mjs`
- `update-coach-roles.mjs`
- `fix-kai-admin.mjs`

## Testing-Notizen

**Tests durchgeführt:**
- ✅ Sandra Pohl sieht jetzt nur Team 1 (Kings & Queens) statt Team 4 (Divas)
- ✅ Coaches sehen nur ihr zugewiesenes Coach-Team
- ✅ Logout funktioniert ohne Fehler
- ✅ Production Build erfolgreich
- ✅ Update-Seite zeigt korrekt an

**Debug-Output Beispiel:**
```
Anwesenheit Debug: {
  userId: 29,
  userName: 'Sandra Pohl',
  userRole: 'admin',
  isAdmin: true,
  coachTeamId: 1
}
Training gefunden: {
  trainingId: 11,
  trainingTitle: 'Dienstag Training',
  trainingTeamId: 1,
  trainingTeamName: 'Kings & Queens',
  matchesCoachTeam: true
}
```

## Deployment

**Git Commit:**
```
Version 1.7.0: Team-Coach-Zuordnung und Update-Feature

- Neues Feld coachTeamId für separate Coach-Team-Zuordnung
- Coaches/Admins sehen nur ihr zugewiesenes Coach-Team in Anwesenheit
- Update-Seite mit Fortschrittsbalken bei neuer Version
- Verbesserte Team-Filterung in Mitglieder-Info
- Logout-Fehler behoben
```

**Push:** ✅ Erfolgreich auf GitHub gepusht (master branch)  
**Vercel:** Automatisches Deployment läuft

## Wichtige Erkenntnisse

1. **Separate Felder besser als Arrays:** `coachTeamId` ist viel einfacher als String[] für userRole
2. **Version-Cookie persistent:** 1 Jahr Gültigkeit, damit Update-Screen nicht immer kommt
3. **Debug-Logging hilfreich:** Console.log in anwesenheit/page.tsx half beim Debugging
4. **Rollback-Strategie wichtig:** Mehrere Rollback-Versuche waren nötig

## Nächste Schritte (für zukünftige Updates)

1. Debug-Logging in Production entfernen oder auf Development beschränken
2. Alte .mjs Scripts aufräumen (migrate-roles.mjs, etc.)
3. Update-Feature bei Version 1.8.0 testen
