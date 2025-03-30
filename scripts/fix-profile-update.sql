-- Skript zur Korrektur der RLS-Richtlinien für die Profilaktualisierung

-- Bestehende RLS-Richtlinien für UPDATE löschen
DROP POLICY IF EXISTS "Benutzer können ihr eigenes Profil aktualisieren" ON public.profiles;

-- Neue RLS-Richtlinie für UPDATE erstellen
CREATE POLICY "Benutzer können ihr eigenes Profil aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Administratoren können alle Profile aktualisieren
CREATE POLICY "Administratoren können alle Profile aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Therapeuten können Patientenprofile aktualisieren
CREATE POLICY "Therapeuten können Patientenprofile aktualisieren"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'therapist'
    )
    AND role = 'patient'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'therapist'
    )
    AND role = 'patient'
  );
