'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Korrekter Import für App Router
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Prescription {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  patient_name: string;
  diagnosis: string;
  prescribed_sessions: number;
  remaining_sessions: number | null;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  insurance_provider: string | null;
  insurance_number: string | null;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Ausstehend';
    case 'approved':
      return 'Genehmigt';
    case 'completed':
      return 'Abgeschlossen';
    case 'cancelled':
      return 'Abgesagt';
    default:
      return status;
  }
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Versuche, Verschreibungen aus der Datenbank zu laden
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('Fehler beim Laden der Verschreibungen:', prescriptionsError);
        throw prescriptionsError;
      }

      // Wenn keine Daten vorhanden sind, verwende Beispieldaten
      if (!prescriptionsData || prescriptionsData.length === 0) {
        console.log('Keine Verschreibungen in der Datenbank gefunden, verwende Beispieldaten');
        const mockPrescriptions = getMockPrescriptions();
        
        // Speichere die Beispieldaten in der Datenbank
        console.log('Speichere Beispieldaten in der Datenbank...');
        for (const prescription of mockPrescriptions) {
          const { error } = await supabase
            .from('prescriptions')
            .insert([
              {
                id: prescription.id,
                patient_id: prescription.patient_id,
                diagnosis: prescription.diagnosis,
                prescribed_sessions: prescription.prescribed_sessions,
                remaining_sessions: prescription.remaining_sessions,
                start_date: prescription.start_date,
                end_date: prescription.end_date,
                status: prescription.status,
                insurance_provider: prescription.insurance_provider,
                insurance_number: prescription.insurance_number
              }
            ]);
          
          if (error) {
            console.error('Fehler beim Speichern der Beispieldaten:', error);
          }
        }
        
        // Lade die Verschreibungen erneut
        const { data: refreshedData } = await supabase
          .from('prescriptions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (refreshedData && refreshedData.length > 0) {
          setPrescriptions(await addPatientNames(refreshedData));
        } else {
          setPrescriptions(mockPrescriptions);
        }
      } else {
        // Daten gefunden, füge Patientennamen hinzu
        setPrescriptions(await addPatientNames(prescriptionsData));
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Verschreibungen:', error.message);
      setError('Fehler beim Laden der Verschreibungen');
      setPrescriptions(getMockPrescriptions());
    } finally {
      setLoading(false);
    }
  };

  const getMockPrescriptions = (): Prescription[] => {
    return [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_id: '1f419f7a-d4b2-4b11-8ab6-d2b7318b3111',
        patient_name: 'Max Mustermann',
        diagnosis: 'Rückenschmerzen',
        prescribed_sessions: 10,
        remaining_sessions: 8,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        status: 'pending',
        insurance_provider: 'AOK',
        insurance_number: '123456789'
      },
      {
        id: '6d85d827-e0db-4c73-a33d-cd8157824b52',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_id: '2a7f9ce5-a2b3-4ef8-91e2-12a3b4c56789',
        patient_name: 'Anna Schmidt',
        diagnosis: 'Knieschmerzen',
        prescribed_sessions: 12,
        remaining_sessions: 6,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        status: 'approved',
        insurance_provider: 'TK',
        insurance_number: '987654321'
      },
      {
        id: 'c9b5a682-1f2d-4f7b-a8b9-c1d2e3f4a5b6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_id: '3b8f7d2e-9c6a-5b4d-8e7f-1a2b3c4d5e6f',
        patient_name: 'Erika Musterfrau',
        diagnosis: 'Schulterschmerzen',
        prescribed_sessions: 8,
        remaining_sessions: 0,
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        status: 'completed',
        insurance_provider: 'Barmer',
        insurance_number: '456789123'
      }
    ];
  };

  const addPatientNames = async (prescriptionsData: any[]) => {
    // Wenn Verschreibungen gefunden wurden, holen wir die Patientendaten separat
    if (prescriptionsData && prescriptionsData.length > 0) {
      // Sammle alle Patienten-IDs
      const patientIds = prescriptionsData.map(p => p.patient_id);
      
      // Hole Patientendaten
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);
          
      if (patientsError) {
        console.error('Fehler beim Laden der Patientendaten:', patientsError.message);
      }
        
      // Erstelle eine Map von Patienten-IDs zu Namen
      const patientMap = new Map();
      if (patientsData) {
        patientsData.forEach(patient => {
          patientMap.set(patient.id, patient.full_name);
        });
      }
        
      // Füge Patientennamen zu Verschreibungen hinzu
      const formattedPrescriptions = prescriptionsData.map(prescription => ({
        ...prescription,
        patient_name: patientMap.get(prescription.patient_id) || 'Unbekannt'
      }));
        
      return formattedPrescriptions;
    } else {
      return [];
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Verschreibung löschen möchten?')) {
      return;
    }

    try {
      console.log('Versuche Verschreibung zu löschen mit ID:', id);
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Fehler beim Löschen:', error);
        throw error;
      }

      console.log('Verschreibung erfolgreich gelöscht');
      setPrescriptions(prescriptions.filter(prescription => prescription.id !== id));
    } catch (error: any) {
      console.error('Fehler beim Löschen der Verschreibung:', error.message);
      alert('Fehler beim Löschen der Verschreibung: ' + error.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      setPrescriptions(prescriptions.map(prescription => 
        prescription.id === id 
          ? { ...prescription, status: 'approved' } 
          : prescription
      ));
    } catch (error: any) {
      console.error('Fehler beim Genehmigen der Verschreibung:', error.message);
      alert('Fehler beim Genehmigen der Verschreibung');
    }
  };

  const handleEdit = (id: string) => {
    console.log('Bearbeite Verschreibung mit ID:', id);
    router.push(`/prescriptions/${id}`);
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      ((prescription.patient_name || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
      ((prescription.diagnosis || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
      ((prescription.insurance_provider || '').toLowerCase()).includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verschreibungen</h1>
          <Link
            href="/prescriptions/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Neue Verschreibung
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-error-light/10 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error">{error}</h3>
                <div className="mt-2 text-sm text-error-dark">
                  <p>Fehler beim Laden der Verschreibungen. Bitte versuchen Sie es später erneut.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 sm:flex sm:items-center sm:gap-4">
          <input
            type="text"
            placeholder="Suche nach Patient, Diagnose oder Versicherung..."
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
            <option value="pending">Ausstehend</option>
            <option value="approved">Genehmigt</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Abgesagt</option>
          </select>
        </div>

        <div className="bg-white dark:bg-dark-card shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-800/50 sm:rounded-xl">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                  Patient
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 lg:table-cell">
                  Diagnose
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:table-cell">
                  Sitzungen
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 lg:table-cell">
                  Gültigkeitszeitraum
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Status
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    Lade Verschreibungen...
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    Keine Verschreibungen gefunden
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900 dark:text-gray-200">{prescription.patient_name}</div>
                      <div className="mt-1 truncate text-gray-500 dark:text-gray-400 sm:hidden">
                        {prescription.diagnosis}
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 lg:table-cell">
                      {prescription.diagnosis}
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                      <div>
                        {prescription.remaining_sessions !== null 
                          ? `${prescription.remaining_sessions}/${prescription.prescribed_sessions}`
                          : `${prescription.prescribed_sessions}`}
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 lg:table-cell">
                      <div>{formatDate(prescription.start_date)}</div>
                      <div className="text-gray-400 dark:text-gray-500">bis</div>
                      <div>{formatDate(prescription.end_date)}</div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                          prescription.status
                        )}`}
                      >
                        {getStatusText(prescription.status)}
                      </span>
                    </td>
                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-2">
                        {prescription.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(prescription.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400"
                            title="Genehmigen"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="sr-only">Genehmigen</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(prescription.id)}
                          className="text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300"
                          title="Bearbeiten"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => handleDelete(prescription.id)}
                          className="text-error hover:text-error-dark dark:text-red-400 dark:hover:text-red-300"
                          title="Löschen"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="sr-only">Löschen</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
