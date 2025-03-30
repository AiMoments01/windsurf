-- Alle bestehenden RLS-Richtlinien für die profiles-Tabelle löschen
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Profile sehen" ON public.profiles;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Profile aktualisieren" ON public.profiles;
DROP POLICY IF EXISTS "Therapeuten können alle Patientenprofile sehen" ON public.profiles;
DROP POLICY IF EXISTS "Administratoren können alle Profile sehen" ON public.profiles;
DROP POLICY IF EXISTS "Admin sieht alle Profile" ON public.profiles;
DROP POLICY IF EXISTS "Alle authentifizierten Benutzer sehen alle Profile" ON public.profiles;
DROP POLICY IF EXISTS "Eigenes Profil sehen" ON public.profiles;
DROP POLICY IF EXISTS "Eigenes Profil aktualisieren" ON public.profiles;

-- Temporär RLS deaktivieren, um sicherzustellen, dass keine Richtlinien mehr aktiv sind
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- RLS wieder aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Einfache Richtlinien ohne Zugriff auf auth.users
-- 1. Jeder authentifizierte Benutzer kann sein eigenes Profil sehen
CREATE POLICY "Eigenes Profil sehen"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Jeder authentifizierte Benutzer kann sein eigenes Profil aktualisieren
CREATE POLICY "Eigenes Profil aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Jeder authentifizierte Benutzer kann ein neues Profil erstellen
CREATE POLICY "Profil erstellen"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);

-- 4. Temporäre Lösung: Alle authentifizierten Benutzer können alle Profile sehen
-- Diese Richtlinie ist einfach und verursacht keine Rekursion
CREATE POLICY "Alle Profile sehen"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
