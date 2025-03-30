'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Course {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  difficulty: string;
  current_participants: number;
  max_participants: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    difficulty: 'beginner',
    max_participants: 5,
  });
  const [isTrainer, setIsTrainer] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCourses();
    checkRole();
  }, []);

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data: role } = await supabase
          .from('roles')
          .select('name')
          .eq('id', profile.role_id)
          .single();

        setIsTrainer(role?.name === 'trainer' || role?.name === 'admin');
      }
    }
  }

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

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('courses')
      .insert({
        ...newCourse,
        instructor_id: user.id,
        current_participants: 0,
      });

    if (error) {
      console.error('Error creating course:', error);
      return;
    }

    setNewCourse({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      difficulty: 'beginner',
      max_participants: 5,
    });

    fetchCourses();
  }

  async function handleJoinCourse(courseId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const course = courses.find(c => c.id === courseId);
    if (!course || course.current_participants >= course.max_participants) return;

    const { error: participationError } = await supabase
      .from('course_participants')
      .insert({
        course_id: courseId,
        user_id: user.id,
      });

    if (participationError) {
      console.error('Error joining course:', participationError);
      return;
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update({
        current_participants: course.current_participants + 1,
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating participant count:', updateError);
      return;
    }

    fetchCourses();
  }

  return (
    <div className="space-y-6">
      {isTrainer && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Neuen Kurs erstellen</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Titel</label>
              <input
                type="text"
                value={newCourse.title}
                onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Beschreibung</label>
              <textarea
                value={newCourse.description}
                onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Startzeit</label>
                <input
                  type="datetime-local"
                  value={newCourse.start_time}
                  onChange={e => setNewCourse({ ...newCourse, start_time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Endzeit</label>
                <input
                  type="datetime-local"
                  value={newCourse.end_time}
                  onChange={e => setNewCourse({ ...newCourse, end_time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Ort</label>
              <input
                type="text"
                value={newCourse.location}
                onChange={e => setNewCourse({ ...newCourse, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Schwierigkeit</label>
                <select
                  value={newCourse.difficulty}
                  onChange={e => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="beginner">Anfänger</option>
                  <option value="intermediate">Fortgeschritten</option>
                  <option value="advanced">Experte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Max. Teilnehmer</label>
                <input
                  type="number"
                  value={newCourse.max_participants}
                  onChange={e => setNewCourse({ ...newCourse, max_participants: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  min="1"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
            >
              Kurs erstellen
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Verfügbare Kurse</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
            >
              <h3 className="text-lg font-semibold">{course.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{course.description}</p>
              <div className="mt-2 space-y-1">
                <p>🗓️ {new Date(course.start_time).toLocaleString('de-DE')}</p>
                <p>📍 {course.location}</p>
                <p>🎯 {course.difficulty}</p>
                <p>👥 {course.current_participants}/{course.max_participants} Teilnehmer</p>
              </div>
              <button
                onClick={() => handleJoinCourse(course.id)}
                disabled={course.current_participants >= course.max_participants}
                className="mt-4 w-full bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {course.current_participants >= course.max_participants
                  ? 'Ausgebucht'
                  : 'Teilnehmen'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
