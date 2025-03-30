-- Erstellen der courses-Tabelle
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 10,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  status TEXT CHECK (status IN ('geplant', 'aktiv', 'abgeschlossen')) DEFAULT 'geplant'
);

-- Trigger für die courses-Tabelle
DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security aktivieren
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS-Richtlinien
CREATE POLICY "Jeder kann Kurse sehen"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Therapeuten können Kurse erstellen und verwalten"
  ON public.courses
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );

-- Erstellen der course_participants-Tabelle (Verknüpfungstabelle)
CREATE TABLE IF NOT EXISTS public.course_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('angemeldet', 'bestätigt', 'abgeschlossen', 'abgesagt')) DEFAULT 'angemeldet',
  UNIQUE (course_id, participant_id)
);

-- Row Level Security für course_participants aktivieren
ALTER TABLE public.course_participants ENABLE ROW LEVEL SECURITY;

-- RLS-Richtlinien für course_participants
CREATE POLICY "Benutzer können ihre eigenen Kursanmeldungen sehen"
  ON public.course_participants
  FOR SELECT
  USING (auth.uid() = participant_id);

CREATE POLICY "Therapeuten können alle Kursanmeldungen sehen"
  ON public.course_participants
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );

CREATE POLICY "Therapeuten können Kursanmeldungen verwalten"
  ON public.course_participants
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );

-- Beispiel-Kurse einfügen (optional)
INSERT INTO public.courses (title, description, max_participants, start_date, end_date, location, status)
VALUES 
  ('Einführung in Windsurf', 'Grundlagen des Windsurfens für Anfänger', 8, now() + interval '1 week', now() + interval '1 week' + interval '2 hours', 'Strandpromenade', 'geplant'),
  ('Fortgeschrittenes Windsurfen', 'Techniken für Fortgeschrittene', 6, now() + interval '2 weeks', now() + interval '2 weeks' + interval '3 hours', 'Nordsee', 'geplant'),
  ('Therapie im Wasser', 'Rehabilitationsübungen im Wasser', 4, now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'Therapiebecken', 'geplant')
ON CONFLICT DO NOTHING;
