import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

// API endpoint to reassemble chunks and create the final file
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
      uploadId,
      fileName,
      totalChunks,
      courseId,
      semesterId,
      professorId,
      title,
      type,
    } = body

    if (!uploadId || !fileName || !totalChunks || !courseId || !semesterId || !title || !type) {
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

    // Create final file path
    const deptCode = (course.department as any)?.code || "MISC"
    const finalPath = `k-vault/${deptCode}/${course.course_code}/${semester.year}-${semester.term}/${randomUUID()}-${fileName}`

    // Download all chunks and combine them
    const chunks: ArrayBuffer[] = []
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `chunks/${uploadId}/${i}-${totalChunks}.part`
      
      const { data: chunkData, error: chunkError } = await supabase.storage
        .from("k-vault")
        .download(chunkPath)

      if (chunkError) {
        // Clean up uploaded chunks on error
        for (let j = 0; j < i; j++) {
          const cleanupPath = `chunks/${uploadId}/${j}-${totalChunks}.part`
          await supabase.storage.from("k-vault").remove([cleanupPath])
        }
        throw new Error(`Failed to download chunk ${i + 1}: ${chunkError.message}`)
      }

      chunks.push(await chunkData.arrayBuffer())
    }

    // Combine chunks into single file
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const combinedBuffer = new Uint8Array(totalSize)
    let offset = 0
    
    for (const chunk of chunks) {
      combinedBuffer.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }

    // Upload combined file
    const { data: finalUploadData, error: finalUploadError } = await supabase.storage
      .from("k-vault")
      .upload(finalPath, combinedBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/octet-stream",
      })

    if (finalUploadError) {
      throw finalUploadError
    }

    // Clean up chunk files
    const chunkPaths = Array.from({ length: totalChunks }, (_, i) => 
      `chunks/${uploadId}/${i}-${totalChunks}.part`
    )
    await supabase.storage.from("k-vault").remove(chunkPaths)

    // Create resource record in Supabase
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        semester_id: semesterId,
        professor_id: professorId || null,
        title,
        type,
        file_url: finalPath,
        file_key: finalPath, // Keep for backward compatibility
        storage: "supabase", // Mark as Supabase storage
        uploaded_by: user.id,
        approved: true,
      })
      .select()
      .single()

    if (resourceError) {
      // Try to delete the uploaded file if DB insert fails
      await supabase.storage.from("k-vault").remove([finalPath])
      throw resourceError
    }

    return NextResponse.json({ resource, filePath: finalPath }, { status: 201 })
  } catch (error: any) {
    console.error("Complete upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete upload" },
      { status: 500 }
    )
  }
}
