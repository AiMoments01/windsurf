// Dieses Script erstellt eine einfache courses-Tabelle in der Supabase-Datenbank
const { createClient } = require('@supabase/supabase-js');

// Konfiguration
const supabaseUrl = 'https://owevgcllokbxlxdauxrm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXZnY2xsb2tieGx4ZGF1eHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI4NzU4OCwiZXhwIjoyMDU4ODYzNTg4fQ.-r2BdN5AaroBqpv-XmCYQNe7g1vcwIUuNyBPLsvzPwk';

// Supabase-Client mit Service-Role-Key erstellen
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funktion zum Erstellen der courses-Tabelle
async function createSimpleCourses() {
  console.log('Versuche, eine einfache courses-Tabelle zu erstellen...');

  try {
    // Prüfen, ob die Tabelle bereits existiert
    const { data, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Die courses-Tabelle existiert bereits!');
      return true;
    }

    // Direkte REST-API-Anfrage zum Erstellen der Tabelle
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        name: 'courses',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'created_at', type: 'timestamptz', notNull: true, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamptz', notNull: true, defaultValue: 'now()' },
          { name: 'title', type: 'text', notNull: true },
          { name: 'description', type: 'text' },
          { name: 'max_participants', type: 'integer', defaultValue: '10' },
          { name: 'instructor_id', type: 'uuid', references: 'profiles(id)' },
          { name: 'start_date', type: 'timestamptz' },
          { name: 'end_date', type: 'timestamptz' },
          { name: 'location', type: 'text' },
          { name: 'status', type: 'text', defaultValue: 'geplant' }
        ]
      })
    });

    if (!response.ok) {
      console.error('Fehler beim Erstellen der Tabelle:', await response.text());
      return false;
    }

    console.log('Courses-Tabelle erfolgreich erstellt!');

    // Beispieldaten einfügen
    const { error: insertError } = await supabase
      .from('courses')
      .insert([
        {
          title: 'Einführung in Windsurf',
          description: 'Grundlagen des Windsurfens für Anfänger',
          max_participants: 8,
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Strandpromenade',
          status: 'geplant'
        },
        {
          title: 'Fortgeschrittenes Windsurfen',
          description: 'Techniken für Fortgeschrittene',
          max_participants: 6,
          start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          location: 'Nordsee',
          status: 'geplant'
        }
      ]);

    if (insertError) {
      console.error('Fehler beim Einfügen von Beispieldaten:', insertError);
    } else {
      console.log('Beispieldaten erfolgreich eingefügt!');
    }

    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return false;
  }
}

// Script ausführen
createSimpleCourses()
  .then(success => {
    if (success) {
      console.log('Fertig! Bitte überprüfen Sie die Supabase-Konsole, um zu sehen, ob die Tabelle erstellt wurde.');
    } else {
      console.log('Es gab Probleme beim Erstellen der Tabelle. Bitte führen Sie das SQL-Skript manuell aus.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unbehandelte Ausnahme:', error);
    process.exit(1);
  });
