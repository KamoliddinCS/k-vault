"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, Calendar, User, BookOpen, Eye } from "lucide-react"
import { Resource, ResourceType } from "@/lib/types"
import { format } from "date-fns"
import PDFPreview from "./pdf-preview"

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Ensure resources is always an array
  const resourcesArray = Array.isArray(resources) ? resources : []

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      const res = await fetch(`/api/download/${resourceId}`)
      const data = await res.json()

      if (data.url) {
        // Open in new tab for PDF preview, or download
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
            </div>
          </CardContent>
        </Card>
      ))}
      {previewUrl && (
        <PDFPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  )
}
