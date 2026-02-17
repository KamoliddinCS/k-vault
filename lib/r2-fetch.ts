// Alternative R2 client using native fetch API to bypass AWS SDK SSL issues
// This is a workaround for SSL handshake failures with Node.js 23+

import { createHmac } from "node:crypto"

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

function getR2Config(): R2Config {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    throw new Error("R2 credentials not fully configured")
  }
  
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
  }
}

// Generate AWS Signature Version 4 for R2
function signRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string | Buffer
): Record<string, string> {
  const config = getR2Config()
  const urlObj = new URL(url)
  const host = urlObj.host
  const path = urlObj.pathname + urlObj.search
  
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  
  // This is a simplified version - for production, use AWS SDK or a proper signing library
  // For now, let's use the AWS SDK but with a workaround
  return headers
}

// Use this as a fallback if AWS SDK continues to fail
export async function uploadToR2WithFetch(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const config = getR2Config()
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
  const url = `${endpoint}/${config.bucketName}/${key}`
  
  // Note: This requires proper AWS signature which is complex
  // For now, we'll stick with trying to fix the AWS SDK SSL issue
  throw new Error("Direct fetch upload not yet implemented - use AWS SDK")
}
