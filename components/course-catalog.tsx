"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Download, 
  Eye,
  Calendar,
  User,
  BookOpen
} from "lucide-react"
import { Resource, ResourceType } from "@/lib/types"
import { format } from "date-fns"
import PDFPreview from "./pdf-preview"

interface CourseCatalogProps {
  resources: Resource[]
  userRole: "student" | "admin"
}

const resourceTypeLabels: Record<ResourceType, string> = {
  textbook: "Textbook",
  past_exam: "Past Exam",
  solution: "Solution",
  lecture_slide: "Lecture Slide",
  presentation: "Presentation",
  assignment: "Assignment",
}

const resourceTypeColors: Record<ResourceType, string> = {
  textbook: "bg-blue-500",
  past_exam: "bg-red-500",
  solution: "bg-green-500",
  lecture_slide: "bg-purple-500",
  presentation: "bg-orange-500",
  assignment: "bg-yellow-500",
}

export default function CourseCatalog({ resources, userRole }: CourseCatalogProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Group resources by course, then by semester
  const catalogData = useMemo(() => {
    const courseMap = new Map<string, {
      course: any
      semesters: Map<string, {
        semester: any
        resources: Resource[]
      }>
    }>()

    resources.forEach((resource) => {
      if (!resource.course || !resource.semester) return

      const courseId = resource.course.id
      const semesterId = resource.semester.id

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course: resource.course,
          semesters: new Map()
        })
      }

      const courseData = courseMap.get(courseId)!
      
      if (!courseData.semesters.has(semesterId)) {
        courseData.semesters.set(semesterId, {
          semester: resource.semester,
          resources: []
        })
      }

      courseData.semesters.get(semesterId)!.resources.push(resource)
    })

    // Convert to array and sort
    return Array.from(courseMap.values())
      .map(courseData => ({
        ...courseData,
        semesters: Array.from(courseData.semesters.values())
          .sort((a, b) => {
            // Sort by year descending, then by term
            if (b.semester.year !== a.semester.year) {
              return b.semester.year - a.semester.year
            }
            const termOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 }
            return (termOrder[b.semester.term as keyof typeof termOrder] || 0) - 
                   (termOrder[a.semester.term as keyof typeof termOrder] || 0)
          })
      }))
      .sort((a, b) => {
        // Sort courses by code
        return a.course.course_code.localeCompare(b.course.course_code)
      })
  }, [resources])

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleSemester = (semesterId: string) => {
    const newExpanded = new Set(expandedSemesters)
    if (newExpanded.has(semesterId)) {
      newExpanded.delete(semesterId)
    } else {
      newExpanded.add(semesterId)
    }
    setExpandedSemesters(newExpanded)
  }

  const handleDownload = async (resourceId: string) => {
    try {
      const res = await fetch(`/api/download/${resourceId}`)
      const data = await res.json()
      if (data.url) {
        window.open(data.url, "_blank")
      }
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download resource")
    }
  }

  const handlePreview = async (resourceId: string) => {
    try {
      const res = await fetch(`/api/download/${resourceId}`)
      const data = await res.json()
      if (data.url) {
        setPreviewUrl(data.url)
      }
    } catch (error) {
      console.error("Preview failed:", error)
      alert("Failed to preview resource")
    }
  }

  if (catalogData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No courses found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-md border-b font-medium text-sm">
          <div className="w-6"></div>
          <div className="flex-1">Name</div>
          <div className="hidden sm:block w-32">Type</div>
          <div className="hidden md:block w-24">Date</div>
          <div className="w-24 text-right">Actions</div>
        </div>

        {/* Course List */}
        {catalogData.map((courseData) => {
          const courseId = courseData.course.id
          const isCourseExpanded = expandedCourses.has(courseId)
          const totalResources = courseData.semesters.reduce(
            (sum, s) => sum + s.resources.length, 
            0
          )

          return (
            <div key={courseId} className="border-b last:border-b-0">
              {/* Course Row */}
              <div 
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => toggleCourse(courseId)}
              >
                <div className="w-6 flex items-center justify-center">
                  {isCourseExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {courseData.course.course_code} - {courseData.course.course_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {courseData.course.department?.code} • {totalResources} resource{totalResources !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block w-32"></div>
                <div className="hidden md:block w-24"></div>
                <div className="w-24"></div>
              </div>

              {/* Semesters (when course is expanded) */}
              {isCourseExpanded && (
                <div className="bg-muted/20">
                  {courseData.semesters.map((semesterData) => {
                    const semesterId = semesterData.semester.id
                    const isSemesterExpanded = expandedSemesters.has(semesterId)

                    return (
                      <div key={semesterId} className="border-t">
                        {/* Semester Row */}
                        <div
                          className="flex items-center gap-4 px-4 pl-12 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSemester(semesterId)
                          }}
                        >
                          <div className="w-6 flex items-center justify-center">
                            {isSemesterExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Folder className="h-4 w-4 text-primary/70 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {semesterData.semester.year} {semesterData.semester.term}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {semesterData.resources.length} resource{semesterData.resources.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="hidden sm:block w-32"></div>
                          <div className="hidden md:block w-24"></div>
                          <div className="w-24"></div>
                        </div>

                        {/* Resources (when semester is expanded) */}
                        {isSemesterExpanded && (
                          <div className="bg-background">
                            {semesterData.resources.map((resource) => (
                              <div
                                key={resource.id}
                                className="flex items-center gap-4 px-4 pl-20 py-2 hover:bg-muted/50 border-t transition-colors group"
                              >
                                <div className="w-6"></div>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">
                                      {resource.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {resource.professor && (
                                        <>
                                          <User className="h-3 w-3" />
                                          <span className="truncate">{resource.professor.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="hidden sm:block w-32">
                                  <Badge
                                    className={`${resourceTypeColors[resource.type]} text-white text-xs`}
                                  >
                                    {resourceTypeLabels[resource.type]}
                                  </Badge>
                                </div>
                                <div className="hidden md:block w-24 text-xs text-muted-foreground">
                                  {format(new Date(resource.created_at), "MMM d, yyyy")}
                                </div>
                                <div className="w-24 flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePreview(resource.id)
                                    }}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownload(resource.id)
                                    }}
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {previewUrl && (
        <PDFPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </>
  )
}
