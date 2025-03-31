'use client';

import { getSupabaseClient } from '@/lib/supabase';
import { useState, createContext, useContext } from 'react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Definiere den Typ für den Supabase-Client
type SupabaseContextType = SupabaseClient<Database>;

// Erstelle einen Kontext für den Supabase-Client
export const SupabaseContext = createContext<SupabaseContextType | null>(null);

// Hook zur Verwendung des Supabase-Clients
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Verwenden des Singleton-Clients
  const supabaseClient = getSupabaseClient();

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}
