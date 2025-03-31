'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'trainer' | 'patient'>('patient');
  const router = useRouter();
  
  // Verwenden des Singleton-Clients
  const supabase = getSupabaseClient();

  // Prüfe sofort, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Bereits angemeldet, leite weiter zum Dashboard...");
          
          // Benutzerrolle aus Metadaten abrufen
          const { data: userData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
          
          const role = userData?.role || 'patient';
          
          // Weiterleitung basierend auf Rolle
          setTimeout(() => {
            if (role === 'admin') {
              window.location.href = '/admin';
            } else if (role === 'trainer') {
              window.location.href = '/trainer';
            } else {
              window.location.href = '/patient';
            }
          }, 500);
        }
      } catch (error) {
        console.error("Fehler bei der Sessionprüfung:", error);
      }
    };
    
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Registrierung
        console.log("Registrierung mit Rolle:", userRole);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              role: userRole
            }
          },
        });
        
        if (error) throw error;
        
        // Benutzer in die profiles-Tabelle einfügen
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                email: email,
                role: userRole,
                created_at: new Date()
              }
            ]);
            
          if (profileError) {
            console.error("Fehler beim Erstellen des Profils:", profileError);
            throw profileError;
          }
        }
        
        alert('Überprüfen Sie Ihre E-Mail für den Bestätigungslink.');
      } else {
        // Anmeldung
        console.log("Versuche Anmeldung mit:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Anmeldung erfolgreich:", data);
        
        // Benutzerrolle abrufen
        const { data: userData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error("Fehler beim Abrufen des Profils:", profileError);
          // Wenn kein Profil gefunden wurde, erstellen wir eines mit Standardrolle 'patient'
          if (profileError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: data.user.id, 
                  email: email,
                  role: 'patient',
                  created_at: new Date()
                }
              ]);
            
            if (insertError) {
              console.error("Fehler beim Erstellen des Profils nach Anmeldung:", insertError);
            }
            
            // Weiterleitung zum Patienten-Dashboard
            window.location.href = '/patient';
            return;
          }
        }
        
        const role = userData?.role || 'patient';
        console.log("Benutzerrolle:", role);
        
        // Weiterleitung basierend auf Rolle
        if (role === 'admin') {
          window.location.href = '/admin';
        } else if (role === 'trainer') {
          window.location.href = '/trainer';
        } else {
          window.location.href = '/patient';
        }
      }
    } catch (error: any) {
      console.error("Anmeldefehler:", error);
      setError(error.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hintergrund-Elemente */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/wave-pattern.svg')] bg-repeat opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 dark:bg-blue-600 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400 dark:bg-teal-600 rounded-full filter blur-3xl opacity-20"></div>
      </div>

      {/* Hauptinhalt */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Linke Seite - Branding und Info (auf größeren Bildschirmen) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="relative h-24 w-24 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Windsurf Dashboard</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Verwalten Sie Ihre Windsurfkurse, Patienten und Termine in einer intuitiven, benutzerfreundlichen Plattform.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="text-primary dark:text-blue-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Kursverwaltung</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planen und verwalten Sie Ihre Kurse effizient</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="text-primary dark:text-blue-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Patientendaten</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verwalten Sie Patienteninformationen sicher</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="text-primary dark:text-blue-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Terminplanung</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Behalten Sie den Überblick über alle Termine</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="text-primary dark:text-blue-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Kommunikation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bleiben Sie mit Ihrem Team verbunden</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Branding (nur auf kleinen Bildschirmen) */}
        <div className="lg:hidden pt-10 pb-6 px-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative h-16 w-16 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Windsurf Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Verwalten Sie Ihre Windsurfkurse, Patienten und Termine in einer intuitiven Plattform.
          </p>
        </div>

        {/* Rechte Seite - Anmeldeformular */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {isSignUp ? 'Konto erstellen' : 'Anmelden'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isSignUp 
                  ? 'Erstellen Sie ein neues Konto, um fortzufahren' 
                  : 'Melden Sie sich mit Ihren Zugangsdaten an'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
                  placeholder={isSignUp ? "Mindestens 6 Zeichen" : "Ihr Passwort"}
                />
              </div>
              
              {isSignUp && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rolle auswählen
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserRole('admin')}
                      className={`px-3 py-2 text-sm font-medium rounded-md text-center transition-colors
                        ${userRole === 'admin' 
                          ? 'bg-primary text-white dark:bg-blue-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRole('trainer')}
                      className={`px-3 py-2 text-sm font-medium rounded-md text-center transition-colors
                        ${userRole === 'trainer' 
                          ? 'bg-primary text-white dark:bg-blue-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                      Trainer
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRole('patient')}
                      className={`px-3 py-2 text-sm font-medium rounded-md text-center transition-colors
                        ${userRole === 'patient' 
                          ? 'bg-primary text-white dark:bg-blue-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                      Patient
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                  dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird bearbeitet...
                    </span>
                  ) : isSignUp ? 'Registrieren' : 'Anmelden'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {isSignUp ? 'Bereits registriert? Anmelden' : 'Neues Konto erstellen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
