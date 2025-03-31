'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
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

// Aktivitäts-Komponente
const ActivityItem = ({ date, title, description }: {
  date: string,
  title: string,
  description: string
}) => (
  <li className="py-3">
    <div className="flex space-x-3">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <time dateTime={date} className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {new Date(date).toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </time>
    </div>
  </li>
);

export default function TrainerDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState({
    myPatients: 0,
    myCourses: 0,
    upcomingSessions: 0,
    completedSessions: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Prüfen, ob der Benutzer angemeldet ist und Trainer-Rechte hat
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

      if (!userData || userData.role !== 'trainer') {
        // Wenn kein Trainer, zur entsprechenden Seite weiterleiten
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/patient');
        }
        return;
      }

      setUser(session.user);

      // Statistiken laden
      try {
        // Meine Patienten zählen
        const { data: patientsData, error: patientsError } = await supabase
          .from('trainer_patients')
          .select('patient_id')
          .eq('trainer_id', session.user.id);
        
        if (patientsError) throw patientsError;
        
        const myPatients = patientsData.length;

        // Meine Kurse zählen
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('trainer_id', session.user.id)
          .gte('end_date', new Date().toISOString());
        
        if (coursesError) throw coursesError;
        
        const myCourses = coursesData.length;

        // Kommende Termine zählen
        const { data: upcomingSessionsData, error: upcomingSessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('trainer_id', session.user.id)
          .gte('date', new Date().toISOString());
        
        if (upcomingSessionsError) throw upcomingSessionsError;
        
        const upcomingSessions = upcomingSessionsData.length;

        // Abgeschlossene Termine zählen
        const { data: completedSessionsData, error: completedSessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('trainer_id', session.user.id)
          .lt('date', new Date().toISOString());
        
        if (completedSessionsError) throw completedSessionsError;
        
        const completedSessions = completedSessionsData.length;

        setStats({
          myPatients,
          myCourses,
          upcomingSessions,
          completedSessions
        });

        // Aktivitäten laden
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('sessions')
          .select(`
            id,
            date,
            title,
            patients:patient_id (full_name)
          `)
          .eq('trainer_id', session.user.id)
          .order('date', { ascending: true })
          .limit(5);
        
        if (activitiesError) throw activitiesError;
        
        setActivities(activitiesData);
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
          Trainer Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Willkommen zurück, {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Übersicht
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={<UserIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Meine Patienten"
                value={stats.myPatients}
                linkText="Alle anzeigen"
                linkHref="/trainer/patients"
              />
              <StatCard
                icon={<DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Meine Kurse"
                value={stats.myCourses}
                linkText="Alle anzeigen"
                linkHref="/trainer/courses"
              />
              <StatCard
                icon={<CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Kommende Termine"
                value={stats.upcomingSessions}
                linkText="Kalender öffnen"
                linkHref="/trainer/calendar"
              />
              <StatCard
                icon={<ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Abgeschlossene Termine"
                value={stats.completedSessions}
                linkText="Historie anzeigen"
                linkHref="/trainer/history"
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Schnellzugriff
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/trainer/calendar/new" className="block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <CalendarDaysIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Termin erstellen
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/trainer/patients/new" className="block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Patient hinzufügen
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/trainer/chat" className="block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Nachrichten
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Anstehende Aktivitäten
            </h2>
            {activities.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    date={activity.date}
                    title={activity.title}
                    description={`Patient: ${activity.patients?.full_name || 'Unbekannt'}`}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                Keine anstehenden Aktivitäten gefunden.
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/trainer/calendar" className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                Alle Aktivitäten anzeigen →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
