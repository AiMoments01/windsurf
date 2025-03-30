'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PatientFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  insurance_provider: string;
  insurance_number: string;
  notes: string;
}

const initialFormData: PatientFormData = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  insurance_provider: '',
  insurance_number: '',
  notes: '',
};

export default function PatientForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchPatient();
    }
  }, [params.id]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          insurance_provider: data.insurance_provider || '',
          insurance_number: data.insurance_number || '',
          notes: data.notes || '',
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
        const { error } = await supabase.from('profiles').insert([
          {
            ...formData,
            role: 'patient',
          },
        ]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', params.id);
        if (error) throw error;
      }

      router.push('/patients');
    } catch (error: any) {
      setError(error.message);
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          {isNew ? 'Neuer Patient' : 'Patient bearbeiten'}
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="form-label">
                Geburtsdatum
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                required
                value={formData.date_of_birth}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="insurance_provider" className="form-label">
                Krankenkasse
              </label>
              <input
                type="text"
                id="insurance_provider"
                name="insurance_provider"
                required
                value={formData.insurance_provider}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="insurance_number" className="form-label">
                Versichertennummer
              </label>
              <input
                type="text"
                id="insurance_number"
                name="insurance_number"
                required
                value={formData.insurance_number}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="form-label">
              Notizen
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/patients')}
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
