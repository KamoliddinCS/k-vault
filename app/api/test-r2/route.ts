import { NextResponse } from "next/server"
import { getR2Client, getBucketName } from "@/lib/r2"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"

// Test endpoint to verify R2 connection
export async function GET() {
  try {
    const r2 = getR2Client()
    const bucketName = getBucketName()
    
    console.log("Testing R2 connection...")
    console.log("Bucket:", bucketName)
    console.log("Endpoint:", process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)
    console.log("Account ID:", process.env.R2_ACCOUNT_ID ? "Set" : "Not set")
    console.log("Access Key ID:", process.env.R2_ACCESS_KEY_ID ? "Set" : "Not set")
    console.log("Secret Access Key:", process.env.R2_SECRET_ACCESS_KEY ? "Set" : "Not set")
    
    // Try to list objects (this will verify connection)
    // Use path-style addressing for R2 compatibility
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    })
    
    const result = await r2.send(command)
    
    return NextResponse.json({
      success: true,
      message: "R2 connection successful",
      bucket: bucketName,
      objectCount: result.KeyCount || 0,
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    })
  } catch (error: any) {
    console.error("R2 test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        errorName: error.name,
        details: {
          bucket: process.env.R2_BUCKET_NAME,
          endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          hasAccountId: !!process.env.R2_ACCOUNT_ID,
          hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        },
      },
      { status: 500 }
    )
  }
}
