-- Create enum for prescription status
CREATE TYPE prescription_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'therapist', 'patient');

-- Create table for user profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'patient',
  phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  notes TEXT
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create table for courses (Rehasport groups)
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 15,
  therapist_id UUID REFERENCES profiles(id),
  location TEXT,
  recurring BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  weekday INTEGER, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL -- in minutes
);

-- Enable RLS for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create table for course sessions (individual meetings)
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  notes TEXT,
  cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT
);

-- Enable RLS for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create table for prescriptions
CREATE TABLE prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  patient_id UUID REFERENCES profiles(id),
  diagnosis TEXT NOT NULL,
  prescribed_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status prescription_status DEFAULT 'pending',
  insurance_provider TEXT,
  insurance_number TEXT,
  doctor_name TEXT,
  prescription_date DATE,
  notes TEXT
);

-- Enable RLS for prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create table for course participants
CREATE TABLE course_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id),
  prescription_id UUID REFERENCES prescriptions(id),
  joined_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  notes TEXT
);

-- Enable RLS for course participants
ALTER TABLE course_participants ENABLE ROW LEVEL SECURITY;

-- Create table for attendance
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'present', -- 'present', 'absent', 'excused'
  notes TEXT
);

-- Enable RLS for attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Therapists can view all courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'therapist' OR profiles.role = 'admin')
    )
  );

CREATE POLICY "Patients can view their courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_participants
      WHERE course_participants.course_id = id
      AND course_participants.patient_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage their courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'therapist' OR profiles.role = 'admin')
    )
  );

-- Create functions
CREATE OR REPLACE FUNCTION decrease_remaining_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prescriptions
  SET remaining_sessions = remaining_sessions - 1
  WHERE id = (
    SELECT prescription_id
    FROM course_participants
    WHERE patient_id = NEW.patient_id
    AND course_id = (
      SELECT course_id
      FROM sessions
      WHERE id = NEW.session_id
    )
  )
  AND remaining_sessions > 0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating remaining sessions
CREATE TRIGGER update_remaining_sessions
  AFTER INSERT ON attendance
  FOR EACH ROW
  WHEN (NEW.status = 'present')
  EXECUTE FUNCTION decrease_remaining_sessions();

-- Create indexes for better performance
CREATE INDEX idx_course_participants_course_id ON course_participants(course_id);
CREATE INDEX idx_course_participants_patient_id ON course_participants(patient_id);
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_patient_id ON attendance(patient_id);
CREATE INDEX idx_sessions_course_id ON sessions(course_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
