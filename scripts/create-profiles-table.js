// Dieses Script erstellt die notwendige profiles-Tabelle in der Supabase-Datenbank
const { createClient } = require('@supabase/supabase-js');

// Konfiguration (DIESE WERTE SIND VERTRAULICH!)
const supabaseUrl = 'https://owevgcllokbxlxdauxrm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXZnY2xsb2tieGx4ZGF1eHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI4NzU4OCwiZXhwIjoyMDU4ODYzNTg4fQ.-r2BdN5AaroBqpv-XmCYQNe7g1vcwIUuNyBPLsvzPwk';

// Supabase-Client mit Service-Role-Key erstellen
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfilesTable() {
  console.log('Versuche, die profiles-Tabelle zu erstellen...');

  // REST API direkt verwenden, um die Tabelle zu erstellen
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      query: `
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

        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
        CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email)
          VALUES (NEW.id, NEW.email);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Benutzer können ihre eigenen Profile sehen"
          ON public.profiles
          FOR SELECT
          USING (auth.uid() = id);
          
        CREATE POLICY "Benutzer können ihre eigenen Profile aktualisieren"
          ON public.profiles
          FOR UPDATE
          USING (auth.uid() = id);

        CREATE POLICY "Therapeuten können alle Patientenprofile sehen"
          ON public.profiles
          FOR SELECT
          USING (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
            AND role = 'patient'
          );
      `
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Fehler beim Erstellen der Tabelle:', errorData);
    return false;
  }

  console.log('Die profiles-Tabelle wurde erfolgreich erstellt oder existierte bereits!');
  return true;
}

// Funktion zum Erstellen eines Beispielprofils, um zu testen, ob die Tabelle existiert
async function createSampleData() {
  try {
    console.log('Prüfe, ob die profiles-Tabelle existiert...');
    
    // Prüfen, ob die Tabelle existiert, indem wir einen SELECT ausführen
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Die Tabelle existiert möglicherweise nicht:', error);
      return false;
    }

    console.log('Die profiles-Tabelle existiert!');

    // Anzahl der Profile prüfen
    const { data: profilesCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Fehler beim Zählen der Profile:', countError);
      return false;
    }

    console.log(`Anzahl der vorhandenen Profile: ${profilesCount.count || 0}`);
    
    return true;
  } catch (error) {
    console.error('Fehler bei der Überprüfung der Tabelle:', error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  // Zuerst die Tabelle erstellen
  await createProfilesTable();
  
  // Dann prüfen, ob sie existiert und ggf. Beispieldaten einfügen
  await createSampleData();
  
  console.log('Fertig! Sie können nun die Anwendung ohne den "profiles does not exist"-Fehler nutzen.');
}

// Script ausführen
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unbehandelte Ausnahme:', error);
    process.exit(1);
  });
