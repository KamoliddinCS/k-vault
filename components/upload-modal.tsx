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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upload Resource</CardTitle>
              <CardDescription>Add a new resource to the library</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midterm Exam 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select
                  id="course"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setProfessorId("")
                  }}
                  required
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
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  id="semester"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  required
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Resource Type *</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ResourceType)}
                  required
                >
                  {resourceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor">Professor (Optional)</Label>
                <Select
                  id="professor"
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                  disabled={!courseId}
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
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
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
