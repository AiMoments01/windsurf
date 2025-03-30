-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    role_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    PRIMARY KEY (id)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Add foreign key to profiles
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_roles 
    FOREIGN KEY (role_id) 
    REFERENCES roles(id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    instructor_id UUID REFERENCES profiles(id)
);

-- Create course_participants table
CREATE TABLE IF NOT EXISTS course_participants (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (course_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name) VALUES 
    ('admin'),
    ('trainer'),
    ('user')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Course policies
CREATE POLICY "Courses are viewable by everyone"
    ON courses FOR SELECT
    USING (true);

CREATE POLICY "Trainers can create courses"
    ON courses FOR INSERT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'trainer'))
    ));

-- Course participants policies
CREATE POLICY "Users can view course participants"
    ON course_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can join courses"
    ON course_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Users can view messages in their courses"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_participants
            WHERE course_id = messages.course_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their courses"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM course_participants
            WHERE course_id = messages.course_id
            AND user_id = auth.uid()
        )
    );
