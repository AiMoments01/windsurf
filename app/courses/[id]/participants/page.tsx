'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  insurance_provider: string;
}

interface CourseParticipant extends Patient {
  attendance_count: number;
  last_attendance: string | null;
}

interface Course {
  id: string;
  name: string;
  max_participants: number;
  current_participants: number;
}

export default function CourseParticipants({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [participants, setParticipants] = useState<CourseParticipant[]>([]);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourseAndParticipants();
  }, [params.id]);

  const fetchCourseAndParticipants = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch current participants with attendance info
      const { data: participantsData, error: participantsError } = await supabase
        .from('course_participants')
        .select(`
          patient:profiles (
            id,
            full_name,
            email,
            insurance_provider
          ),
          attendance_count,
          last_attendance
        `)
        .eq('course_id', params.id);

      if (participantsError) throw participantsError;

      const formattedParticipants = participantsData.map(p => ({
        ...p.patient,
        attendance_count: p.attendance_count || 0,
        last_attendance: p.last_attendance
      }));

      setParticipants(formattedParticipants);

      // Fetch available patients (not in the course)
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, insurance_provider')
        .eq('role', 'patient')
        .not('id', 'in', formattedParticipants.map(p => p.id));

      if (patientsError) throw patientsError;
      setAvailablePatients(patientsData || []);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (patientId: string) => {
    if (!course) return;
    
    if (course.current_participants >= course.max_participants) {
      setError('Die maximale Teilnehmerzahl ist bereits erreicht.');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_participants')
        .insert([
          {
            course_id: params.id,
            patient_id: patientId,
            attendance_count: 0,
          },
        ]);

      if (error) throw error;

      // Update course participant count
      const { error: updateError } = await supabase
        .from('courses')
        .update({ current_participants: course.current_participants + 1 })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Refresh data
      fetchCourseAndParticipants();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const removeParticipant = async (patientId: string) => {
    if (!course) return;

    if (!confirm('Möchten Sie diesen Teilnehmer wirklich aus dem Kurs entfernen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('course_participants')
        .delete()
        .eq('course_id', params.id)
        .eq('patient_id', patientId);

      if (error) throw error;

      // Update course participant count
      const { error: updateError } = await supabase
        .from('courses')
        .update({ current_participants: course.current_participants - 1 })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Refresh data
      fetchCourseAndParticipants();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const filteredAvailablePatients = availablePatients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center text-error">Kurs nicht gefunden</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{course.name}</h1>
          <p className="mt-2 text-sm text-gray-700">
            Teilnehmer: {course.current_participants} / {course.max_participants}
          </p>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Aktuelle Teilnehmer */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Aktuelle Teilnehmer
            </h2>
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                      Teilnahmen
                    </th>
                    <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                      Letzte Teilnahme
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {participant.full_name}
                        </div>
                        <div className="text-gray-500">{participant.email}</div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                        {participant.attendance_count}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                        {participant.last_attendance
                          ? new Date(participant.last_attendance).toLocaleDateString()
                          : 'Noch keine Teilnahme'}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button
                          onClick={() => removeParticipant(participant.id)}
                          className="text-error hover:text-error-dark"
                        >
                          <UserMinusIcon className="h-5 w-5" />
                          <span className="sr-only">Entfernen</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-sm text-gray-500 text-center"
                      >
                        Keine Teilnehmer im Kurs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verfügbare Patienten */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Verfügbare Patienten
            </h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Patient suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                      Versicherung
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAvailablePatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {patient.full_name}
                        </div>
                        <div className="text-gray-500">{patient.email}</div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                        {patient.insurance_provider}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button
                          onClick={() => addParticipant(patient.id)}
                          className="text-primary hover:text-primary-dark"
                          disabled={course.current_participants >= course.max_participants}
                        >
                          <UserPlusIcon className="h-5 w-5" />
                          <span className="sr-only">Hinzufügen</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAvailablePatients.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-sm text-gray-500 text-center"
                      >
                        Keine verfügbaren Patienten gefunden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
