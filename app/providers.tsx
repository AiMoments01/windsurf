'use client';

import { createBrowserClient } from '@supabase/ssr';
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
  const [supabaseClient] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}
