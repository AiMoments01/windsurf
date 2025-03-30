-- Erstellen der profiles-Tabelle
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'therapist', 'patient')) DEFAULT 'patient',
  phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  notes TEXT
);

-- Erstellen einer Funktion zur Aktualisierung des updated_at-Zeitstempels
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für die profiles-Tabelle
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Funktion zum automatischen Erstellen eines Profils bei Benutzerregistrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für die auth.users-Tabelle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS-Richtlinien
CREATE POLICY "Benutzer können ihre eigenen Profile sehen"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY "Benutzer können ihre eigenen Profile aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Therapeuten können alle Patientenprofile sehen"
  ON public.profiles
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
    AND role = 'patient'
  );

-- Bestehende Benutzer in die profiles-Tabelle einfügen
INSERT INTO public.profiles (id, email)
SELECT id, email 
FROM auth.users
ON CONFLICT (id) DO NOTHING;
