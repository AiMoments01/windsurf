'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
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

// Fortschritts-Komponente
const ProgressCard = ({ title, progress, total }: {
  title: string,
  progress: number,
  total: number
}) => {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <div className="flex items-center">
        <div className="flex-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
          {progress}/{total}
        </span>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    completedSessions: 0,
    activeCourses: 0,
    prescriptions: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [progress, setProgress] = useState({
    course1: { title: 'Windsurfkurs Grundlagen', progress: 3, total: 5 },
    course2: { title: 'Fortgeschrittene Techniken', progress: 1, total: 4 },
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Prüfen, ob der Benutzer angemeldet ist und Patient-Rechte hat
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

      if (!userData || userData.role !== 'patient') {
        // Wenn kein Patient, zur entsprechenden Seite weiterleiten
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else if (userData?.role === 'trainer') {
          router.push('/trainer');
        }
        return;
      }

      setUser(session.user);

      // Statistiken laden
      try {
        // Kommende Termine zählen
        const { data: upcomingSessionsData, error: upcomingSessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', session.user.id)
          .gte('date', new Date().toISOString());
        
        if (upcomingSessionsError) throw upcomingSessionsError;
        
        const upcomingSessions = upcomingSessionsData.length;

        // Abgeschlossene Termine zählen
        const { data: completedSessionsData, error: completedSessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', session.user.id)
          .lt('date', new Date().toISOString());
        
        if (completedSessionsError) throw completedSessionsError;
        
        const completedSessions = completedSessionsData.length;

        // Aktive Kurse zählen
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_participants')
          .select('course_id')
          .eq('patient_id', session.user.id);
        
        if (coursesError) throw coursesError;
        
        const activeCourses = coursesData.length;

        // Rezepte zählen
        const { data: prescriptionsData, error: prescriptionsError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', session.user.id);
        
        if (prescriptionsError) throw prescriptionsError;
        
        const prescriptions = prescriptionsData.length;

        setStats({
          upcomingSessions,
          completedSessions,
          activeCourses,
          prescriptions
        });

        // Aktivitäten laden
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('sessions')
          .select(`
            id,
            date,
            title,
            trainers:trainer_id (full_name)
          `)
          .eq('patient_id', session.user.id)
          .order('date', { ascending: true })
          .limit(5);
        
        if (activitiesError) throw activitiesError;
        
        setActivities(activitiesData);

        // Fortschritt laden
        // Hier würde normalerweise der tatsächliche Fortschritt aus der Datenbank geladen werden
        // Für dieses Beispiel verwenden wir Dummy-Daten
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
          Patient Dashboard
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
                icon={<CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Kommende Termine"
                value={stats.upcomingSessions}
                linkText="Kalender öffnen"
                linkHref="/patient/calendar"
              />
              <StatCard
                icon={<DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Aktive Kurse"
                value={stats.activeCourses}
                linkText="Alle anzeigen"
                linkHref="/patient/courses"
              />
              <StatCard
                icon={<ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Abgeschlossene Termine"
                value={stats.completedSessions}
                linkText="Historie anzeigen"
                linkHref="/patient/history"
              />
              <StatCard
                icon={<DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />}
                title="Rezepte"
                value={stats.prescriptions}
                linkText="Alle anzeigen"
                linkHref="/patient/prescriptions"
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Mein Fortschritt
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <ProgressCard 
                title={progress.course1.title}
                progress={progress.course1.progress}
                total={progress.course1.total}
              />
              <ProgressCard 
                title={progress.course2.title}
                progress={progress.course2.progress}
                total={progress.course2.total}
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Schnellzugriff
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/patient/calendar" className="block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <CalendarDaysIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Mein Kalender
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/patient/exercises" className="block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Meine Übungen
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/patient/chat" className="block">
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
              Anstehende Termine
            </h2>
            {activities.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    date={activity.date}
                    title={activity.title}
                    description={`Trainer: ${activity.trainers?.full_name || 'Unbekannt'}`}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                Keine anstehenden Termine gefunden.
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/patient/calendar" className="text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                Alle Termine anzeigen →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
