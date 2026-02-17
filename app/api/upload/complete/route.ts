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
    const fileId = randomUUID()
    const finalPath = `k-vault/${deptCode}/${course.course_code}/${semester.year}-${semester.term}/${fileId}-${fileName}`

    // Instead of reassembling, move chunks to final location
    // This avoids the 50MB upload limit for reassembled files
    const chunkPaths: string[] = []
    const finalChunkPaths: string[] = []
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `chunks/${uploadId}/${i}-${totalChunks}.part`
      const finalChunkPath = `${finalPath}.chunk${i}`
      
      chunkPaths.push(chunkPath)
      finalChunkPaths.push(finalChunkPath)

      // Download chunk
      const { data: chunkData, error: chunkError } = await supabase.storage
        .from("k-vault")
        .download(chunkPath)

      if (chunkError) {
        // Clean up any already moved chunks
        if (finalChunkPaths.length > 0) {
          await supabase.storage.from("k-vault").remove(finalChunkPaths)
        }
        throw new Error(`Failed to download chunk ${i + 1}: ${chunkError.message}`)
      }

      // Upload chunk to final location
      const { error: uploadError } = await supabase.storage
        .from("k-vault")
        .upload(finalChunkPath, chunkData, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        // Clean up any already moved chunks
        await supabase.storage.from("k-vault").remove(finalChunkPaths)
        throw new Error(`Failed to move chunk ${i + 1} to final location: ${uploadError.message}`)
      }
    }

    // Clean up temporary chunk files
    await supabase.storage.from("k-vault").remove(chunkPaths)

    // Create resource record in Supabase
    // Store the base path and chunk count for reassembly on download
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        semester_id: semesterId,
        professor_id: professorId || null,
        title,
        type,
        file_url: finalPath, // Base path for chunks
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
