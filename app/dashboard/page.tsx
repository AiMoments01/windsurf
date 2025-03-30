'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { createBrowserClient } from '@supabase/ssr';
import deLocale from '@fullcalendar/core/locales/de';

interface Course {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  difficulty: string;
  current_participants: number;
  max_participants: number;
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('start_time');

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    setCourses(data || []);
  }

  const events = courses.map(course => ({
    id: course.id,
    title: course.title,
    start: course.start_time,
    end: course.end_time,
    extendedProps: {
      location: course.location,
      difficulty: course.difficulty,
      currentParticipants: course.current_participants,
      maxParticipants: course.max_participants,
    },
  }));

  const handleEventClick = (info: any) => {
    const event = info.event;
    alert(`
      Kurs: ${event.title}
      Ort: ${event.extendedProps.location}
      Schwierigkeit: ${event.extendedProps.difficulty}
      Teilnehmer: ${event.extendedProps.currentParticipants}/${event.extendedProps.maxParticipants}
    `);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        locale={deLocale}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
      />
    </div>
  );
}
