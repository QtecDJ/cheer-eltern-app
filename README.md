# Member App

Eine moderne Member-Portal App für Cheerleading-Vereine. Die App ermöglicht Mitgliedern, Trainings zu verwalten, Ankündigungen zu sehen und den Fortschritt zu verfolgen.

## Features

- 🏠 **Dashboard** - Übersicht über anstehende Trainings und Ankündigungen
- 📅 **Training** - Trainings zu- oder absagen mit Begründung
- 📢 **Events** - Ankündigungen und Events im Überblick
- 👤 **Profil** - Kind-Profil und Team-Informationen

## Tech Stack

- **Framework**: Next.js 16 mit App Router
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Auth**: Session-basierte Authentifizierung

## Lokale Entwicklung

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Environment Variables einrichten:**
   ```bash
   cp .env.example .env.local
   ```
   Dann die Werte in `.env.local` anpassen.

3. **Prisma Client generieren:**
   ```bash
   npx prisma generate
   ```

4. **Development Server starten:**
   ```bash
   npm run dev
   ```

   Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## Deployment auf Vercel

### Environment Variables in Vercel

Füge folgende Environment Variables in deinem Vercel Projekt hinzu:

| Variable | Beschreibung |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL Connection String (Neon) |
| `SESSION_SECRET` | Geheimer Schlüssel für Session-Cookies (min. 32 Zeichen) |

**Security note:**
- Nie reale Secrets in `.env.example` oder im Repo committen.
- Wenn ein Secret versehentlich veröffentlicht wurde, rotiere es sofort (DB credentials, Cloudinary API secret, Session secret).
- Lokale secrets sollten in `.env.local` bleiben and the file should be listed in `.gitignore`.

### Deploy

1. Pushe das Repository zu GitHub
2. Importiere das Projekt in Vercel
3. Setze die Environment Variables
4. Deploy!

## Projektstruktur

```
src/
├── app/                 # Next.js App Router Pages
│   ├── events/         # Events & Ankündigungen
│   ├── login/          # Login-Seite
│   ├── profil/         # Profil-Seite
│   └── training/       # Training-Übersicht
├── components/         # React Components
│   └── ui/            # UI Components
└── lib/               # Utilities & Database
    ├── auth.ts        # Authentifizierung
    ├── db.ts          # Prisma Client
    └── utils.ts       # Helper Functions
```

## Lizenz

Privates Projekt
