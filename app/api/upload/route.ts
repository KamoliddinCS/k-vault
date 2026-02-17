import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    // Create file path: k-vault/{dept_code}/{course_code}/{year}-{term}/{filename}
    const deptCode = (course.department as any)?.code || "MISC"
    const filePath = `k-vault/${deptCode}/${course.course_code}/${semester.year}-${semester.term}/${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("k-vault")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get public URL (we'll use signed URLs for private access)
    const {
      data: { publicUrl },
    } = supabase.storage.from("k-vault").getPublicUrl(filePath)

    // Create resource record
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        semester_id: semesterId,
        professor_id: professorId || null,
        title,
        type,
        file_url: filePath, // Store path, not public URL
        uploaded_by: user.id,
        approved: true,
      })
      .select()
      .single()

    if (resourceError) throw resourceError

    return NextResponse.json({ resource, filePath }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
