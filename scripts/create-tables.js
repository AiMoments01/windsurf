// Dieses Script erstellt die notwendigen Tabellen in der Supabase-Datenbank
const { createClient } = require('@supabase/supabase-js');

// Konfiguration (DIESE WERTE SIND VERTRAULICH!)
const supabaseUrl = 'https://owevgcllokbxlxdauxrm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXZnY2xsb2tieGx4ZGF1eHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI4NzU4OCwiZXhwIjoyMDU4ODYzNTg4fQ.-r2BdN5AaroBqpv-XmCYQNe7g1vcwIUuNyBPLsvzPwk';

// Supabase-Client mit Service-Role-Key erstellen
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL-Anweisungen zum Erstellen der Tabellen und Funktionen
const createProfilesTableSQL = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'therapist', 'patient')) DEFAULT 'patient',
  phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  notes TEXT
);
`;

const createUpdatedAtFunctionSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const createProfilesTriggerSQL = `
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

const createHandleNewUserFunctionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const createAuthTriggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

const enableRLSSQL = `
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
`;

const createRLSPoliciesSQL = `
CREATE POLICY IF NOT EXISTS "Benutzer können ihre eigenen Profile sehen"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY IF NOT EXISTS "Benutzer können ihre eigenen Profile aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Therapeuten können alle Patientenprofile sehen"
  ON public.profiles
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
    AND role = 'patient'
  );
`;

const createCoursesTableSQL = `
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 10,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  status TEXT CHECK (status IN ('geplant', 'aktiv', 'abgeschlossen')) DEFAULT 'geplant'
);

DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Jeder kann Kurse sehen"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Therapeuten können Kurse erstellen und verwalten"
  ON public.courses
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );
`;

const createCourseParticipantsTableSQL = `
CREATE TABLE IF NOT EXISTS public.course_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('angemeldet', 'bestätigt', 'abgeschlossen', 'abgesagt')) DEFAULT 'angemeldet',
  UNIQUE (course_id, participant_id)
);

ALTER TABLE public.course_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Benutzer können ihre eigenen Kursanmeldungen sehen"
  ON public.course_participants
  FOR SELECT
  USING (auth.uid() = participant_id);

CREATE POLICY IF NOT EXISTS "Therapeuten können alle Kursanmeldungen sehen"
  ON public.course_participants
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );

CREATE POLICY IF NOT EXISTS "Therapeuten können Kursanmeldungen verwalten"
  ON public.course_participants
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );
`;

const createMessagesTableSQL = `
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Jeder kann Nachrichten sehen"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Jeder kann Nachrichten erstellen"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
`;

// Funktion zum Ausführen einer SQL-Abfrage
async function executeQuery(sql, name) {
  try {
    console.log(`Führe aus: ${name}...`);
    const { data, error } = await supabase.rpc('pgmoon.query', { query: sql });
    
    if (error) {
      console.error(`Fehler bei ${name}:`, error);
      return false;
    }
    
    console.log(`${name} erfolgreich ausgeführt!`);
    return true;
  } catch (error) {
    console.error(`Ausnahme bei ${name}:`, error);
    return false;
  }
}

// Ausführen aller SQL-Befehle
async function createTables() {
  console.log('Beginne mit dem Erstellen der Tabellen und Funktionen...');
  
  // Erstellen der profiles-Tabelle und zugehörige Funktionen
  await executeQuery(createProfilesTableSQL, 'Erstellen der profiles-Tabelle');
  await executeQuery(createUpdatedAtFunctionSQL, 'Erstellen der updated_at-Funktion');
  await executeQuery(createProfilesTriggerSQL, 'Erstellen des profiles-Triggers');
  await executeQuery(createHandleNewUserFunctionSQL, 'Erstellen der handle_new_user-Funktion');
  await executeQuery(createAuthTriggerSQL, 'Erstellen des Auth-Triggers');
  await executeQuery(enableRLSSQL, 'Aktivieren der Row Level Security');
  await executeQuery(createRLSPoliciesSQL, 'Erstellen der RLS-Richtlinien');
  
  // Erstellen der anderen Tabellen
  await executeQuery(createCoursesTableSQL, 'Erstellen der courses-Tabelle');
  await executeQuery(createCourseParticipantsTableSQL, 'Erstellen der course_participants-Tabelle');
  await executeQuery(createMessagesTableSQL, 'Erstellen der messages-Tabelle');
  
  console.log('Alle SQL-Befehle wurden ausgeführt. Prüfen Sie die Konsolenausgabe auf Fehler.');
}

// Script ausführen
createTables()
  .then(() => {
    console.log('Tabellenerstellung abgeschlossen.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fehler beim Erstellen der Tabellen:', error);
    process.exit(1);
  });
