import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// API endpoint for uploading a single chunk
// This is called multiple times for large files
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
    const chunk = formData.get("chunk") as File
    const uploadId = formData.get("uploadId") as string
    const chunkIndex = parseInt(formData.get("chunkIndex") as string)
    const totalChunks = parseInt(formData.get("totalChunks") as string)
    const fileName = formData.get("fileName") as string

    if (!chunk || !uploadId || chunkIndex === undefined || !totalChunks || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Upload chunk to Supabase Storage with temporary name
    const chunkPath = `chunks/${uploadId}/${chunkIndex}-${totalChunks}.part`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("k-vault")
      .upload(chunkPath, chunk, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Chunk upload error:", uploadError)
      return NextResponse.json(
        { error: `Failed to upload chunk ${chunkIndex + 1}: ${uploadError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunkIndex: chunkIndex + 1,
      totalChunks,
      path: chunkPath,
    })
  } catch (error: any) {
    console.error("Chunk upload error:", error)
    return NextResponse.json(
      { error: error.message || "Chunk upload failed" },
      { status: 500 }
    )
  }
}
