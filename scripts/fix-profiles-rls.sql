-- Bestehende RLS-Richtlinien löschen
DROP POLICY IF EXISTS "Therapeuten können alle Patientenprofile sehen" ON public.profiles;

-- Neue, korrigierte RLS-Richtlinie erstellen
CREATE POLICY "Therapeuten können alle Patientenprofile sehen"
  ON public.profiles
  FOR SELECT
  USING (
    -- Verwende eine andere Methode, um die Rolle zu überprüfen, ohne Rekursion zu verursachen
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'therapist')
    )
    AND role = 'patient'
  );

-- Alternativ können wir eine einfachere Richtlinie erstellen, die allen authentifizierten Benutzern
-- mit bestimmten Rollen erlaubt, alle Profile zu sehen
CREATE POLICY "Administratoren können alle Profile sehen"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
