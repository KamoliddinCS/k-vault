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

  // Construct endpoint URL
  let endpoint: string
  if (process.env.R2_ENDPOINT) {
    endpoint = process.env.R2_ENDPOINT.trim()
  } else if (process.env.R2_ACCOUNT_ID) {
    endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  } else {
    throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID must be set")
  }

  // Ensure endpoint starts with https://
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    endpoint = `https://${endpoint}`
  }

  // Remove trailing slash if present
  endpoint = endpoint.replace(/\/$/, '')
  
  // Validate endpoint format
  // Should be: https://<account-id>.r2.cloudflarestorage.com
  const endpointPattern = /^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/
  if (!endpointPattern.test(endpoint)) {
    console.warn(`R2_ENDPOINT format may be incorrect: ${endpoint}`)
    console.warn(`Expected format: https://<32-char-account-id>.r2.cloudflarestorage.com`)
  }

  console.log(`R2 Client Configuration:
    Endpoint: ${endpoint}
    Bucket: ${process.env.R2_BUCKET_NAME}
    Account ID: ${process.env.R2_ACCOUNT_ID ? 'Set' : 'Not set'}
    Access Key: ${process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Not set'}
    Secret Key: ${process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}
  `)

  // For Cloudflare R2, try virtual-hosted style first (default)
  // Some users report this works better than path-style for SSL
  // If this doesn't work, set R2_USE_PATH_STYLE=true to use path-style
  const usePathStyle = process.env.R2_USE_PATH_STYLE === 'true'
  
  console.log(`Using ${usePathStyle ? 'path-style' : 'virtual-hosted'} addressing`)
  
  // Log Node.js version for debugging
  const nodeVersion = process.version
  console.log(`Node.js version: ${nodeVersion}`)
  
  // Check Node.js version compatibility
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  if (majorVersion < 16) {
    console.warn(`Node.js version ${nodeVersion} may have SSL/TLS compatibility issues. Consider upgrading to Node.js 18+`)
  }
  
  // Check SSL/TLS configuration
  const tlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED
  if (tlsRejectUnauthorized === '0') {
    console.warn("NODE_TLS_REJECT_UNAUTHORIZED is set to 0 - SSL certificate validation is disabled (not recommended for production)")
  }
  
  // Use default S3Client configuration with explicit SSL settings
  // Note: SSL handshake failures with R2 are often due to Node.js version
  // or environment issues. Try updating Node.js to 18+ if errors persist.
  return new S3Client({
    region: "auto", // Cloudflare R2 doesn't require a specific region
    endpoint: endpoint,
    forcePathStyle: usePathStyle,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // SSL is enabled by default, but we can be explicit
    // Note: sslEnabled is not a valid S3Client option, SSL is always enabled for https endpoints
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
