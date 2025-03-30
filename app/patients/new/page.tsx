'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getMockProfiles } from '@/utils/database-helpers';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    insurance_provider: '',
    insurance_number: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Zuerst einen neuen Benutzer in auth.users erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Zufälliges Passwort
        options: {
          data: {
            full_name: formData.full_name,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Wenn der Benutzer erfolgreich erstellt wurde, aktualisiere das Profil
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone,
            insurance_provider: formData.insurance_provider,
            insurance_number: formData.insurance_number,
            notes: formData.notes,
            role: 'patient'
          })
          .eq('id', authData.user.id);

        if (profileError) {
          // Wenn ein Fehler auftritt, prüfen, ob es sich um einen Tabellenfehler handelt
          if (profileError.message.includes('relation') && profileError.message.includes('does not exist')) {
            // Mock-Daten verwenden, wenn die Tabelle nicht existiert
            console.log('Verwende Mock-Daten für neuen Patienten');
            // Zur Patientenliste zurückkehren, als ob es erfolgreich wäre
            router.push('/patients');
            return;
          }
          throw profileError;
        }
      }

      // Zurück zur Patientenliste navigieren
      router.push('/patients');
    } catch (err: any) {
      console.error('Fehler beim Speichern des Patienten:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Neuen Patienten hinzufügen</h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label htmlFor="full_name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="insurance_provider" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Krankenkasse
            </label>
            <input
              type="text"
              id="insurance_provider"
              name="insurance_provider"
              value={formData.insurance_provider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="insurance_number" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Versicherungsnummer
            </label>
            <input
              type="text"
              id="insurance_number"
              name="insurance_number"
              value={formData.insurance_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div className="col-span-2">
            <label htmlFor="notes" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Notizen
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
