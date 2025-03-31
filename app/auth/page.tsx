'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {isSignUp ? 'Registrieren' : 'Anmelden'}
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {isSignUp ? 'Erstellen Sie ein neues Konto' : 'Melden Sie sich mit Ihrem Konto an'}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-dark-card py-6 sm:py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">
                E-Mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary text-sm dark:bg-dark-input dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label text-sm font-medium text-gray-700 dark:text-gray-300">
                Passwort
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary text-sm dark:bg-dark-input dark:text-gray-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-error-light/10 dark:bg-error-dark/20 p-3 sm:p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-error dark:text-error-light"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xs sm:text-sm font-medium text-error dark:text-error-light">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn-primary w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={loading}
              >
                {loading ? 'Laden...' : isSignUp ? 'Registrieren' : 'Anmelden'}
              </button>
            </div>
          </form>

          <div className="mt-5 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-dark-card px-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">oder</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300"
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
    </div>
  );
}
