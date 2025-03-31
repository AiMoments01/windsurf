import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: '', ...options });
          },
        },
      }
    );
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Callback-Route: Fehler beim Code-Austausch:", error);
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=auth_callback_error`);
      }
      
      // Hole die aktuelle Sitzung und Benutzerrolle
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("Callback-Route: Keine Sitzung nach Code-Austausch gefunden");
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_session`);
      }
      
      console.log("Callback-Route: Sitzung erfolgreich erhalten, Benutzer-ID:", session.user.id);
      
      // Benutzerrolle überprüfen
      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error("Callback-Route: Fehler beim Abrufen des Profils:", profileError);
        
        // Wenn kein Profil gefunden wurde, erstellen wir eines mit der Rolle aus den Metadaten oder 'patient' als Standard
        if (profileError.code === 'PGRST116') {
          const userMetadata = session.user.user_metadata;
          const role = userMetadata?.role || 'patient';
          
          console.log("Callback-Route: Erstelle neues Profil mit Rolle:", role);
          
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
            console.error("Callback-Route: Fehler beim Erstellen des Profils:", insertError);
            return NextResponse.redirect(`${requestUrl.origin}/auth?error=profile_creation_failed`);
          }
          
          // Weiterleitung basierend auf Rolle
          if (role === 'admin') {
            return NextResponse.redirect(`${requestUrl.origin}/admin`);
          } else if (role === 'trainer') {
            return NextResponse.redirect(`${requestUrl.origin}/trainer`);
          } else {
            return NextResponse.redirect(`${requestUrl.origin}/patient`);
          }
        }
        
        // Bei anderen Fehlern zur Auth-Seite zurück
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=profile_error`);
      }
      
      // Weiterleitung basierend auf Rolle
      const role = userData?.role || 'patient';
      console.log("Callback-Route: Benutzerrolle gefunden:", role);
      
      if (role === 'admin') {
        return NextResponse.redirect(`${requestUrl.origin}/admin`);
      } else if (role === 'trainer') {
        return NextResponse.redirect(`${requestUrl.origin}/trainer`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/patient`);
      }
    } catch (error) {
      console.error("Callback-Route: Unerwarteter Fehler:", error);
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=unexpected_error`);
    }
  }

  // Fallback zur Hauptseite
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
