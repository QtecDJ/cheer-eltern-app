# Version 1.7.1 - Änderungsprotokoll

**Datum:** 12. Januar 2026  
**Version:** 1.7.1

## Änderungen

### 1. Navigation zu Neuigkeiten auf Home-Seite
- Neuigkeiten auf der Home-Seite sind jetzt klickbar
- Weiterleitung zur Events-Seite beim Klick
- Hover-Effekt für besseres visuelles Feedback

### 2. Ausklappbare Ankündigungen auf Events-Seite
- Ankündigungen sind jetzt ausklappbar (Collapsible)
- Standardmäßig eingeklappt mit 2-Zeilen-Vorschau
- Klick auf Header öffnet/schließt die Ankündigung
- Pfeil-Icon zeigt aktuellen Status

### 3. Verbesserte Sortierung der Ankündigungen
- Angepinnte UND wichtige Beiträge werden ganz oben angezeigt
- Sortierreihenfolge:
  1. Angepinnt + Wichtig
  2. Nur Angepinnt
  3. Nur Wichtig
  4. Restliche Beiträge (nach Datum)

### 4. Team-basierte Ankündigungsfilterung
- Ankündigungen werden jetzt korrekt nach Team gefiltert
- Basiert auf der `AnnouncementTeam`-Tabelle (Many-to-Many)
- Ankündigungen ohne Team-Zuordnung werden allen angezeigt
- Ankündigungen mit Team-Zuordnung nur für die entsprechenden Teams
- Filterung auf Home- und Events-Seite implementiert

## Technische Details

**Geänderte Dateien:**
- `src/app/home-content.tsx`
- `src/app/events/events-content.tsx`
- `src/app/events/page.tsx`
- `src/app/page.tsx`

**Datenbank:**
- Verwendung der `AnnouncementTeam`-Relation für Team-Filterung
