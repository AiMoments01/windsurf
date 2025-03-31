'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserPlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getMockProfiles, safeQueryTable } from '@/utils/database-helpers';

interface Patient {
  id: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      // Verwenden der sicheren Abfragemethode mit Fallback zu Mock-Daten
      const { data, error } = await safeQueryTable<Patient[]>(
        supabase, 
        'profiles',
        (query) => query
          .select('*')
          .eq('role', 'patient')
          .order('full_name'),
        // Fallback zu Mock-Daten, wenn die Tabelle nicht existiert
        getMockProfiles(10).filter(p => p.role === 'patient')
      );

      if (error) throw error;
      
      if (data) {
        setPatients(data);
        // Wenn wir Mock-Daten verwenden, dies im State vermerken
        setIsUsingMockData(!!(data.length > 0 && data[0].id.startsWith('mock-')));
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Fehler beim Laden der Patienten:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isUsingMockData) {
      // Bei Mock-Daten nur im lokalen State löschen
      setPatients(patients.filter(patient => patient.id !== id));
      return;
    }

    if (!confirm('Sind Sie sicher, dass Sie diesen Patienten löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPatients(patients.filter(patient => patient.id !== id));
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Filtern der Patienten basierend auf dem Suchbegriff
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (patient.full_name && patient.full_name.toLowerCase().includes(searchLower)) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
      (patient.insurance_provider && patient.insurance_provider.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="py-4 sm:py-6">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-4 gap-3 xs:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Patienten</h1>
        <Link
          href="/patients/new"
          className="bg-primary hover:bg-primary-dark text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-md inline-flex items-center text-sm sm:text-base whitespace-nowrap"
        >
          <UserPlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          Neuer Patient
        </Link>
      </div>

      {isUsingMockData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 sm:p-4 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div className="flex">
            <div className="ml-2 sm:ml-3">
              <p className="text-yellow-700 dark:text-yellow-200">
                Die Patiententabelle existiert noch nicht in Ihrer Datenbank. Momentan werden Beispieldaten angezeigt.
                In einer Produktionsumgebung sollten Sie die Tabelle erstellen.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 sm:p-4 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div className="flex">
            <div className="ml-2 sm:ml-3">
              <p className="text-red-700 dark:text-red-200">
                Fehler: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 sm:mb-4">
        <input
          type="text"
          placeholder="Suchen nach Name, E-Mail oder Krankenkasse..."
          className="form-input text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Lädt Patienten...</p>
      ) : (
        <div className="bg-white dark:bg-dark-card shadow overflow-hidden sm:rounded-md">
          {filteredPatients.length === 0 ? (
            <p className="p-3 sm:p-4 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Keine Patienten gefunden.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPatients.map((patient) => (
                <li key={patient.id}>
                  <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center">
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex text-xs sm:text-sm">
                          <p className="font-medium text-primary dark:text-blue-400 truncate">{patient.full_name || 'Kein Name'}</p>
                        </div>
                        <div className="mt-1 sm:mt-2 flex">
                          <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            <span className="truncate">{patient.email || 'Keine E-Mail'}</span>
                          </div>
                        </div>
                        {patient.insurance_provider && (
                          <div className="mt-1 flex flex-col xs:flex-row">
                            <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              <span>Krankenkasse: {patient.insurance_provider}</span>
                              {patient.insurance_number && (
                                <span className="xs:ml-2">| VersNr: {patient.insurance_number}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex-shrink-0 sm:mt-0 sm:ml-5">
                        <div className="flex space-x-4">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
                          >
                            <PencilSquareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
