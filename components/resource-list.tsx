"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, Calendar, User, BookOpen, Eye, Trash2 } from "lucide-react"
import { Resource, ResourceType } from "@/lib/types"
import { format } from "date-fns"
import PDFPreview from "./pdf-preview"
import DownloadProgress from "./download-progress"
import { useToast, ToastContainer } from "@/components/ui/toast"

interface ResourceListProps {
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

export default function ResourceList({ resources, userRole }: ResourceListProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
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

  // Ensure resources is always an array
  const resourcesArray = Array.isArray(resources) ? resources : []

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      // Show loading indicator immediately for chunked files
      // We'll detect if it's chunked based on file size or response
      // For now, show a loading state immediately
      let filename = title || "download"
      
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
            const extension = title.match(/\.(\w+)$/)?.[1] || 'pdf'
            filename = `${filename}.${extension}`
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

      // Track download progress
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

  if (!resourcesArray || resourcesArray.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No resources found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resourcesArray.map((resource) => (
        <Card key={resource.id} className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2">{resource.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {resource.course?.course_code} - {resource.course?.course_name}
                  </span>
                </CardDescription>
              </div>
              <Badge
                className={`${resourceTypeColors[resource.type]} text-white text-xs flex-shrink-0 self-start`}
              >
                {resourceTypeLabels[resource.type]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col">
            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 flex-1">
              {resource.semester && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{resource.semester.year} {resource.semester.term}</span>
                </div>
              )}
              {resource.professor && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{resource.professor.name}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Uploaded {format(new Date(resource.created_at), "MMM d, yyyy")}
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                onClick={() => handlePreview(resource.id)}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => handleDownload(resource.id, resource.title)}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {userRole === "admin" && (
                <Button
                  onClick={() => handleDelete(resource.id, resource.title)}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
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
    </div>
  )
}
