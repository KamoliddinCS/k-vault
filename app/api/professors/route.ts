import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("department_id")

    let query = supabase
      .from("professors")
      .select("*, department:departments(*)")
      .order("name", { ascending: true })

    if (departmentId) {
      query = query.eq("department_id", departmentId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
