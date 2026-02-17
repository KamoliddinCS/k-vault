import { S3Client } from "@aws-sdk/client-s3"

// Only validate and initialize on server-side
if (typeof window === "undefined") {
  if (!process.env.R2_ACCOUNT_ID) {
    console.warn("R2_ACCOUNT_ID is not set - R2 uploads will fail")
  }

  if (!process.env.R2_ACCESS_KEY_ID) {
    console.warn("R2_ACCESS_KEY_ID is not set - R2 uploads will fail")
  }

  if (!process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("R2_SECRET_ACCESS_KEY is not set - R2 uploads will fail")
  }

  if (!process.env.R2_BUCKET_NAME) {
    console.warn("R2_BUCKET_NAME is not set - R2 uploads will fail")
  }
}

export function getR2Client(): S3Client {
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY")
  }

  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export function getBucketName(): string {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not set")
  }
  return process.env.R2_BUCKET_NAME
}

// Note: Don't initialize at module load to avoid errors if env vars aren't set
// Use getR2Client() and getBucketName() functions instead
