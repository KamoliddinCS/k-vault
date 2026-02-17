import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
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

    // Get resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("*, course:courses(*)")
      .eq("id", params.id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      )
    }

    // Check if user can access (approved or admin)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.role === "admin"
    const canAccess =
      resource.approved || resource.uploaded_by === user.id || isAdmin

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate signed URL from Supabase Storage
    const fileKey = resource.file_key || resource.file_url

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key not found" },
        { status: 404 }
      )
    }

    // Check if this is a chunked file (stored as multiple chunks)
    // Chunked files have pattern: {basePath}.chunk0, {basePath}.chunk1, etc.
    // Try to download the first chunk to see if it exists
    const firstChunkPath = `${fileKey}.chunk0`
    const { data: firstChunkData, error: firstChunkError } = await supabase.storage
      .from("k-vault")
      .download(firstChunkPath)

    const isChunked = !firstChunkError && firstChunkData !== null

    if (isChunked) {
      // For chunked files, we need to combine chunks and return as a stream
      // Find all chunks by trying to download each one
      const chunks: string[] = []
      let chunkIndex = 0
      
      while (true) {
        const chunkPath = `${fileKey}.chunk${chunkIndex}`
        const { data: chunkData, error: chunkError } = await supabase.storage
          .from("k-vault")
          .download(chunkPath)
        
        if (chunkError || !chunkData) {
          break
        }
        
        chunks.push(chunkPath)
        chunkIndex++
      }

      if (chunks.length === 0) {
        return NextResponse.json(
          { error: "No chunks found for chunked file" },
          { status: 404 }
        )
      }

      // Calculate total size first by checking all chunks
      let totalSize = 0
      const chunkSizes: number[] = []
      
      for (const chunkPath of chunks) {
        const { data: chunkData, error: chunkError } = await supabase.storage
          .from("k-vault")
          .download(chunkPath)

        if (chunkError) {
          return NextResponse.json(
            { error: `Failed to download chunk: ${chunkError.message}` },
            { status: 500 }
          )
        }

        const chunkSize = (await chunkData.arrayBuffer()).byteLength
        chunkSizes.push(chunkSize)
        totalSize += chunkSize
      }

      // Extract filename from fileKey
      const pathParts = fileKey.split('/')
      const lastPart = pathParts[pathParts.length - 1] || 'download'
      
      // Remove UUID prefix (36 characters + 1 dash = 37 characters)
      let filename = lastPart
      if (lastPart.length > 37 && lastPart[36] === '-') {
        filename = lastPart.substring(37)
      } else if (lastPart.includes('-')) {
        filename = lastPart.substring(lastPart.indexOf('-') + 1)
      }
      
      // Ensure filename has an extension
      let finalFilename = filename
      if (!filename.includes('.')) {
        const title = (resource as any).title || ''
        const extension = title.match(/\.(\w+)$/)?.[1] || 'pdf'
        finalFilename = `${filename}.${extension}`
      }
      
      // Create a streaming response that downloads and sends chunks one by one
      // This allows the client to see progress as chunks are downloaded
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < chunks.length; i++) {
              const chunkPath = chunks[i]
              
              // Download chunk
              const { data: chunkData, error: chunkError } = await supabase.storage
                .from("k-vault")
                .download(chunkPath)

              if (chunkError) {
                controller.error(new Error(`Failed to download chunk ${i + 1}: ${chunkError.message}`))
                return
              }

              // Convert to buffer and send to client
              const chunkBuffer = await chunkData.arrayBuffer()
              const uint8Array = new Uint8Array(chunkBuffer)
              controller.enqueue(uint8Array)
            }
            
            controller.close()
          } catch (error: any) {
            controller.error(error)
          }
        },
      })
      
      // Return streaming response
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFilename)}"`,
          'Content-Length': totalSize.toString(),
          'Transfer-Encoding': 'chunked', // Allow streaming
        },
      })
    } else {
      // Regular single file - generate signed URL
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("k-vault")
          .createSignedUrl(fileKey, 3600)

      if (signedUrlError) {
        console.error("Supabase signed URL error:", signedUrlError)
        return NextResponse.json(
          { error: `Failed to generate download URL: ${signedUrlError.message || "Unknown error"}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ url: signedUrlData.signedUrl })
    }
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 })
  }
}
