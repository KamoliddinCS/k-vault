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

    // Generate signed URL (valid for 1 hour)
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
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 })
  }
}
