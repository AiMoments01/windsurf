'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, UserGroupIcon, DocumentTextIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/ThemeContext';

interface DashboardStats {
  totalPatients: number;
  activeCourses: number;
  upcomingSessions: number;
  pendingPrescriptions: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeCourses: 0,
    upcomingSessions: 0,
    pendingPrescriptions: 0,
  });
  const { theme } = useTheme();

  // Direktes Erstellen des Supabase-Clients (temporäre Lösung)
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    // Prüfe den Auth-Status und hole den Benutzer
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Fehler beim Abrufen der Sitzung:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();
    
    // Auth-Status-Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    // Statistiken auch ohne Benutzer laden, um Ladeindikator zu vermeiden
    const fetchStats = async () => {
      try {
        // Demo-Statistiken (einfache Version)
        setStats({
          totalPatients: 24,
          activeCourses: 5,
          upcomingSessions: 12,
          pendingPrescriptions: 8,
        });
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
        // Fallback-Statistiken bei Fehler
        setStats({
          totalPatients: 0,
          activeCourses: 0,
          upcomingSessions: 0,
          pendingPrescriptions: 0,
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
      
      {loading ? (
        <div className="mt-4 sm:mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary dark:border-blue-400"></div>
        </div>
      ) : !user ? (
        <div className="mt-4 sm:mt-6 rounded-lg bg-white dark:bg-dark-card p-4 sm:p-6 shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Willkommen beim Rehasport Management System</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Bitte melden Sie sich an, um Zugriff auf alle Funktionen zu erhalten.
          </p>
          <div className="mt-4">
            <Link 
              href="/auth" 
              className="btn-primary text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-5 xs:grid-cols-2 lg:grid-cols-4">
            <div className="dashboard-stat">
              <div className="p-3 sm:p-5">
                <div className="flex items-center">
                  <div className="stat-icon">
                    <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Patienten</dt>
                      <dd>
                        <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{stats.totalPatients}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm">
                  <Link href="/patients" className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                    Alle anzeigen
                  </Link>
                </div>
              </div>
            </div>

            <div className="dashboard-stat">
              <div className="p-3 sm:p-5">
                <div className="flex items-center">
                  <div className="stat-icon">
                    <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Aktive Kurse</dt>
                      <dd>
                        <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{stats.activeCourses}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm">
                  <Link href="/courses" className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                    Alle anzeigen
                  </Link>
                </div>
              </div>
            </div>

            <div className="dashboard-stat">
              <div className="p-3 sm:p-5">
                <div className="flex items-center">
                  <div className="stat-icon">
                    <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Kommende Termine</dt>
                      <dd>
                        <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{stats.upcomingSessions}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm">
                  <Link href="/calendar" className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                    Kalender öffnen
                  </Link>
                </div>
              </div>
            </div>

            <div className="dashboard-stat">
              <div className="p-3 sm:p-5">
                <div className="flex items-center">
                  <div className="stat-icon">
                    <ClipboardDocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Offene Verordnungen</dt>
                      <dd>
                        <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{stats.pendingPrescriptions}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm">
                  <Link href="/prescriptions" className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                    Alle anzeigen
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Aktivitätsübersicht</h2>
            <div className="bg-white dark:bg-dark-card shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center">
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-primary dark:text-blue-400 truncate">
                          Kurssitzung
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Wirbelsäulengymnastik - Mittwoch, 14:00 Uhr
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:ml-5">
                        <div className="inline-flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          8 Teilnehmer
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm">
                  <Link href="/calendar" className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                    Alle Aktivitäten anzeigen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
