'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  
  // Direktes Erstellen des Supabase-Clients
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Prüfe sofort, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Bereits angemeldet, leite weiter zum Dashboard...");
          // Kurze Verzögerung für die Weiterleitung
          setTimeout(() => {
            window.location.href = '/';
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        alert('Überprüfen Sie Ihre E-Mail für den Bestätigungslink.');
      } else {
        console.log("Versuche Anmeldung mit:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Anmeldung erfolgreich:", data);
        
        // Direkte Weiterleitung mit window.location für vollständigen Seitenneuaufbau
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error("Anmeldefehler:", error);
      setError(error.message);
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
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="px-6 py-8">
                <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {isSignUp ? 'Registrieren' : 'Anmelden'}
                </h2>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-Mail
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm dark:bg-gray-700"
                      placeholder="ihre@email.de"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Passwort
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm dark:bg-gray-700"
                      placeholder={isSignUp ? 'Neues Passwort' : 'Ihr Passwort'}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Laden...
                        </div>
                      ) : (
                        isSignUp ? 'Registrieren' : 'Anmelden'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">oder</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      onClick={() => setIsSignUp(!isSignUp)}
                    >
                      {isSignUp
                        ? 'Bereits ein Konto? Anmelden'
                        : 'Kein Konto? Jetzt registrieren'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
              <p> 2025 Windsurf Dashboard. Alle Rechte vorbehalten.</p>
              <p className="mt-1">Datenschutz | Impressum | Kontakt</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
