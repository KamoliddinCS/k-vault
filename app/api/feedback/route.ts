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

    // Get user email for feedback
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData.user?.email || "unknown"

    // Store feedback in a table (you'll need to create this table)
    // For now, we'll log it and return success
    // In production, you might want to:
    // 1. Store in a feedback table in Supabase
    // 2. Send email notification to admin
    // 3. Create GitHub issue automatically

    console.log("Feedback received:", {
      user: userEmail,
      type,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

    // TODO: Create feedback table and store this
    // For now, we'll just log it
    // You can create a feedback table with columns: id, user_id, type, message, created_at

    return NextResponse.json({ success: true, message: "Feedback received" }, { status: 201 })
  } catch (error: any) {
    console.error("Feedback error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    )
  }
}
