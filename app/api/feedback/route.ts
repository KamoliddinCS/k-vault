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

    const body = await request.json()
    const { type, message } = body

    if (!type || !message || !message.trim()) {
      return NextResponse.json(
        { error: "Type and message are required" },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!["suggestion", "bug", "contribution"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      )
    }

    // Store feedback in the database
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        type,
        message: message.trim(),
      })
      .select()
      .single()

    if (feedbackError) {
      console.error("Failed to store feedback:", feedbackError)
      throw feedbackError
    }

    return NextResponse.json({ success: true, feedback }, { status: 201 })
  } catch (error: any) {
    console.error("Feedback error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query - fetch feedback first
    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && ["suggestion", "bug", "contribution"].includes(type)) {
      query = query.eq("type", type)
    }

    const { data: feedback, error: feedbackError } = await query

    if (feedbackError) {
      throw feedbackError
    }

    // Get user emails for all feedback items
    const userIds = feedback ? [...new Set(feedback.map((f: any) => f.user_id))] : []
    const userEmails: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds)

      if (!usersError && users) {
        users.forEach((user: any) => {
          userEmails[user.id] = user.email
        })
      }
    }

    // Enrich feedback with user email
    const enrichedFeedback = feedback
      ? feedback.map((item: any) => ({
          ...item,
          user: {
            id: item.user_id,
            email: userEmails[item.user_id] || "Unknown",
          },
        }))
      : []

    // Get total count for pagination
    let countQuery = supabase.from("feedback").select("*", { count: "exact", head: true })
    if (type && ["suggestion", "bug", "contribution"].includes(type)) {
      countQuery = countQuery.eq("type", type)
    }
    const { count } = await countQuery

    return NextResponse.json({
      feedback: enrichedFeedback,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Get feedback error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}
