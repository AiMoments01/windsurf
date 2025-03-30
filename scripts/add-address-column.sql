-- Skript zum Hinzufügen der address-Spalte zur profiles-Tabelle

-- Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Schema-Cache aktualisieren
SELECT * FROM public.profiles LIMIT 1;
