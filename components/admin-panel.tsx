"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, X, Save } from "lucide-react"
import { SemesterTerm } from "@/lib/types"
import { useToast, ToastContainer } from "@/components/ui/toast"

interface AdminPanelProps {
  onClose?: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<"departments" | "courses" | "semesters" | "professors" | "types">("departments")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fetch departments for courses and professors
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments")
      return res.json()
    },
  })

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses")
      return res.json()
    },
  })

  // Fetch semesters
  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await fetch("/api/semesters")
      return res.json()
    },
  })

  // Fetch professors
  const { data: professors } = useQuery({
    queryKey: ["professors"],
    queryFn: async () => {
      const res = await fetch("/api/professors")
      return res.json()
    },
  })

  // Department mutations
  const createDepartment = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create department")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Department created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create department")
    },
  })

  const updateDepartment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update department")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      setEditingId(null)
      toast.success("Department updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update department")
    },
  })

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to delete department")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Department deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete department")
    },
  })

  // Course mutations
  const createCourse = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create course")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("Course created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create course")
    },
  })

  const updateCourse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update course")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      setEditingId(null)
      toast.success("Course updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update course")
    },
  })

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to delete course")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("Course deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete course")
    },
  })

  // Semester mutations
  const createSemester = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create semester")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] })
      toast.success("Semester created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create semester")
    },
  })

  const updateSemester = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/semesters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update semester")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] })
      setEditingId(null)
      toast.success("Semester updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update semester")
    },
  })

  const deleteSemester = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/semesters/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to delete semester")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] })
      toast.success("Semester deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete semester")
    },
  })

  // Professor mutations
  const createProfessor = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create professor")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professors"] })
      toast.success("Professor created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create professor")
    },
  })

  const updateProfessor = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/professors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update professor")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professors"] })
      setEditingId(null)
      toast.success("Professor updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update professor")
    },
  })

  const deleteProfessor = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/professors/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to delete professor")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professors"] })
      toast.success("Professor deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete professor")
    },
  })

  // Resource types (read-only, as they're ENUMs)
  const resourceTypes = [
    "textbook",
    "past_exam",
    "solution",
    "lecture_slide",
    "presentation",
    "assignment",
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto m-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl">Admin Management Panel</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage courses, semesters, professors, and view resource types</CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
            {(["departments", "courses", "semesters", "professors", "types"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setEditingId(null)
                }}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Departments Tab */}
          {activeTab === "departments" && (
            <DepartmentManagement
              departments={departments || []}
              editingId={editingId}
              setEditingId={setEditingId}
              onCreate={createDepartment.mutate}
              onUpdate={updateDepartment.mutate}
              onDelete={deleteDepartment.mutate}
            />
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <CourseManagement
              courses={courses || []}
              departments={departments || []}
              editingId={editingId}
              setEditingId={setEditingId}
              onCreate={createCourse.mutate}
              onUpdate={updateCourse.mutate}
              onDelete={deleteCourse.mutate}
            />
          )}

          {/* Semesters Tab */}
          {activeTab === "semesters" && (
            <SemesterManagement
              semesters={semesters || []}
              editingId={editingId}
              setEditingId={setEditingId}
              onCreate={createSemester.mutate}
              onUpdate={updateSemester.mutate}
              onDelete={deleteSemester.mutate}
            />
          )}

          {/* Professors Tab */}
          {activeTab === "professors" && (
            <ProfessorManagement
              professors={professors || []}
              departments={departments || []}
              editingId={editingId}
              setEditingId={setEditingId}
              onCreate={createProfessor.mutate}
              onUpdate={updateProfessor.mutate}
              onDelete={deleteProfessor.mutate}
            />
          )}

          {/* Resource Types Tab */}
          {activeTab === "types" && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Resource types are defined as database ENUMs and cannot be modified through the UI.
                To add new types, a database migration is required.
              </div>
              <div className="flex flex-wrap gap-2">
                {resourceTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-sm">
                    {type.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

// Department Management Component
function DepartmentManagement({
  departments,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      onUpdate({ id: editingId, data: formData })
    } else {
      onCreate(formData)
      setFormData({ name: "", code: "" })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
        <div className="space-y-2">
          <Label className="text-sm">Department Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Computer Science"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Department Code *</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., CS"
            required
            maxLength={10}
            className="text-sm sm:text-base"
          />
        </div>
        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full sm:w-auto">{editingId ? "Update" : "Create"} Department</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => {
              setEditingId(null)
              setFormData({ name: "", code: "" })
            }} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {departments.map((dept: any) => (
          <div key={dept.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">{dept.code} - {dept.name}</div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(dept.id)
                  setFormData({
                    name: dept.name,
                    code: dept.code,
                  })
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this department? This will also delete all associated courses and professors.")) {
                    onDelete(dept.id)
                  }
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Course Management Component
function CourseManagement({
  courses,
  departments,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  const [formData, setFormData] = useState({
    department_id: "",
    course_code: "",
    course_name: "",
    description: "",
  })

  // Reset form when editing changes
  useEffect(() => {
    if (!editingId) {
      setFormData({ department_id: "", course_code: "", course_name: "", description: "" })
    }
  }, [editingId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      onUpdate({ id: editingId, data: formData })
    } else {
      onCreate(formData)
      setFormData({ department_id: "", course_code: "", course_name: "", description: "" })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
        <div className="space-y-2">
          <Label className="text-sm">Department *</Label>
          <Select
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            required
            className="text-sm sm:text-base"
          >
            <option value="">Select department</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Course Code *</Label>
          <Input
            value={formData.course_code}
            onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
            placeholder="e.g., CS101"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Course Name *</Label>
          <Input
            value={formData.course_name}
            onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
            placeholder="e.g., Introduction to Computer Science"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            className="text-sm sm:text-base"
          />
        </div>
        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full sm:w-auto">{editingId ? "Update" : "Create"} Course</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => {
              setEditingId(null)
              setFormData({ department_id: "", course_code: "", course_name: "", description: "" })
            }} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {courses.map((course: any) => (
          <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">{course.course_code} - {course.course_name}</div>
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {course.department?.code} - {course.department?.name}
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(course.id)
                  setFormData({
                    department_id: course.department_id,
                    course_code: course.course_code,
                    course_name: course.course_name,
                    description: course.description || "",
                  })
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this course?")) {
                    onDelete(course.id)
                  }
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Semester Management Component
function SemesterManagement({
  semesters,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    term: "Spring" as SemesterTerm,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      onUpdate({ id: editingId, data: formData })
    } else {
      onCreate(formData)
      setFormData({ year: new Date().getFullYear(), term: "Spring" })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
        <div className="space-y-2">
          <Label className="text-sm">Year *</Label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
            min="2000"
            max="2100"
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Term *</Label>
          <Select
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value as SemesterTerm })}
            required
            className="text-sm sm:text-base"
          >
            <option value="Spring">Spring</option>
            <option value="Fall">Fall</option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
          </Select>
        </div>
        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full sm:w-auto">{editingId ? "Update" : "Create"} Semester</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => {
              setEditingId(null)
              setFormData({ year: new Date().getFullYear(), term: "Spring" })
            }} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {semesters.map((semester: any) => (
          <div key={semester.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
            <div className="font-medium text-sm sm:text-base">{semester.year} {semester.term}</div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(semester.id)
                  setFormData({ year: semester.year, term: semester.term })
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this semester?")) {
                    onDelete(semester.id)
                  }
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Professor Management Component
function ProfessorManagement({
  professors,
  departments,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      onUpdate({ id: editingId, data: formData })
    } else {
      onCreate(formData)
      setFormData({ name: "", department_id: "" })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
        <div className="space-y-2">
          <Label className="text-sm">Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., John Smith"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Department *</Label>
          <Select
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            required
            className="text-sm sm:text-base"
          >
            <option value="">Select department</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full sm:w-auto">{editingId ? "Update" : "Create"} Professor</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => {
              setEditingId(null)
              setFormData({ name: "", department_id: "" })
            }} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {professors.map((professor: any) => (
          <div key={professor.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">{professor.name}</div>
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {professor.department?.code} - {professor.department?.name}
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(professor.id)
                  setFormData({
                    name: professor.name,
                    department_id: professor.department_id,
                  })
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this professor?")) {
                    onDelete(professor.id)
                  }
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
