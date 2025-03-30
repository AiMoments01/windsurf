import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Überprüft, ob eine Tabelle in der Datenbank existiert.
 */
export async function checkTableExists(supabase: SupabaseClient, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      // Wenn der Fehler "relation does not exist" enthält, dann existiert die Tabelle nicht
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.warn(`Tabelle '${tableName}' existiert nicht in der Datenbank.`);
        return false;
      }
      
      // Anderer Fehler, loggen und false zurückgeben
      console.error(`Fehler beim Überprüfen der Tabelle '${tableName}':`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`Ausnahme beim Überprüfen der Tabelle '${tableName}':`, err);
    return false;
  }
}

/**
 * Sicheres Abfragen einer Tabelle mit Fehlerbehandlung für nicht existierende Tabellen.
 */
export async function safeQueryTable<T>(
  supabase: SupabaseClient, 
  tableName: string, 
  queryFn: (query: any) => any,
  fallbackData: T = [] as unknown as T
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Basistabelle abfragen
    const query = supabase.from(tableName);
    
    // Anwenden der benutzerdefinierten Abfrage
    const result = await queryFn(query);
    
    return { data: result.data as T, error: result.error };
  } catch (err: any) {
    // Prüfen, ob es sich um einen "table does not exist"-Fehler handelt
    if (err.message && (
        err.message.includes('relation') && 
        err.message.includes('does not exist')
      )) {
      console.warn(`Tabelle '${tableName}' existiert nicht in der Datenbank. Fallback-Daten werden verwendet.`);
      return { data: fallbackData, error: null };
    }
    
    // Anderer Fehler
    console.error(`Fehler beim Abfragen der Tabelle '${tableName}':`, err);
    return { data: null, error: err };
  }
}

/**
 * Generiert Mock-Profile-Daten für die Anwendung, wenn die Profiltabelle nicht existiert.
 */
export function getMockProfiles(count: number = 10) {
  const roles = ['admin', 'therapist', 'patient'];
  const mockProfiles = [];
  
  for (let i = 0; i < count; i++) {
    mockProfiles.push({
      id: `mock-${i}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: `user${i}@example.com`,
      full_name: `Testbenutzer ${i}`,
      role: roles[i % roles.length],
      phone: `+49123456${i.toString().padStart(4, '0')}`,
      insurance_provider: i % 3 === 0 ? 'AOK' : i % 3 === 1 ? 'TK' : 'Barmer',
      insurance_number: `A${i}${i}${i}${i}${i}${i}`,
      notes: `Notizen für Testbenutzer ${i}`
    });
  }
  
  return mockProfiles;
}

/**
 * Generiert Mock-Kurs-Daten für die Anwendung, wenn die Kurstabelle nicht existiert.
 */
export function getMockCourses(count: number = 5) {
  const courseTypes = ['Wirbelsäulengymnastik', 'Wassergymnastik', 'Funktionstraining'];
  const mockCourses = [];
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (i * 7));
    
    mockCourses.push({
      id: `mock-course-${i}`,
      created_at: new Date().toISOString(),
      title: `${courseTypes[i % courseTypes.length]} ${i + 1}`,
      description: `Beschreibung für ${courseTypes[i % courseTypes.length]} ${i + 1}`,
      max_participants: 10 + i,
      instructor_id: `mock-${i % 2}`, // Mock-Therapeut-ID
      start_date: startDate.toISOString(),
      end_date: new Date(startDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000)).toISOString(), // 12 Wochen später
      location: i % 2 === 0 ? 'Raum A' : 'Raum B',
      status: i % 3 === 0 ? 'geplant' : i % 3 === 1 ? 'aktiv' : 'abgeschlossen'
    });
  }
  
  return mockCourses;
}
