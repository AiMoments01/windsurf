// Dieses Script testet, ob die profiles-Tabelle erfolgreich erstellt wurde
const { createClient } = require('@supabase/supabase-js');

// Konfiguration aus der Anwendung verwenden
const supabaseUrl = 'https://owevgcllokbxlxdauxrm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXZnY2xsb2tieGx4ZGF1eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODc1ODgsImV4cCI6MjA1ODg2MzU4OH0.lc7QU5Knq2K6-c-i0HKCJHn6rXBwYdIvUgfNDRbC_jk';

// Supabase-Client erstellen
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfilesTable() {
  console.log('Teste die profiles-Tabelle...');

  try {
    // Abfrage nach der Struktur der Tabelle
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Fehler beim Abfragen der profiles-Tabelle:', error);
      return false;
    }

    console.log('Success! Die profiles-Tabelle existiert und ist abfragbar!');
    console.log(`${data.length} Profile gefunden.`);
    
    if (data.length > 0) {
      console.log('Beispiel-Profildaten:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('Keine Profile gefunden, aber die Tabelle existiert.');
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Testen der profiles-Tabelle:', error);
    return false;
  }
}

// Test ausführen
testProfilesTable()
  .then(success => {
    if (success) {
      console.log('Die Anwendung sollte jetzt ohne den "profiles does not exist"-Fehler funktionieren!');
    } else {
      console.log('Es gibt noch Probleme mit der profiles-Tabelle. Bitte überprüfen Sie das SQL-Skript und führen Sie es erneut aus.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unerwarteter Fehler:', error);
    process.exit(1);
  });
