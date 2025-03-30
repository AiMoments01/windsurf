# Windsurf Kursmanagement Dashboard

Ein modernes Dashboard für die Verwaltung von Windsurfkursen mit den folgenden Features:

- Kalender-Ansicht für Kurse (Tages-, Wochen- und Monatsansicht)
- Rollenbasierte Zugriffskontrolle (Admin, Trainer, User)
- Kursverwaltung mit Teilnehmer-Management
- Echtzeit-Chat über Supabase
- Responsive Design

## Tech Stack

- Frontend: Next.js 14 mit TypeScript
- UI: Tailwind CSS
- Kalender: FullCalendar
- Backend: Supabase (Auth, DB, Realtime)

## Installation

1. Erstelle ein neues Supabase Projekt:
   - Gehe zu [Supabase](https://supabase.com)
   - Erstelle ein neues Projekt
   - Kopiere die Projekt-URL und den Anon-Key

2. Kopiere die `.env.example` Datei:
```bash
cp .env.example .env.local
```

3. Füge die Supabase Konfiguration in die `.env.local` Datei ein:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Installiere die Abhängigkeiten:
```bash
npm install
```

5. Starte die Entwicklungsumgebung:
```bash
npm run dev
```

## Supabase Setup

1. Importiere das Schema:
   - Gehe zu deinem Supabase Projekt
   - Navigiere zu "SQL Editor"
   - Kopiere den Inhalt aus `supabase/schema.sql`
   - Führe den SQL-Code aus

2. Konfiguriere die Authentifizierung:
   - Gehe zu "Authentication"
   - Konfiguriere die gewünschten Auth-Provider (Email/Passwort, OAuth, etc.)

## Verfügbare Rollen

- Admin: Vollzugriff auf alle Funktionen
- Trainer: Verwaltung eigener Kurse und Chat mit Teilnehmern
- User: Anmeldung zu Kursen und Chat mit Trainern/Admins

## Entwicklung

Das Projekt verwendet Next.js 14 mit der App Router Architektur. Alle wichtigen Komponenten sind im `app` Verzeichnis zu finden.

## Lizenz

MIT
