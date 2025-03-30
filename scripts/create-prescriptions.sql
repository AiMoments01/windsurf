-- Erstelle die prescriptions Tabelle
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  prescribed_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  insurance_provider TEXT,
  insurance_number TEXT
);

-- Erstelle einen Trigger, um updated_at automatisch zu aktualisieren
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Füge den Trigger zur prescriptions Tabelle hinzu, falls er noch nicht existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_prescriptions_updated_at' 
    AND tgrelid = 'public.prescriptions'::regclass
  ) THEN
    CREATE TRIGGER set_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Setze Row Level Security (RLS) für die prescriptions Tabelle
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Erstelle RLS-Richtlinien für die prescriptions Tabelle
CREATE POLICY "Authentifizierte Benutzer können ihre eigenen Verschreibungen sehen"
  ON public.prescriptions
  FOR SELECT
  USING (
    auth.uid() = patient_id OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
    ) OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'instructor'
    )
  );

CREATE POLICY "Administratoren können Verschreibungen erstellen"
  ON public.prescriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
    ) OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'instructor'
    )
  );

CREATE POLICY "Administratoren können Verschreibungen aktualisieren"
  ON public.prescriptions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
    ) OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'instructor'
    )
  );

CREATE POLICY "Administratoren können Verschreibungen löschen"
  ON public.prescriptions
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
    )
  );

-- Temporäre Richtlinie für die Entwicklung: Alle authentifizierten Benutzer können alle Verschreibungen sehen
CREATE POLICY "Alle authentifizierten Benutzer können alle Verschreibungen sehen (temporär)"
  ON public.prescriptions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Temporäre Richtlinie für die Entwicklung: Alle authentifizierten Benutzer können Verschreibungen erstellen
CREATE POLICY "Alle authentifizierten Benutzer können Verschreibungen erstellen (temporär)"
  ON public.prescriptions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Temporäre Richtlinie für die Entwicklung: Alle authentifizierten Benutzer können Verschreibungen aktualisieren
CREATE POLICY "Alle authentifizierten Benutzer können Verschreibungen aktualisieren (temporär)"
  ON public.prescriptions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Temporäre Richtlinie für die Entwicklung: Alle authentifizierten Benutzer können Verschreibungen löschen
CREATE POLICY "Alle authentifizierten Benutzer können Verschreibungen löschen (temporär)"
  ON public.prescriptions
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Kommentar: In der Produktionsumgebung sollten die temporären Richtlinien entfernt werden
