-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE resource_type AS ENUM (
  'textbook',
  'past_exam',
  'solution',
  'lecture_slide',
  'presentation',
  'assignment'
);
CREATE TYPE semester_term AS ENUM ('Spring', 'Fall', 'Summer', 'Winter');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, course_code)
);

-- Professors table
CREATE TABLE public.professors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semesters table
CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  term semester_term NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, term)
);

-- Resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type resource_type NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table (optional advanced filtering)
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource tags junction table
CREATE TABLE public.resource_tags (
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_resources_course_id ON public.resources(course_id);
CREATE INDEX idx_resources_semester_id ON public.resources(semester_id);
CREATE INDEX idx_resources_approved ON public.resources(approved);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX idx_courses_department_id ON public.courses(department_id);

-- Full-text search index on resources
CREATE INDEX idx_resources_title_search ON public.resources USING gin(to_tsvector('english', title));

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Departments policies (public read)
CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

-- Courses policies (public read)
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

-- Professors policies (public read)
CREATE POLICY "Anyone can view professors"
  ON public.professors FOR SELECT
  USING (true);

-- Semesters policies (public read)
CREATE POLICY "Anyone can view semesters"
  ON public.semesters FOR SELECT
  USING (true);

-- Resources policies
-- Students can only view approved resources
CREATE POLICY "Students can view approved resources"
  ON public.resources FOR SELECT
  USING (
    approved = true OR
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert resources
CREATE POLICY "Only admins can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update resources
CREATE POLICY "Only admins can update resources"
  ON public.resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete resources
CREATE POLICY "Only admins can delete resources"
  ON public.resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tags policies (public read)
CREATE POLICY "Anyone can view tags"
  ON public.tags FOR SELECT
  USING (true);

-- Resource tags policies (public read)
CREATE POLICY "Anyone can view resource tags"
  ON public.resource_tags FOR SELECT
  USING (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
