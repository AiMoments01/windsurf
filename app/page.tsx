'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDaysIcon, UserGroupIcon, DocumentTextIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

interface DashboardStats {
  totalPatients: number;
  activeCourses: number;
  upcomingSessions: number;
  pendingPrescriptions: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeCourses: 0,
    upcomingSessions: 0,
    pendingPrescriptions: 0,
  });
  const { theme } = useTheme();

  // Verwenden des Singleton-Clients
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Prüfe den Auth-Status und hole den Benutzer
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Wenn nicht angemeldet, zur Anmeldeseite weiterleiten
          console.log("Keine Sitzung gefunden, leite zur Anmeldeseite weiter");
          router.push('/auth');
          return;
        }

        setUser(session.user);
        console.log("Hauptseite: Benutzer gefunden, ID:", session.user.id);

        // Benutzerrolle überprüfen
        const { data: userData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Hauptseite: Fehler beim Abrufen des Profils:", profileError);
          
          // Wenn kein Profil gefunden wurde, erstellen wir eines mit der Rolle aus den Metadaten oder 'patient' als Standard
          if (profileError.code === 'PGRST116') {
            const userMetadata = session.user.user_metadata;
            const role = userMetadata?.role || 'patient';
            
            console.log("Hauptseite: Erstelle neues Profil mit Rolle:", role);
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: session.user.id, 
                  email: session.user.email,
                  role: role,
                  created_at: new Date()
                }
              ]);
            
            if (insertError) {
              console.error("Hauptseite: Fehler beim Erstellen des Profils:", insertError);
              router.push('/auth?error=profile_creation_failed');
              return;
            }
            
            // Weiterleitung basierend auf Rolle
            if (role === 'admin') {
              router.push('/admin');
            } else if (role === 'trainer') {
              router.push('/trainer');
            } else {
              router.push('/patient');
            }
            return;
          }
          
          // Bei anderen Fehlern zur Auth-Seite zurück
          router.push('/auth?error=profile_error');
          return;
        }

        // Weiterleitung basierend auf Rolle
        const role = userData?.role || 'patient';
        console.log("Hauptseite: Benutzerrolle gefunden:", role);
        
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'trainer') {
          router.push('/trainer');
        } else {
          router.push('/patient');
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Sitzung:', error);
        setUser(null);
        router.push('/auth?error=session_error');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Auth-Status-Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth-Status geändert:", event);
        
        if (session) {
          setUser(session.user);
          
          // Bei Anmeldung Rolle überprüfen und weiterleiten
          const checkRole = async () => {
            try {
              const { data: userData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              if (profileError) {
                console.error("Auth-Listener: Fehler beim Abrufen des Profils:", profileError);
                
                // Wenn kein Profil gefunden wurde, erstellen wir eines mit der Rolle aus den Metadaten oder 'patient' als Standard
                if (profileError.code === 'PGRST116') {
                  const userMetadata = session.user.user_metadata;
                  const role = userMetadata?.role || 'patient';
                  
                  console.log("Auth-Listener: Erstelle neues Profil mit Rolle:", role);
                  
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([
                      { 
                        id: session.user.id, 
                        email: session.user.email,
                        role: role,
                        created_at: new Date()
                      }
                    ]);
                  
                  if (insertError) {
                    console.error("Auth-Listener: Fehler beim Erstellen des Profils:", insertError);
                    router.push('/auth?error=profile_creation_failed');
                    return;
                  }
                  
                  // Weiterleitung basierend auf Rolle
                  if (role === 'admin') {
                    router.push('/admin');
                  } else if (role === 'trainer') {
                    router.push('/trainer');
                  } else {
                    router.push('/patient');
                  }
                  return;
                }
                
                // Bei anderen Fehlern zur Auth-Seite zurück
                router.push('/auth?error=profile_error');
                return;
              }
                
              const role = userData?.role || 'patient';
              console.log("Auth-Listener: Benutzerrolle gefunden:", role);
                
              if (role === 'admin') {
                router.push('/admin');
              } else if (role === 'trainer') {
                router.push('/trainer');
              } else {
                router.push('/patient');
              }
            } catch (error) {
              console.error("Auth-Listener: Fehler bei der Rollenprüfung:", error);
              router.push('/auth?error=role_check_error');
            }
          };
          
          checkRole();
        } else {
          setUser(null);
          router.push('/auth');
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Zeige Ladeindikator während der Weiterleitung
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-blue-400"></div>
    </div>
  );
}
