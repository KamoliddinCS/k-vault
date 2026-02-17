import { NextResponse } from "next/server"
import https from "https"
import { getR2Client, getBucketName } from "@/lib/r2"

// Test endpoint to verify SSL/TLS connectivity to R2
export async function GET() {
  const diagnostics: any = {
    nodeVersion: process.version,
    nodeMajorVersion: parseInt(process.version.slice(1).split('.')[0]),
    tlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED || "default (1)",
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  }

  // Test 1: Check Node.js version
  const nodeMajorVersion = parseInt(process.version.slice(1).split('.')[0])
  if (nodeMajorVersion < 16) {
    diagnostics.nodeVersionWarning = `Node.js ${process.version} may have SSL/TLS issues. Upgrade to Node.js 18+ recommended.`
  } else if (nodeMajorVersion >= 23) {
    diagnostics.nodeVersionWarning = `Node.js ${process.version} is very new and may have compatibility issues with AWS SDK. Consider using Node.js 18 or 20.`
  }

  // Test 2: Test direct HTTPS connection to R2 endpoint
  const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const endpointUrl = new URL(endpoint)
  
  return new Promise((resolve) => {
    const options = {
      hostname: endpointUrl.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
    }

    const req = https.request(options, (res) => {
      diagnostics.httpsConnection = {
        success: true,
        statusCode: res.statusCode,
        headers: res.headers,
        message: "HTTPS connection to R2 endpoint successful",
      }
      
      // Test 3: Try R2 SDK connection
      testR2SDKConnection().then((sdkResult) => {
        diagnostics.sdkConnection = sdkResult
        resolve(NextResponse.json({
          success: true,
          message: "SSL/TLS diagnostics completed",
          diagnostics,
        }))
      }).catch((error) => {
        diagnostics.sdkConnection = {
          success: false,
          error: error.message,
        }
        resolve(NextResponse.json({
          success: false,
          message: "SSL/TLS diagnostics completed with errors",
          diagnostics,
        }, { status: 500 }))
      })
    })

    req.on('error', (error: any) => {
      diagnostics.httpsConnection = {
        success: false,
        error: error.message,
        code: error.code,
        message: "HTTPS connection to R2 endpoint failed",
      }
      
      // Still try SDK connection
      testR2SDKConnection().then((sdkResult) => {
        diagnostics.sdkConnection = sdkResult
        resolve(NextResponse.json({
          success: false,
          message: "HTTPS connection failed, but SDK test attempted",
          diagnostics,
        }, { status: 500 }))
      }).catch((sdkError) => {
        diagnostics.sdkConnection = {
          success: false,
          error: sdkError.message,
        }
        resolve(NextResponse.json({
          success: false,
          message: "Both HTTPS and SDK connections failed",
          diagnostics,
        }, { status: 500 }))
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      diagnostics.httpsConnection = {
        success: false,
        error: "Connection timeout",
        message: "HTTPS connection timed out after 10 seconds",
      }
      resolve(NextResponse.json({
        success: false,
        message: "Connection timeout",
        diagnostics,
      }, { status: 500 }))
    })

    req.end()
  })
}

async function testR2SDKConnection() {
  try {
    const r2 = getR2Client()
    const bucketName = getBucketName()
    
    // Try a simple operation
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3")
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    })
    
    await r2.send(command)
    
    return {
      success: true,
      message: "R2 SDK connection successful",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      details: {
        message: error.message,
        name: error.name,
        code: error.code,
      },
    }
  }
}
