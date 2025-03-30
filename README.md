# Windsurf Kursmanagement Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/b99e0d68-b98d-47a6-854e-58be3dc239a1/deploy-status)](https://app.netlify.com/sites/windsurf02/deploys)

Ein modernes Dashboard für die Verwaltung von Windsurfkursen mit den folgenden Features:

- Kalender-Ansicht für Kurse (Tages-, Wochen- und Monatsansicht)
- Rollenbasierte Zugriffskontrolle (Admin, Trainer, User)
- Kursverwaltung mit Teilnehmer-Management
- Echtzeit-Chat über Supabase
- Responsive Design
- Dark Mode Unterstützung

## Live-Demo

Das Projekt ist live unter [https://windsurf02.netlify.app](https://windsurf02.netlify.app) verfügbar.

## Tech Stack

- Frontend: Next.js 14 mit TypeScript
- UI: Tailwind CSS mit Dark Mode
- Kalender: FullCalendar
- Backend: Supabase (Auth, DB, Realtime)
- Hosting: Netlify

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
   - Kopiere den Inhalt aus `scripts/create-profiles.sql` und `scripts/create-courses.sql`
   - Führe den SQL-Code aus

2. Konfiguriere die Authentifizierung:
   - Gehe zu "Authentication"
   - Konfiguriere die gewünschten Auth-Provider (Email/Passwort, OAuth, etc.)

3. Erstelle die Messages-Tabelle für den Chat:
```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  message TEXT NOT NULL,
  
  CONSTRAINT fk_sender
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_course
    FOREIGN KEY (course_id)
    REFERENCES public.courses(id)
    ON DELETE CASCADE
);

-- RLS-Policies für die Messages-Tabelle
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Administratoren können alle Nachrichten lesen und schreiben
CREATE POLICY "Admins can do everything" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Benutzer können Nachrichten in Kursen lesen, an denen sie teilnehmen
CREATE POLICY "Users can read messages for courses they participate in" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_participants
      WHERE course_participants.course_id = messages.course_id
      AND course_participants.patient_id = auth.uid()
    )
  );

-- Benutzer können Nachrichten in Kursen senden, an denen sie teilnehmen
CREATE POLICY "Users can insert messages for courses they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.course_participants
      WHERE course_participants.course_id = messages.course_id
      AND course_participants.patient_id = auth.uid()
    )
  );
```

## Verfügbare Rollen

- Admin: Vollzugriff auf alle Funktionen
- Trainer: Verwaltung eigener Kurse und Chat mit Teilnehmern
- User: Anmeldung zu Kursen und Chat mit Trainern/Admins

## Entwicklung

Das Projekt verwendet Next.js 14 mit der App Router Architektur. Alle wichtigen Komponenten sind im `app` Verzeichnis zu finden.

## Deployment auf Netlify

1. Erstelle ein neues Netlify-Projekt:
   - Gehe zu [Netlify](https://netlify.com)
   - Verbinde dein GitHub-Repository
   - Konfiguriere die Build-Einstellungen:
     - Build-Befehl: `npm run build`
     - Publish-Verzeichnis: `.next`

2. Konfiguriere die Umgebungsvariablen:
   - Gehe zu "Site settings" > "Environment variables"
   - Füge die folgenden Variablen hinzu:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Aktualisiere die `netlify.toml` Datei:
```toml
[build]
  command = "npm run build"
  publish = ".next"
```

## Sicherheitshinweise

- Verwende niemals den Service-Role-Key als NEXT_PUBLIC_SUPABASE_ANON_KEY
- Stelle sicher, dass die `.env.local` Datei in der `.gitignore` aufgeführt ist
- Konfiguriere Row Level Security (RLS) für alle Tabellen in Supabase

## Lizenz

MIT
