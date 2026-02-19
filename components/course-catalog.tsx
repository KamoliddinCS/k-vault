"use client"

import { useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
  BookOpen,
  Trash2
} from "lucide-react"
import { Resource, ResourceType } from "@/lib/types"
import { format } from "date-fns"
import PDFPreview from "./pdf-preview"
import DownloadProgress from "./download-progress"
import { useToast, ToastContainer } from "@/components/ui/toast"

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
  const [downloadProgress, setDownloadProgress] = useState<{
    fileName: string
    progress: {
      loaded: number
      total: number
      percentage: number
      speed: number
      timeRemaining: number
    }
  } | null>(null)

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
      // Show loading indicator immediately for chunked files
      let filename = "download"
      
      // Show initial loading state (will be updated when we get headers)
      setDownloadProgress({
        fileName: filename,
        progress: {
          loaded: 0,
          total: 0, // Will be updated when headers are received
          percentage: 0,
          speed: 0,
          timeRemaining: 0,
        },
      })

      // Use XMLHttpRequest to track progress for both regular and chunked files
      const xhr = new XMLHttpRequest()
      
      let isChunkedFile = false

      // Track download progress
      const startTime = Date.now()
      let lastUpdateTime = startTime
      let lastLoaded = 0

      xhr.addEventListener("progress", (e) => {
        if (e.lengthComputable && isChunkedFile) {
          // Update progress for chunked files
          const now = Date.now()
          const timeElapsed = (now - lastUpdateTime) / 1000 // seconds
          
          if (timeElapsed > 0.3) { // Update every 300ms for smoother updates
            const bytesDelta = e.loaded - lastLoaded
            const speed = bytesDelta / timeElapsed
            const remainingBytes = e.total - e.loaded
            const timeRemaining = speed > 0 ? remainingBytes / speed : 0

            setDownloadProgress({
              fileName: filename,
              progress: {
                loaded: e.loaded,
                total: e.total,
                percentage: e.total > 0 ? (e.loaded / e.total) * 100 : 0,
                speed,
                timeRemaining,
              },
            })

            lastUpdateTime = now
            lastLoaded = e.loaded
          }
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const contentType = xhr.getResponseHeader("content-type")
          
          if (contentType?.includes("application/json")) {
            // Regular file - get signed URL from JSON response
            // When responseType is "blob", we need to read it as text first
            try {
              const blob = xhr.response as Blob
              blob.text().then((text) => {
                const data = JSON.parse(text)
                if (data.url) {
                  window.open(data.url, "_blank")
                }
                // Close progress modal
                setDownloadProgress(null)
              }).catch(() => {
                setDownloadProgress(null)
                alert("Failed to parse download response")
              })
            } catch {
              setDownloadProgress(null)
              alert("Failed to parse download response")
            }
          } else {
            // Chunked file - download as blob
            const blob = xhr.response as Blob
            
            // Update progress to 100% before closing
            setDownloadProgress({
              fileName: filename,
              progress: {
                loaded: blob.size,
                total: blob.size,
                percentage: 100,
                speed: 0,
                timeRemaining: 0,
              },
            })
            
            // Small delay to show completion, then download
            setTimeout(() => {
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = filename
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
              
              // Close progress modal
              setDownloadProgress(null)
            }, 500)
          }
        } else {
          setDownloadProgress(null)
          alert("Failed to download resource")
        }
      })

      xhr.addEventListener("error", () => {
        setDownloadProgress(null)
        alert("Failed to download resource")
      })

      xhr.addEventListener("abort", () => {
        setDownloadProgress(null)
      })

      // Check response headers first to determine if it's chunked
      xhr.addEventListener("readystatechange", () => {
        if (xhr.readyState === 2) { // HEADERS_RECEIVED
          const contentType = xhr.getResponseHeader("content-type")
          const contentLength = xhr.getResponseHeader("content-length")
          
          // If it's JSON, it's a regular file - close modal and handle normally
          if (contentType?.includes("application/json")) {
            setDownloadProgress(null)
            return
          }
          
          // If it's not JSON, it's a chunked file (blob response)
          isChunkedFile = true
          const totalSize = contentLength ? parseInt(contentLength, 10) : 0
          
          // Get filename from Content-Disposition header
          const contentDisposition = xhr.getResponseHeader("content-disposition")
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '')
              try {
                filename = decodeURIComponent(filename)
              } catch {
                // If decoding fails, use as is
              }
            }
          }
          
          // Ensure filename has extension
          if (!filename.includes('.')) {
            filename = `${filename}.pdf` // Default to .pdf
          }

          // Update progress modal with actual file info
          setDownloadProgress({
            fileName: filename,
            progress: {
              loaded: 0,
              total: totalSize || 0,
              percentage: 0,
              speed: 0,
              timeRemaining: 0,
            },
          })
        }
      })

      // Make the request with XMLHttpRequest
      xhr.open("GET", `/api/download/${resourceId}`)
      xhr.responseType = "blob"
      xhr.send()
    } catch (error) {
      console.error("Download failed:", error)
      setDownloadProgress(null)
      alert("Failed to download resource")
    }
  }

  const handlePreview = async (resourceId: string) => {
    try {
      const res = await fetch(`/api/download/${resourceId}`)
      
      // Check if response is JSON (regular file) or blob (chunked file)
      const contentType = res.headers.get("content-type")
      
      if (contentType?.includes("application/json")) {
        // Regular file - get signed URL
        const data = await res.json()
        if (data.url) {
          setPreviewUrl(data.url)
        }
      } else {
        // Chunked file - create blob URL for preview
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        setPreviewUrl(url)
      }
    } catch (error) {
      console.error("Preview failed:", error)
      alert("Failed to preview resource")
    }
  }

  const handleDelete = async (resourceId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete resource")
      }

      // Invalidate and refetch resources
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      toast.success("Resource deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete resource")
    }
  }

  const handleDelete = async (resourceId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete resource")
      }

      // Invalidate and refetch resources
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      toast.success("Resource deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete resource")
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
                                  {userRole === "admin" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(resource.id, resource.title)
                                      }}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
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
      {downloadProgress && (
        <DownloadProgress
          fileName={downloadProgress.fileName}
          progress={downloadProgress.progress}
          onClose={() => setDownloadProgress(null)}
        />
      )}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
