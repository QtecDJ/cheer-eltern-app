# Globale Entwickler-Präferenzen

## Allgemeine Regeln
- Bevorzuge TypeScript über JavaScript
- Schreibe Code auf Englisch, Kommentare auf Deutsch
- Verwende moderne ES6+ Syntax
- Keine console.log() in Production-Code

## Code-Qualität
- Schreibe sauberen, lesbaren Code
- Verwende aussagekräftige Variablennamen
- Halte Funktionen klein (max. 20 Zeilen)
- DRY-Prinzip befolgen

## Fehlerbehandlung
- Immer try-catch bei async/await
- Niemals Fehler verschlucken
- Aussagekräftige Fehlermeldungen

## Git
- Commit-Messages auf Deutsch
- Conventional Commits Format nutzen
- Niemals direkt auf main pushen

## Design Styling
 Design-Prinzipien

Clarity first: Funktion schlägt Dekoration

Consistency: Gleiche Abstände, Farben, Typo, States

Accessible by default: Kontrast, Focus-States, Tastatur

Scalable UI: Komponenten funktionieren in jeder Größe

Performance-aware: Kein unnötiges Rendering

UI-Tech-Stack

Tailwind CSS (Utility-First)

shadcn/ui (Enterprise-ready Components)

Radix UI (Accessibility & Interactions)

lucide-react (Icons)

clsx + tailwind-merge für class handling

Framer Motion optional, nur für dezente Micro-UX

Layout & Spacing

8px Spacing System

4 · 8 · 12 · 16 · 24 · 32 · 40 · 48

Max-Breite Desktop: max-w-screen-2xl

Padding:

Desktop: px-6 – px-10

Mobile: px-4

Grid-Layouts mit klaren Gaps (gap-4, gap-6)

Typografie

Font: Inter (oder System-Font)

Hierarchie:

Page Title: text-2xl / 3xl · font-semibold

Section Title: text-lg · font-semibold

Body: text-sm / base

Hint/Meta: text-xs · muted

Maximal 2 Font-Weights pro View

Farben & Theming

Nutzung von semantischen Tokens

background, foreground

primary, secondary, accent

muted, border, destructive

Keine direkten Farben ohne Token

Dark Mode immer berücksichtigen

Statusfarben nur semantisch (Success, Warning, Error, Info)

Komponenten-Standards
Buttons

Max. eine Primary-Action pro Screen

Klare Varianten: primary, secondary, ghost, link

Loading- & Disabled-State Pflicht

Standardhöhe: 40px, Compact: 32px

Forms & Inputs

Immer:

Label

Validierung

Fehler- & Hilfetext

Validierung nicht aggressiv (onBlur / Submit)

Gruppierung komplexer Formulare in Sections

Cards & Panels

Bevorzugt Border statt Shadow

Shadow nur für:

Modals

Dropdowns

Floating Elements

Tabellen (Enterprise-Core)

Sticky Header optional

Hover-State subtil

Leere Zustände mit:

Icon

Erklärung

CTA

Interaktionen & UX

Hover & Focus-States verpflichtend

Fokus-Ring niemals entfernen

Animationen:

kurz (150–220ms)

klein (Fade / Slide max. 16px)

prefers-reduced-motion respektieren

Toasts:

Erfolg kurz & ruhig

Fehler erklärend + Handlungshinweis

Icons & Visuals

Icons sparsam einsetzen

Einheitliche Größen (16–18px)

Max. 1 Icon pro Button

Illustrationen nur bei Empty-States oder Landing Views

Navigation

Desktop: Sidebar + Topbar

Mobile: Drawer oder Bottom Navigation

Breadcrumbs bei tiefer Navigation

Kontextaktionen klar sichtbar

Styling- & Code-Konventionen

Keine Inline-Styles (außer zwingend nötig)

Klassen über cn() Helper

Komponenten über variant, size, state steuern

Keine Dark-Mode-Logik im JSX — über Tokens lösen