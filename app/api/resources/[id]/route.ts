import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get resource info before deleting to access file paths
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("file_key, file_url")
      .eq("id", params.id)
      .single()

    if (resourceError) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    const fileKey = resource.file_key || resource.file_url
    if (fileKey) {
      // Check if this is a chunked file by trying to download the first chunk
      const { data: firstChunk, error: chunkError } = await supabase.storage
        .from("k-vault")
        .download(`${fileKey}.chunk0`)

      const isChunked = !chunkError && firstChunk !== null

      if (isChunked) {
        // Delete all chunks
        const chunksToDelete: string[] = []
        let chunkIndex = 0
        
        while (true) {
          const chunkPath = `${fileKey}.chunk${chunkIndex}`
          const { data: chunkData, error: chunkCheckError } = await supabase.storage
            .from("k-vault")
            .download(chunkPath)
          
          if (chunkCheckError || !chunkData) {
            break
          }
          
          chunksToDelete.push(chunkPath)
          chunkIndex++
        }

        if (chunksToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from("k-vault")
            .remove(chunksToDelete)
          
          if (deleteError) {
            console.error("Failed to delete chunks:", deleteError)
            // Continue with database deletion even if file deletion fails
          }
        }
      } else {
        // Delete single file
        const { error: deleteError } = await supabase.storage
          .from("k-vault")
          .remove([fileKey])
        
        if (deleteError) {
          console.error("Failed to delete file:", deleteError)
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // Delete resource from database
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
