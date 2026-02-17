import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

// Increase body size limit for this route (50MB - Supabase's limit per chunk)
export const maxDuration = 60
export const runtime = 'nodejs'

// Supabase Storage has a 50MB limit per file upload
// Files larger than 50MB should use chunked uploads via /api/upload/chunk
const MAX_SINGLE_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse form data with size limit handling
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error: any) {
      console.error("FormData parsing error:", error)
      if (error.message?.includes("Request Entity Too Large") || error.message?.includes("Payload Too Large") || error.message?.includes("413")) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 50MB. If your file is smaller, this may be a server configuration issue." },
          { status: 413 }
        )
      }
      throw error
    }

    const file = formData.get("file") as File
    const courseId = formData.get("courseId") as string
    const semesterId = formData.get("semesterId") as string
    const professorId = formData.get("professorId") as string | null
    const title = formData.get("title") as string
    const type = formData.get("type") as string

    if (!file || !courseId || !semesterId || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check file size (Supabase free plan allows up to 1GB total, but 50MB per upload)
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    console.log(`Uploading file: ${file.name}, size: ${fileSizeMB}MB`)
    
    // Files larger than 50MB need to use chunked uploads
    if (file.size > MAX_SINGLE_UPLOAD_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds single upload limit. Files larger than 50MB must use chunked uploads. Your file is ${fileSizeMB}MB.`,
          requiresChunkedUpload: true,
          fileSize: file.size,
        },
        { status: 413 }
      )
    }

    // Get course info for folder structure
    const { data: course } = await supabase
      .from("courses")
      .select("course_code, department:departments(code)")
      .eq("id", courseId)
      .single()

    const { data: semester } = await supabase
      .from("semesters")
      .select("year, term")
      .eq("id", semesterId)
      .single()

    if (!course || !semester) {
      return NextResponse.json(
        { error: "Invalid course or semester" },
        { status: 400 }
      )
    }

    // Create file path: k-vault/{dept_code}/{course_code}/{year}-{term}/{uuid}-{filename}
    const deptCode = (course.department as any)?.code || "MISC"
    const filePath = `k-vault/${deptCode}/${course.course_code}/${semester.year}-${semester.term}/${randomUUID()}-${file.name}`

    // Upload file to Supabase Storage (for files <= 50MB)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("k-vault")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log(`Successfully uploaded to Supabase Storage: ${filePath}`)

    // Create resource record in Supabase
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        semester_id: semesterId,
        professor_id: professorId || null,
        title,
        type,
        file_url: filePath,
        file_key: filePath, // Keep for backward compatibility
        storage: "supabase", // Mark as Supabase storage
        uploaded_by: user.id,
        approved: true,
      })
      .select()
      .single()

    if (resourceError) {
      console.error("Database error:", resourceError)
      // Try to delete the uploaded file from Supabase Storage if DB insert fails
      try {
        await supabase.storage.from("k-vault").remove([filePath])
        console.log("Cleaned up uploaded file after DB insert failure")
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError)
      }
      throw resourceError
    }

    return NextResponse.json({ resource, filePath }, { status: 201 })
  } catch (error: any) {
    console.error("Upload error:", error)
    // Ensure we always return JSON
    const errorMessage = error.message || "Upload failed"
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    )
  }
}
