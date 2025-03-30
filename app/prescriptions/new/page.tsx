'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  full_name: string;
}

interface PrescriptionFormData {
  patient_id: string;
  diagnosis: string;
  prescribed_sessions: number;
  start_date: string;
  end_date: string;
  insurance_provider: string;
  insurance_number: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
}

const initialFormData: PrescriptionFormData = {
  patient_id: '',
  diagnosis: '',
  prescribed_sessions: 10,
  start_date: '',
  end_date: '',
  insurance_provider: '',
  insurance_number: '',
  status: 'pending',
};

// Hilfsfunktion zum Formatieren von Datumswerten für Eingabefelder
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  // Konvertiere ISO-Datum zu YYYY-MM-DD Format für input[type="date"]
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PrescriptionFormData>(initialFormData);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setze Standarddaten für Start- und Enddatum
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    setFormData(prev => ({
      ...prev,
      start_date: formatDateForInput(today.toISOString()),
      end_date: formatDateForInput(threeMonthsLater.toISOString()),
    }));
    
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'patient')
        .order('full_name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPatients(data);
      } else {
        // Beispieldaten für die Entwicklung
        setPatients([
          { id: '1f419f7a-d4b2-4b11-8ab6-d2b7318b3111', full_name: 'Max Mustermann' },
          { id: '2a7f9ce5-a2b3-4ef8-91e2-12a3b4c56789', full_name: 'Anna Schmidt' },
          { id: '3b8f7d2e-9c6a-5b4d-8e7f-1a2b3c4d5e6f', full_name: 'Erika Musterfrau' },
        ]);
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Patienten:', error.message);
      setError('Patienten konnten nicht geladen werden.');
      
      // Beispieldaten im Fehlerfall
      setPatients([
        { id: '1f419f7a-d4b2-4b11-8ab6-d2b7318b3111', full_name: 'Max Mustermann' },
        { id: '2a7f9ce5-a2b3-4ef8-91e2-12a3b4c56789', full_name: 'Anna Schmidt' },
        { id: '3b8f7d2e-9c6a-5b4d-8e7f-1a2b3c4d5e6f', full_name: 'Erika Musterfrau' },
      ]);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validierung
      if (!formData.patient_id) {
        throw new Error('Bitte wählen Sie einen Patienten aus.');
      }
      
      if (!formData.diagnosis) {
        throw new Error('Bitte geben Sie eine Diagnose ein.');
      }

      const { error } = await supabase.from('prescriptions').insert([
        {
          ...formData,
          remaining_sessions: formData.prescribed_sessions,
        },
      ]);

      if (error) throw error;

      router.push('/prescriptions');
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Verschreibung:', error.message);
      setError(error.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8">
          Neue Verschreibung
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

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-dark-card shadow sm:rounded-lg p-6">
          <div>
            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Patient
            </label>
            <select
              id="patient_id"
              name="patient_id"
              required
              value={formData.patient_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
            >
              <option value="">-- Patient auswählen --</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Diagnose
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              rows={3}
              required
              value={formData.diagnosis}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="prescribed_sessions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Anzahl der Sitzungen
              </label>
              <input
                type="number"
                id="prescribed_sessions"
                name="prescribed_sessions"
                min="1"
                required
                value={formData.prescribed_sessions}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              >
                <option value="pending">Ausstehend</option>
                <option value="approved">Genehmigt</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgesagt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Startdatum
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                value={formatDateForInput(formData.start_date)}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enddatum
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                value={formatDateForInput(formData.end_date)}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="insurance_provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Krankenkasse
              </label>
              <input
                type="text"
                id="insurance_provider"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="insurance_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Versicherungsnummer
              </label>
              <input
                type="text"
                id="insurance_number"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/prescriptions')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-dark-card dark:text-gray-300 dark:border-dark-border dark:hover:bg-dark-hover"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
