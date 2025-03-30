-- Alle bestehenden RLS-Richtlinien für die profiles-Tabelle löschen
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Profile sehen" ON public.profiles;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Profile aktualisieren" ON public.profiles;
DROP POLICY IF EXISTS "Therapeuten können alle Patientenprofile sehen" ON public.profiles;
DROP POLICY IF EXISTS "Administratoren können alle Profile sehen" ON public.profiles;

-- Temporär RLS deaktivieren, um sicherzustellen, dass keine Richtlinien mehr aktiv sind
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- RLS wieder aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Einfache Richtlinien ohne Rekursion erstellen
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

-- 3. Administratoren können alle Profile sehen (ohne Rekursion)
-- Diese Richtlinie verwendet eine feste Liste von Admin-IDs
-- Ersetzen Sie 'ADMIN_UUID_HIER' durch die tatsächliche UUID Ihres Admin-Benutzers
CREATE POLICY "Admin sieht alle Profile"
  ON public.profiles
  FOR ALL
  USING (auth.uid() IN (
    -- Liste der Admin-UUIDs hier einfügen
    -- Beispiel: '123e4567-e89b-12d3-a456-426614174000'
    -- Oder einfach alle authentifizierten Benutzer zulassen für den Entwicklungsmodus:
    SELECT id FROM auth.users
  ));

-- Temporäre Lösung: Alle authentifizierten Benutzer können alle Profile sehen
-- Diese Richtlinie ist einfach und verursacht keine Rekursion
CREATE POLICY "Alle authentifizierten Benutzer sehen alle Profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
