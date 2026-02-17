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
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    bytesUploaded: number
    totalBytes: number
    speed: number // bytes per second
    timeRemaining: number // seconds
    status: "uploading" | "reassembling" | "complete"
  } | null>(null)

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
      const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB chunks (Supabase limit)
      const fileSize = file.size
      const useChunkedUpload = fileSize > CHUNK_SIZE

      if (useChunkedUpload) {
        // Chunked upload for files > 50MB
        await handleChunkedUpload(file, title, courseId, semesterId, professorId, type)
      } else {
        // Single upload for files <= 50MB
        await handleSingleUpload(file, title, courseId, semesterId, professorId, type)
      }

      onClose()
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSingleUpload = async (
    file: File,
    title: string,
    courseId: string,
    semesterId: string,
    professorId: string,
    type: ResourceType
  ) => {
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
      let errorMessage = "Upload failed"
      try {
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json()
          errorMessage = data.error || `Upload failed (${res.status})`
        } else {
          const text = await res.text()
          errorMessage = text || `Upload failed (${res.status})`
        }
      } catch (parseError) {
        errorMessage = `Upload failed: ${res.statusText || res.status}`
      }
      throw new Error(errorMessage)
    }
  }

  const handleChunkedUpload = async (
    file: File,
    title: string,
    courseId: string,
    semesterId: string,
    professorId: string,
    type: ResourceType
  ) => {
      // Use 40MB chunks for safety margin (Supabase limit is 50MB)
      const CHUNK_SIZE = 40 * 1024 * 1024 // 40MB
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const uploadId = crypto.randomUUID()

      console.log(`Starting chunked upload: ${totalChunks} chunks for ${(file.size / 1024 / 1024).toFixed(2)}MB file`)
      
      const startTime = Date.now()
      let lastUpdateTime = startTime
      let completedBytes = 0 // Bytes from fully completed chunks

      setUploadProgress({
        current: 0,
        total: totalChunks,
        bytesUploaded: 0,
        totalBytes: file.size,
        speed: 0,
        timeRemaining: 0,
        status: "uploading",
      })

      // Upload each chunk with retry logic
      const MAX_RETRIES = 3
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        const chunkSize = chunk.size

        let retryCount = 0
        let chunkUploaded = false

        while (retryCount < MAX_RETRIES && !chunkUploaded) {
          try {
            const chunkFormData = new FormData()
            chunkFormData.append("chunk", chunk)
            chunkFormData.append("uploadId", uploadId)
            chunkFormData.append("chunkIndex", i.toString())
            chunkFormData.append("totalChunks", totalChunks.toString())
            chunkFormData.append("fileName", file.name)

            // Use XMLHttpRequest for progress tracking within chunk
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              let lastChunkBytes = 0

              // Track upload progress for this chunk
              xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                  const chunkProgress = e.loaded / e.total
                  const currentChunkBytes = chunkProgress * chunkSize
                  const totalBytesUploaded = completedBytes + currentChunkBytes
                  
                  const now = Date.now()
                  const timeElapsed = (now - lastUpdateTime) / 1000 // seconds
                  
                  if (timeElapsed > 0.5) { // Update every 500ms
                    const bytesDelta = currentChunkBytes - lastChunkBytes
                    const speed = bytesDelta / timeElapsed
                    const remainingBytes = file.size - totalBytesUploaded
                    const timeRemaining = speed > 0 ? remainingBytes / speed : 0

                    setUploadProgress({
                      current: i,
                      total: totalChunks,
                      bytesUploaded: totalBytesUploaded,
                      totalBytes: file.size,
                      speed,
                      timeRemaining,
                      status: "uploading",
                    })

                    lastUpdateTime = now
                    lastChunkBytes = currentChunkBytes
                  }
                }
              })

              xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  completedBytes += chunkSize
                  resolve()
                } else {
                  try {
                    const data = JSON.parse(xhr.responseText)
                    reject(new Error(data.error || `HTTP ${xhr.status}`))
                  } catch {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
                  }
                }
              })

              xhr.addEventListener("error", () => {
                reject(new Error("Network error during chunk upload"))
              })

              xhr.addEventListener("abort", () => {
                reject(new Error("Upload aborted"))
              })

              xhr.open("POST", "/api/upload/chunk")
              xhr.send(chunkFormData)
            })

            chunkUploaded = true
            console.log(`Uploaded chunk ${i + 1}/${totalChunks}`)
            
            // Update progress after chunk completes
            const elapsedTime = (Date.now() - startTime) / 1000 // seconds
            const averageSpeed = completedBytes / elapsedTime
            const remainingBytes = file.size - completedBytes
            const estimatedTimeRemaining = averageSpeed > 0 ? remainingBytes / averageSpeed : 0

            setUploadProgress({
              current: i + 1,
              total: totalChunks,
              bytesUploaded: completedBytes,
              totalBytes: file.size,
              speed: averageSpeed,
              timeRemaining: estimatedTimeRemaining,
              status: "uploading",
            })
          } catch (error: any) {
            retryCount++
            if (retryCount >= MAX_RETRIES) {
              throw new Error(
                `Failed to upload chunk ${i + 1}/${totalChunks} after ${MAX_RETRIES} attempts: ${error.message}`
              )
            }
            console.warn(`Retrying chunk ${i + 1} (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          }
        }
      }

      // Complete the upload by reassembling chunks
      setUploadProgress((prev) =>
        prev
          ? {
              ...prev,
              status: "reassembling",
            }
          : null
      )

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          totalChunks,
          courseId,
          semesterId,
          professorId: professorId || null,
          title,
          type,
        }),
      })

      if (!completeRes.ok) {
        const data = await completeRes.json()
        throw new Error(`Failed to complete upload: ${data.error || "Unknown error"}`)
      }

      setUploadProgress((prev) =>
        prev
          ? {
              ...prev,
              bytesUploaded: prev.totalBytes,
              status: "complete",
            }
          : null
      )

      // Clear progress after a brief delay to show completion
      setTimeout(() => {
        setUploadProgress(null)
      }, 1000)

      console.log("Chunked upload completed successfully")
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

            {uploadProgress && (
              <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium">
                    {uploadProgress.status === "reassembling"
                      ? "Reassembling file..."
                      : uploadProgress.status === "complete"
                      ? "Upload complete!"
                      : "Uploading file..."}
                  </span>
                  <span className="text-muted-foreground">
                    {uploadProgress.current} / {uploadProgress.total} chunks
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.bytesUploaded / uploadProgress.totalBytes) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Progress</div>
                    <div className="font-medium">
                      {((uploadProgress.bytesUploaded / uploadProgress.totalBytes) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Uploaded</div>
                    <div className="font-medium">
                      {(uploadProgress.bytesUploaded / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  {uploadProgress.speed > 0 && uploadProgress.status === "uploading" && (
                    <>
                      <div>
                        <div className="text-muted-foreground">Speed</div>
                        <div className="font-medium">
                          {(uploadProgress.speed / 1024 / 1024).toFixed(2)} MB/s
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time left</div>
                        <div className="font-medium">
                          {uploadProgress.timeRemaining > 60
                            ? `${Math.floor(uploadProgress.timeRemaining / 60)}m ${Math.floor(uploadProgress.timeRemaining % 60)}s`
                            : `${Math.floor(uploadProgress.timeRemaining)}s`}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto" disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                <UploadIcon className="h-4 w-4 mr-2" />
                {uploading
                  ? uploadProgress?.status === "reassembling"
                    ? "Reassembling..."
                    : uploadProgress?.status === "complete"
                    ? "Complete!"
                    : "Uploading..."
                  : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
