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

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("k-vault")
        .createSignedUrl(resource.file_url, 3600)

    if (signedUrlError) throw signedUrlError

    return NextResponse.json({ url: signedUrlData.signedUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
