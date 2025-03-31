'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Aktuellen Benutzer abrufen
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      // Profildaten abrufen
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
      }
    } catch (error: any) {
      console.error('Fehler beim Laden des Profils:', error.message);
      setError('Profildaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!profile?.id) {
        throw new Error('Benutzer-ID nicht gefunden');
      }

      console.log('Versuche Profil zu aktualisieren:', {
        id: profile.id,
        ...formData
      });

      // Verwende die Supabase-API mit mehr Debugging
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select();

      if (error) {
        console.error('Supabase Fehler beim Aktualisieren:', error);
        throw error;
      }

      console.log('Profil erfolgreich aktualisiert:', data);
      setSuccessMessage('Profil erfolgreich aktualisiert');
      
      // Profil neu laden, um die Änderungen anzuzeigen
      fetchProfile();
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Profils:', error.message);
      setError(`Profil konnte nicht aktualisiert werden. Fehler: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-4 flex items-center justify-center">
        <div className="text-center text-gray-700 dark:text-gray-300">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-8">
          Mein Profil
        </h1>

        {error && (
          <div className="rounded-md bg-error-light/10 dark:bg-error-dark/20 p-3 sm:p-4 mb-4">
            <div className="flex">
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-error dark:text-error-light">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 mb-4">
            <div className="flex">
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-400">{successMessage}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-dark-card shadow overflow-hidden sm:rounded-lg mb-4 sm:mb-6">
          <div className="px-3 py-4 sm:px-6 sm:py-5">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Kontoinformationen
            </h3>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Details zu Ihrem Konto
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-dark-border px-3 py-4 sm:p-0">
            <dl className="divide-y divide-gray-200 dark:divide-dark-border sm:divide-y sm:divide-gray-200 dark:sm:divide-dark-border">
              <div className="py-3 sm:py-5 px-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">E-Mail</dt>
                <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {profile?.email}
                </dd>
              </div>
              <div className="py-3 sm:py-5 px-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Rolle</dt>
                <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {profile?.role === 'admin' ? 'Administrator' : 
                   profile?.role === 'instructor' ? 'Kursleiter' : 
                   profile?.role === 'patient' ? 'Patient' : 'Benutzer'}
                </dd>
              </div>
              <div className="py-3 sm:py-5 px-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Konto erstellt</dt>
                <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white dark:bg-dark-card shadow sm:rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Profil bearbeiten
          </h3>
          
          <div>
            <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-xs sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-xs sm:text-sm dark:bg-dark-input dark:border-dark-border dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
