"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Upload as UploadIcon } from "lucide-react"
import { ResourceType } from "@/lib/types"

interface UploadModalProps {
  onClose: () => void
}

const resourceTypes: ResourceType[] = [
  "textbook",
  "past_exam",
  "solution",
  "lecture_slide",
  "presentation",
  "assignment",
]

export default function UploadModal({ onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [courseId, setCourseId] = useState("")
  const [semesterId, setSemesterId] = useState("")
  const [professorId, setProfessorId] = useState("")
  const [type, setType] = useState<ResourceType>("past_exam")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses")
      return res.json()
    },
  })

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await fetch("/api/semesters")
      return res.json()
    },
  })

  const { data: professors } = useQuery({
    queryKey: ["professors", courseId],
    queryFn: async () => {
      if (!courseId) return []
      const course = courses?.find((c: any) => c.id === courseId)
      if (!course) return []
      const res = await fetch(`/api/professors?department_id=${course.department_id}`)
      return res.json()
    },
    enabled: !!courseId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !courseId || !semesterId || !type) {
      setError("Please fill in all required fields")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("courseId", courseId)
      formData.append("semesterId", semesterId)
      formData.append("type", type)
      if (professorId) {
        formData.append("professorId", professorId)
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      onClose()
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto m-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Upload Resource</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Add a new resource to the library</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midterm Exam 2024"
                required
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm">File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="course" className="text-sm">Course *</Label>
                <Select
                  id="course"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setProfessorId("")
                  }}
                  required
                  className="text-sm sm:text-base"
                >
                  <option value="">Select course</option>
                  {courses?.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm">Semester *</Label>
                <Select
                  id="semester"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  required
                  className="text-sm sm:text-base"
                >
                  <option value="">Select semester</option>
                  {semesters?.map((semester: any) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.year} {semester.term}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm">Resource Type *</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ResourceType)}
                  required
                  className="text-sm sm:text-base"
                >
                  {resourceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor" className="text-sm">Professor (Optional)</Label>
                <Select
                  id="professor"
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                  disabled={!courseId}
                  className="text-sm sm:text-base"
                >
                  <option value="">Select professor</option>
                  {professors?.map((professor: any) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {error && (
              <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                <UploadIcon className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
