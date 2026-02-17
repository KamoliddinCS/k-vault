"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { LogOut, Search, Upload, FileText, BookOpen, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { Resource, ResourceType } from "@/lib/types"
import ResourceList from "@/components/resource-list"
import UploadModal from "@/components/upload-modal"

interface DashboardClientProps {
  userRole: "student" | "admin"
}

export default function DashboardClient({ userRole }: DashboardClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [showUploadModal, setShowUploadModal] = useState(false)

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

  const { data: resources, refetch: refetchResources } = useQuery({
    queryKey: ["resources", selectedCourse, selectedSemester, selectedType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourse) params.append("course_id", selectedCourse)
      if (selectedSemester) params.append("semester_id", selectedSemester)
      if (selectedType) params.append("type", selectedType)
      if (searchQuery) params.append("search", searchQuery)
      params.append("approved", "true")

      const res = await fetch(`/api/resources?${params.toString()}`)
      return res.json()
    },
  })

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const resourceTypes: ResourceType[] = [
    "textbook",
    "past_exam",
    "solution",
    "lecture_slide",
    "presentation",
    "assignment",
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">K-Vault</h1>
          </div>
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Resource Library</h2>
          <p className="text-muted-foreground">
            Browse and download course materials, past exams, and more
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-64"
            >
              <option value="">All Courses</option>
              {courses?.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </Select>
            <Select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-48"
            >
              <option value="">All Semesters</option>
              {semesters?.map((semester: any) => (
                <option key={semester.id} value={semester.id}>
                  {semester.year} {semester.term}
                </option>
              ))}
            </Select>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-48"
            >
              <option value="">All Types</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <ResourceList resources={resources || []} userRole={userRole} />

        {showUploadModal && (
          <UploadModal
            onClose={() => {
              setShowUploadModal(false)
              refetchResources()
            }}
          />
        )}
      </main>
    </div>
  )
}
