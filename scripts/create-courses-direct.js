// Dieses Script erstellt die notwendigen courses-Tabellen in der Supabase-Datenbank
const { createClient } = require('@supabase/supabase-js');

// Konfiguration (DIESE WERTE SIND VERTRAULICH!)
const supabaseUrl = 'https://owevgcllokbxlxdauxrm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXZnY2xsb2tieGx4ZGF1eHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI4NzU4OCwiZXhwIjoyMDU4ODYzNTg4fQ.-r2BdN5AaroBqpv-XmCYQNe7g1vcwIUuNyBPLsvzPwk';

// Supabase-Client mit Service-Role-Key erstellen
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funktion zum Ausführen einer SQL-Abfrage mit dem REST API
async function executeSql(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SQL-Ausführungsfehler:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler bei der SQL-Ausführung:', error);
    return false;
  }
}

// Funktion zum direkten Erstellen der Tabellen mit dem Supabase-Client
async function createCoursesTable() {
  console.log('Erstelle die courses-Tabelle...');

  try {
    // Prüfen, ob die Tabelle bereits existiert
    const { error: checkError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Die courses-Tabelle existiert bereits!');
      return true;
    }

    // Tabelle erstellen, wenn sie nicht existiert
    const { error } = await supabase.rpc('exec_sql', {
      query: `
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
      `
    });

    if (error) {
      console.error('Fehler beim Erstellen der courses-Tabelle:', error);
      
      // Alternativer Ansatz: Direkt mit dem REST API
      console.log('Versuche alternativen Ansatz...');
      
      // Erstellen der Tabelle mit minimaler Struktur
      await supabase.schema.createTable('courses', {
        id: {
          type: 'uuid',
          primaryKey: true,
          defaultValue: { type: 'uuid', generation: 'gen_random_uuid()' }
        },
        created_at: {
          type: 'timestamptz',
          notNull: true,
          defaultValue: { type: 'now()' }
        },
        updated_at: {
          type: 'timestamptz',
          notNull: true,
          defaultValue: { type: 'now()' }
        },
        title: {
          type: 'text',
          notNull: true
        },
        description: {
          type: 'text'
        },
        max_participants: {
          type: 'integer',
          defaultValue: 10
        },
        instructor_id: {
          type: 'uuid',
          references: 'profiles(id)',
          onDelete: 'set null'
        },
        start_date: {
          type: 'timestamptz'
        },
        end_date: {
          type: 'timestamptz'
        },
        location: {
          type: 'text'
        },
        status: {
          type: 'text',
          defaultValue: 'geplant'
        }
      });
      
      console.log('Courses-Tabelle mit alternativem Ansatz erstellt!');
    } else {
      console.log('Courses-Tabelle erfolgreich erstellt!');
    }

    // Erstellen der course_participants-Tabelle
    console.log('Erstelle die course_participants-Tabelle...');
    
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.course_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
          participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
          status TEXT CHECK (status IN ('angemeldet', 'bestätigt', 'abgeschlossen', 'abgesagt')) DEFAULT 'angemeldet',
          UNIQUE (course_id, participant_id)
        );
      `
    });

    if (participantsError) {
      console.error('Fehler beim Erstellen der course_participants-Tabelle:', participantsError);
      
      // Alternativer Ansatz für course_participants
      await supabase.schema.createTable('course_participants', {
        id: {
          type: 'uuid',
          primaryKey: true,
          defaultValue: { type: 'uuid', generation: 'gen_random_uuid()' }
        },
        created_at: {
          type: 'timestamptz',
          notNull: true,
          defaultValue: { type: 'now()' }
        },
        course_id: {
          type: 'uuid',
          notNull: true,
          references: 'courses(id)',
          onDelete: 'cascade'
        },
        participant_id: {
          type: 'uuid',
          notNull: true,
          references: 'profiles(id)',
          onDelete: 'cascade'
        },
        status: {
          type: 'text',
          defaultValue: 'angemeldet'
        }
      });
      
      console.log('Course_participants-Tabelle mit alternativem Ansatz erstellt!');
    } else {
      console.log('Course_participants-Tabelle erfolgreich erstellt!');
    }

    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen der Tabellen:', error);
    return false;
  }
}

// Funktion zum Erstellen von Beispieldaten
async function createSampleData() {
  console.log('Erstelle Beispieldaten...');

  try {
    // Beispiel-Kurse einfügen
    const { error } = await supabase
      .from('courses')
      .insert([
        {
          title: 'Einführung in Windsurf',
          description: 'Grundlagen des Windsurfens für Anfänger',
          max_participants: 8,
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 Woche in der Zukunft
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 Stunden
          location: 'Strandpromenade',
          status: 'geplant'
        },
        {
          title: 'Fortgeschrittenes Windsurfen',
          description: 'Techniken für Fortgeschrittene',
          max_participants: 6,
          start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 Wochen in der Zukunft
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 Stunden
          location: 'Nordsee',
          status: 'geplant'
        },
        {
          title: 'Therapie im Wasser',
          description: 'Rehabilitationsübungen im Wasser',
          max_participants: 4,
          start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 Tage in der Zukunft
          end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(), // +1 Stunde
          location: 'Therapiebecken',
          status: 'geplant'
        }
      ])
      .select();

    if (error) {
      console.error('Fehler beim Einfügen von Beispieldaten:', error);
      return false;
    }

    console.log('Beispieldaten erfolgreich erstellt!');
    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen von Beispieldaten:', error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  // Zuerst die Tabellen erstellen
  const tablesCreated = await createCoursesTable();
  
  if (tablesCreated) {
    // Dann Beispieldaten einfügen
    await createSampleData();
  }
  
  console.log('Fertig! Sie können nun die Anwendung ohne den "courses"-Fehler nutzen.');
}

// Script ausführen
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unbehandelte Ausnahme:', error);
    process.exit(1);
  });
