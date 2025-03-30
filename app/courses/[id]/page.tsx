'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Instructor {
  id: string;
  full_name: string;
}

interface CourseFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  location: string;
  instructor_id: string;
  status: 'active' | 'completed' | 'cancelled';
  session_day: string;
  session_time: string;
}

const initialFormData: CourseFormData = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  max_participants: 15,
  location: '',
  instructor_id: '',
  status: 'active',
  session_day: 'monday',
  session_time: '09:00',
};

const weekdays = [
  { value: 'monday', label: 'Montag' },
  { value: 'tuesday', label: 'Dienstag' },
  { value: 'wednesday', label: 'Mittwoch' },
  { value: 'thursday', label: 'Donnerstag' },
  { value: 'friday', label: 'Freitag' },
];

// Hilfsfunktion zum Formatieren von Datumswerten für Eingabefelder
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  // Konvertiere ISO-Datum zu YYYY-MM-DD Format für input[type="date"]
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default function CourseForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInstructors();
    if (!isNew) {
      fetchCourse();
    }
  }, [params.id]);

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'therapist');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          start_date: formatDateForInput(data.start_date),
          end_date: formatDateForInput(data.end_date),
          max_participants: data.max_participants || 15,
          location: data.location || '',
          instructor_id: data.instructor_id || '',
          status: data.status || 'active',
          session_day: data.session_day || 'monday',
          session_time: data.session_time || '09:00',
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const { error } = await supabase.from('courses').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', params.id);
        if (error) throw error;
      }

      router.push('/courses');
    } catch (error: any) {
      setError(error.message);
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">
          {isNew ? 'Neuer Kurs' : 'Kurs bearbeiten'}
        </h1>

        {error && (
          <div className="rounded-md bg-error-light/10 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="form-label">
              Kursname
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="form-label">
                Startdatum
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                value={formatDateForInput(formData.start_date)}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="form-label">
                Enddatum
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                value={formatDateForInput(formData.end_date)}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="session_day" className="form-label">
                Kurstag
              </label>
              <select
                id="session_day"
                name="session_day"
                required
                value={formData.session_day}
                onChange={handleChange}
                className="form-select"
              >
                {weekdays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="session_time" className="form-label">
                Uhrzeit
              </label>
              <input
                type="time"
                id="session_time"
                name="session_time"
                required
                value={formData.session_time}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="location" className="form-label">
                Ort
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="max_participants" className="form-label">
                Maximale Teilnehmerzahl
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                required
                min="1"
                max="30"
                value={formData.max_participants}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="instructor_id" className="form-label">
                Therapeut
              </label>
              <select
                id="instructor_id"
                name="instructor_id"
                required
                value={formData.instructor_id}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Bitte wählen</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="active">Aktiv</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgesagt</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/courses')}
              className="btn-secondary"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
