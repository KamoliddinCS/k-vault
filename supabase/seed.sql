-- Seed data for K-Vault
-- Run this after the initial migration

-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Electrical Engineering', 'EE'),
  ('Mechanical Engineering', 'ME'),
  ('Mathematics', 'MATH'),
  ('Physics', 'PHYS'),
  ('Chemistry', 'CHEM')
ON CONFLICT (code) DO NOTHING;

-- Insert sample semesters
INSERT INTO public.semesters (year, term) VALUES
  (2024, 'Spring'),
  (2024, 'Fall'),
  (2023, 'Spring'),
  (2023, 'Fall'),
  (2022, 'Spring'),
  (2022, 'Fall')
ON CONFLICT (year, term) DO NOTHING;

-- Insert sample courses (adjust department_id based on your actual IDs)
-- Note: You'll need to get the actual department IDs from your database
INSERT INTO public.courses (department_id, course_code, course_name, description)
SELECT 
  d.id,
  'CS101',
  'Introduction to Computer Science',
  'Fundamental concepts of computer science and programming'
FROM public.departments d
WHERE d.code = 'CS'
ON CONFLICT (department_id, course_code) DO NOTHING;

INSERT INTO public.courses (department_id, course_code, course_name, description)
SELECT 
  d.id,
  'CS230',
  'System Programming',
  'Introduction to system-level programming'
FROM public.departments d
WHERE d.code = 'CS'
ON CONFLICT (department_id, course_code) DO NOTHING;

INSERT INTO public.courses (department_id, course_code, course_name, description)
SELECT 
  d.id,
  'EE201',
  'Circuit Theory',
  'Basic circuit analysis and theory'
FROM public.departments d
WHERE d.code = 'EE'
ON CONFLICT (department_id, course_code) DO NOTHING;

-- Insert sample professors
INSERT INTO public.professors (name, department_id)
SELECT 
  'John Smith',
  d.id
FROM public.departments d
WHERE d.code = 'CS'
ON CONFLICT DO NOTHING;

INSERT INTO public.professors (name, department_id)
SELECT 
  'Jane Doe',
  d.id
FROM public.departments d
WHERE d.code = 'CS'
ON CONFLICT DO NOTHING;

-- Note: Resources should be added through the application interface
-- This seed file is for initial setup data only
