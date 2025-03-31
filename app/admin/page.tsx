'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  UsersIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Statistik-Komponente
const StatCard = ({ icon, title, value, linkText, linkHref }: { 
  icon: React.ReactNode, 
  title: string, 
  value: number | string,
  linkText: string,
  linkHref: string
}) => (
  <div className="dashboard-stat">
    <div className="p-3 sm:p-5">
      <div className="flex items-center">
        <div className="stat-icon">
          {icon}
        </div>
        <div className="ml-3 sm:ml-5 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
            <dd>
              <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="bg-gray-50 dark:bg-gray-800/50 px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs sm:text-sm">
        <Link href={linkHref} className="font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
          {linkText}
        </Link>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState({
    totalUsers: 0,
    trainers: 0,
    patients: 0,
    activeCourses: 0,
    upcomingSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Prüfen, ob der Benutzer angemeldet ist und Admin-Rechte hat
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      // Benutzerrolle überprüfen
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!userData || userData.role !== 'admin') {
        // Wenn kein Admin, zur entsprechenden Seite weiterleiten
        if (userData?.role === 'trainer') {
          router.push('/trainer');
        } else {
          router.push('/patient');
        }
        return;
      }

      setUser(session.user);

      // Statistiken laden
      try {
        // Benutzerstatistiken
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('role');
        
        if (usersError) throw usersError;
        
        const totalUsers = usersData.length;
        const trainers = usersData.filter(u => u.role === 'trainer').length;
        const patients = usersData.filter(u => u.role === 'patient').length;

        // Kursstatistiken
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .gte('end_date', new Date().toISOString());
        
        if (coursesError) throw coursesError;
        
        const activeCourses = coursesData.length;

        // Terminstatistiken
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .gte('date', new Date().toISOString());
        
        if (sessionsError) throw sessionsError;
        
        const upcomingSessions = sessionsData.length;

        setStats({
          totalUsers,
          trainers,
          patients,
          activeCourses,
          upcomingSessions
        });
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Willkommen zurück, {user?.email}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System-Übersicht
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Gesamtbenutzer"
            value={stats.totalUsers}
            linkText="Benutzer verwalten"
            linkHref="/admin/users"
          />
          <StatCard
            icon={<UserIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Trainer"
            value={stats.trainers}
            linkText="Trainer verwalten"
            linkHref="/admin/trainers"
          />
          <StatCard
            icon={<UserIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Patienten"
            value={stats.patients}
            linkText="Patienten verwalten"
            linkHref="/admin/patients"
          />
          <StatCard
            icon={<DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Aktive Kurse"
            value={stats.activeCourses}
            linkText="Kurse verwalten"
            linkHref="/admin/courses"
          />
          <StatCard
            icon={<CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Kommende Termine"
            value={stats.upcomingSessions}
            linkText="Terminkalender"
            linkHref="/admin/calendar"
          />
          <StatCard
            icon={<ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
            title="Analysen"
            value="Berichte"
            linkText="Statistiken anzeigen"
            linkHref="/admin/analytics"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Administration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                <Cog6ToothIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Systemeinstellungen
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Konfigurieren Sie Systemparameter
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/settings" className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                Einstellungen öffnen →
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Benutzerverwaltung
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Benutzer und Berechtigungen verwalten
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/users" className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                Benutzer verwalten →
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Kursverwaltung
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Kurse und Module verwalten
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/courses" className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                Kurse verwalten →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
