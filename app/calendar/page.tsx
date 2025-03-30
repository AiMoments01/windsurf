'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { supabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  current_participants: number;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    location: string;
    participants: string;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCourses();
  }, []);

  const createDemoEvents = () => {
    console.log("Erstelle Demo-Kurse für den Kalender...");
    // Demo-Kurse für die nächsten 7 Tage erstellen
    const demoEvents: CalendarEvent[] = [];
    
    const today = new Date();
    
    // Erstelle 5 Demo-Kurse für die nächsten Tage
    for (let i = 0; i < 5; i++) {
      const courseDate = new Date(today);
      courseDate.setDate(today.getDate() + i);
      
      // Morgen-Kurs
      const morningCourse = {
        id: `demo-morning-${i}`,
        title: `Rehasport Rücken ${i+1}`,
        start: `${courseDate.toISOString().split('T')[0]}T09:00:00`,
        end: `${courseDate.toISOString().split('T')[0]}T10:00:00`,
        extendedProps: {
          location: 'Therapiezentrum Nord',
          participants: `${Math.floor(Math.random() * 5) + 3}/10`
        }
      };
      
      // Nachmittag-Kurs
      const afternoonCourse = {
        id: `demo-afternoon-${i}`,
        title: `Rehasport Gelenke ${i+1}`,
        start: `${courseDate.toISOString().split('T')[0]}T14:30:00`,
        end: `${courseDate.toISOString().split('T')[0]}T15:30:00`,
        extendedProps: {
          location: 'Therapiezentrum Süd',
          participants: `${Math.floor(Math.random() * 5) + 3}/8`
        }
      };
      
      demoEvents.push(morningCourse, afternoonCourse);
    }
    
    return demoEvents;
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log("Versuche Kurse zu laden...");
      
      try {
        // Versuche zuerst die Kurse aus der Datenbank zu laden
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) {
          // Wenn ein Datenbankfehler auftritt (z.B. Tabelle nicht gefunden),
          // verwenden wir Demo-Daten
          console.log("Datenbank-Fehler:", error.message);
          throw new Error("Datenbank nicht verfügbar - zeige Demo-Daten an");
        }

        if (!courses || courses.length === 0) {
          console.log("Keine Kurse gefunden, verwende Demo-Daten");
          setEvents(createDemoEvents());
        } else {
          // Tatsächliche Kurse in Kalender-Events umwandeln
          const formattedEvents = courses.map((course: Course) => ({
            id: course.id,
            title: course.title,
            start: course.start_time,
            end: course.end_time,
            extendedProps: {
              location: course.location,
              participants: `${course.current_participants}/${course.max_participants}`
            }
          }));
          
          setEvents(formattedEvents);
        }
      } catch (dbError) {
        // Bei Datenbankfehler, verwende Demo-Daten
        console.log("Verwende Demo-Daten aufgrund von:", dbError);
        setEvents(createDemoEvents());
      }
    } catch (err: any) {
      console.error("Fehler beim Laden der Kurse:", err);
      // Wir setzen keinen Fehler, sondern zeigen Demo-Daten an
      setEvents(createDemoEvents());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900">Kurskalender</h1>
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-gray-600">Lädt Kurse...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Info: Diese Seite zeigt Demo-Daten an. {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[deLocale]}
              locale="de"
              events={events}
              height="auto"
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              eventClick={(info) => {
                const { extendedProps } = info.event;
                alert(`
                  Kurs: ${info.event.title}
                  Ort: ${extendedProps.location}
                  Teilnehmer: ${extendedProps.participants}
                  Datum: ${new Date(info.event.start!).toLocaleDateString('de-DE')}
                  Uhrzeit: ${new Date(info.event.start!).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${new Date(info.event.end!).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                `);
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              buttonText={{
                today: 'Heute',
                month: 'Monat',
                week: 'Woche',
                day: 'Tag'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
