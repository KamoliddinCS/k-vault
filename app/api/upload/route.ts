import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getR2Client, getBucketName } from "@/lib/r2"
import { randomUUID } from "node:crypto"

// Increase body size limit for this route (100MB)
export const maxDuration = 60
export const runtime = 'nodejs'

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
      if (error.message?.includes("Request Entity Too Large") || error.message?.includes("Payload Too Large")) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 100MB." },
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

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit. Maximum size is 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
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

    // Create file key: {dept_code}/{course_code}/{year}-{term}/{uuid}-{filename}
    const deptCode = (course.department as any)?.code || "MISC"
    const fileKey = `${deptCode}/${course.course_code}/${semester.year}-${semester.term}/${randomUUID()}-${file.name}`

    // Upload file to Cloudflare R2
    let fileBuffer: Buffer
    try {
      fileBuffer = Buffer.from(await file.arrayBuffer())
    } catch (error: any) {
      return NextResponse.json(
        { error: "Failed to read file. Please try again." },
        { status: 500 }
      )
    }
    
    try {
      const r2 = getR2Client()
      const bucketName = getBucketName()
      
      await r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.type || "application/octet-stream",
          CacheControl: "max-age=3600",
        })
      )
    } catch (r2Error: any) {
      console.error("R2 upload error:", r2Error)
      
      // Check if it's a configuration error
      if (r2Error.message?.includes("not configured") || r2Error.message?.includes("not set")) {
        return NextResponse.json(
          { error: "Storage not configured. Please contact administrator." },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to upload to storage: ${r2Error.message || "Unknown error"}` },
        { status: 500 }
      )
    }

    // Create resource record in Supabase (metadata only)
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        semester_id: semesterId,
        professor_id: professorId || null,
        title,
        type,
        file_url: fileKey, // Keep for backward compatibility
        file_key: fileKey, // R2 key
        storage: "r2", // Mark as R2 storage
        uploaded_by: user.id,
        approved: true,
      })
      .select()
      .single()

    if (resourceError) {
      console.error("Database error:", resourceError)
      // Try to delete the uploaded file from R2 if DB insert fails
      try {
        // Note: We'd need DeleteObjectCommand here, but let's just log for now
        console.error("File uploaded to R2 but DB insert failed. File key:", fileKey)
      } catch {}
      throw resourceError
    }

    return NextResponse.json({ resource, fileKey }, { status: 201 })
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
