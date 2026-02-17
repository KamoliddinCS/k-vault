export type UserRole = "student" | "admin"

export type ResourceType =
  | "textbook"
  | "past_exam"
  | "solution"
  | "lecture_slide"
  | "presentation"
  | "assignment"

export type SemesterTerm = "Spring" | "Fall" | "Summer" | "Winter"

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Department {
  id: string
  name: string
  code: string
}

export interface Course {
  id: string
  department_id: string
  course_code: string
  course_name: string
  description: string | null
  department?: Department
}

export interface Professor {
  id: string
  name: string
  department_id: string
  department?: Department
}

export interface Semester {
  id: string
  year: number
  term: SemesterTerm
}

export interface Resource {
  id: string
  course_id: string
  semester_id: string
  professor_id: string | null
  title: string
  type: ResourceType
  file_url: string
  file_key?: string | null
  storage?: string | null
  uploaded_by: string
  approved: boolean
  created_at: string
  course?: Course
  semester?: Semester
  professor?: Professor
  uploaded_by_user?: User
}

export interface Tag {
  id: string
  name: string
}
