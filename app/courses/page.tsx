'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PlusIcon, PencilSquareIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  location: string;
  instructor_id: string;
  instructor_name: string;
  status: 'active' | 'completed' | 'cancelled';
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name)
        `)
        .order('start_date', { ascending: true });

      if (coursesError) throw coursesError;

      const formattedCourses = coursesData.map(course => ({
        ...course,
        instructor_name: course.instructor?.full_name || 'Nicht zugewiesen'
      }));

      setCourses(formattedCourses);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Kurs löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCourses(courses.filter(course => course.id !== id));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Abgesagt';
      default:
        return status;
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.instructor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kurse</h1>
          <p className="mt-2 text-sm text-gray-700">
            Verwalten Sie Ihre Rehasport-Kurse und Teilnehmer
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/courses/new"
            className="inline-flex items-center justify-center btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Neuer Kurs
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-error-light/10 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 sm:flex sm:items-center sm:gap-4">
        <input
          type="text"
          placeholder="Suche nach Namen, Beschreibung oder Ort..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full sm:w-96 mb-2 sm:mb-0"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select w-full sm:w-48"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="completed">Abgeschlossen</option>
          <option value="cancelled">Abgesagt</option>
        </select>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Kurs
              </th>
              <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                Zeitraum
              </th>
              <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                Ort
              </th>
              <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                Therapeut
              </th>
              <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                Teilnehmer
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="font-medium text-gray-900">{course.name}</div>
                  <div className="mt-1 truncate text-gray-500 sm:hidden">
                    {course.description}
                  </div>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">
                  <div>{formatDate(course.start_date)}</div>
                  <div className="text-gray-400">bis</div>
                  <div>{formatDate(course.end_date)}</div>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">
                  {course.location}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">
                  {course.instructor_name}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>
                      {course.current_participants}/{course.max_participants}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                      course.status
                    )}`}
                  >
                    {getStatusText(course.status)}
                  </span>
                </td>
                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                      <span className="sr-only">Bearbeiten</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-error hover:text-error-dark"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Löschen</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCourses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-4 text-sm text-gray-500 text-center"
                >
                  Keine Kurse gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
