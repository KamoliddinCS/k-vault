import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getR2Client, getBucketName } from "@/lib/r2"

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

    // Determine storage type and generate signed URL
    const storageType = resource.storage || "r2" // Default to R2 for new uploads
    const fileKey = resource.file_key || resource.file_url

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key not found" },
        { status: 404 }
      )
    }

    if (storageType === "r2") {
      try {
        // Generate R2 signed URL (valid for 1 hour)
        const r2 = getR2Client()
        const bucketName = getBucketName()
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
        })

        const signedUrl = await getSignedUrl(r2, command, {
          expiresIn: 3600, // 1 hour
        })

        return NextResponse.json({ url: signedUrl })
      } catch (r2Error: any) {
        console.error("R2 signed URL error:", r2Error)
        return NextResponse.json(
          { error: `Failed to generate download URL: ${r2Error.message || "Unknown error"}` },
          { status: 500 }
        )
      }
    } else {
      // Fallback to Supabase Storage for legacy files
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("k-vault")
          .createSignedUrl(fileKey, 3600)

      if (signedUrlError) throw signedUrlError

      return NextResponse.json({ url: signedUrlData.signedUrl })
    }
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 })
  }
}
