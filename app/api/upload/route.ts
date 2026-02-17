import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET_NAME } from "@/lib/r2"
import { randomUUID } from "node:crypto"

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

    const formData = await request.formData()
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
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.type || "application/octet-stream",
        CacheControl: "max-age=3600",
      })
    )

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

    if (resourceError) throw resourceError

    return NextResponse.json({ resource, fileKey }, { status: 201 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
