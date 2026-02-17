import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")
    const semesterId = searchParams.get("semester_id")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const approved = searchParams.get("approved")

    let query = supabase
      .from("resources")
      .select(
        "*, course:courses(*, department:departments(*)), semester:semesters(*), professor:professors(*), uploaded_by_user:users!resources_uploaded_by_fkey(*)"
      )
      .order("created_at", { ascending: false })

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    if (type) {
      query = query.eq("type", type)
    }

    if (approved !== null) {
      query = query.eq("approved", approved === "true")
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,course:courses.course_name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
    const { data, error } = await supabase
      .from("resources")
      .insert({
        ...body,
        uploaded_by: user.id,
        approved: true, // Admins auto-approve
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
