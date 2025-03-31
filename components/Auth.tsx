'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthComponent() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth-Komponente: Auth-Status geändert:", event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log("Auth-Komponente: Benutzer angemeldet, ID:", session.user.id);
          
          // Benutzerrolle überprüfen und entsprechend weiterleiten
          try {
            // Kurze Verzögerung, um sicherzustellen, dass das Profil erstellt wurde
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: userData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error("Auth-Komponente: Fehler beim Abrufen des Profils:", profileError);
              
              // Wenn kein Profil gefunden wurde, erstellen wir eines mit der Rolle aus den Metadaten oder 'patient' als Standard
              if (profileError.code === 'PGRST116') {
                const userMetadata = session.user.user_metadata;
                const role = userMetadata?.role || 'patient';
                
                console.log("Auth-Komponente: Erstelle neues Profil mit Rolle:", role);
                
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
                  console.error("Auth-Komponente: Fehler beim Erstellen des Profils:", insertError);
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
            console.log("Auth-Komponente: Benutzerrolle gefunden:", role);
              
            if (role === 'admin') {
              router.push('/admin');
            } else if (role === 'trainer') {
              router.push('/trainer');
            } else {
              router.push('/patient');
            }
          } catch (error) {
            console.error("Auth-Komponente: Fehler bei der Rollenprüfung:", error);
            router.push('/auth?error=role_check_error');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Passwort',
                button_label: 'Anmelden',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Passwort',
                button_label: 'Registrieren',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
