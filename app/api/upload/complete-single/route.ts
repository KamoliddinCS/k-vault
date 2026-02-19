import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// API endpoint to create resource record after client uploads file directly to Supabase Storage
// This bypasses Vercel's body size limit by not handling file uploads
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

    const body = await request.json()
    const {
      filePath,
      title,
      courseId,
      semesterId,
      professorId,
      type,
    } = body

    if (!filePath || !title || !courseId || !semesterId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the file exists in storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("k-vault")
      .download(filePath)

    if (fileError || !fileData) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      )
    }

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
        file_key: filePath,
        storage: "supabase",
        uploaded_by: user.id,
        approved: true,
      })
      .select()
      .single()

    if (resourceError) {
      console.error("Database error:", resourceError)
      // Try to delete the uploaded file if DB insert fails
      await supabase.storage.from("k-vault").remove([filePath])
      throw resourceError
    }

    return NextResponse.json({ resource, filePath }, { status: 201 })
  } catch (error: any) {
    console.error("Complete single upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete upload" },
      { status: 500 }
    )
  }
}
