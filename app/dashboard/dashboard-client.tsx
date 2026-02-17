"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { LogOut, Search, Upload, FileText, BookOpen, GraduationCap, Settings, Grid3x3, List } from "lucide-react"
import { useRouter } from "next/navigation"
import { Resource, ResourceType } from "@/lib/types"
import ResourceList from "@/components/resource-list"
import CourseCatalog from "@/components/course-catalog"
import UploadModal from "@/components/upload-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import AdminPanel from "@/components/admin-panel"

interface DashboardClientProps {
  userRole: "student" | "admin"
}

export default function DashboardClient({ userRole }: DashboardClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "catalog">("grid")

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
      const data = await res.json()
      
      // If there's an error, return empty array instead of error object
      if (data.error) {
        console.error("Error fetching resources:", data.error)
        return []
      }
      
      // Ensure we always return an array
      return Array.isArray(data) ? data : []
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">K-Vault</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {userRole === "admin" && (
                <>
                  <Button 
                    onClick={() => setShowAdminPanel(true)} 
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Manage</span>
                  </Button>
                  <Button 
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                    <span className="sm:hidden">Upload</span>
                  </Button>
                </>
              )}
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={handleLogout}
                size="sm"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Resource Library</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Browse and download course materials, past exams, and more
              </p>
            </div>
            <div className="flex items-center gap-2 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
              <Button
                variant={viewMode === "catalog" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("catalog")}
                className="h-8"
              >
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Catalog</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          {/* Filters - Stack on mobile, row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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

        {viewMode === "grid" ? (
          <ResourceList resources={Array.isArray(resources) ? resources : []} userRole={userRole} />
        ) : (
          <CourseCatalog resources={Array.isArray(resources) ? resources : []} userRole={userRole} />
        )}

        {showUploadModal && (
          <UploadModal
            onClose={() => {
              setShowUploadModal(false)
              refetchResources()
            }}
          />
        )}

        {showAdminPanel && (
          <AdminPanel
            onClose={() => {
              setShowAdminPanel(false)
              // Refetch all data when closing admin panel
              queryClient.invalidateQueries()
            }}
          />
        )}
      </main>
    </div>
  )
}
