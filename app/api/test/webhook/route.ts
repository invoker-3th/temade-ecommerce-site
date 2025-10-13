import { NextRequest, NextResponse } from "next/server"

// Test endpoint to verify webhook configuration
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: {
      host: request.headers.get('host'),
      'user-agent': request.headers.get('user-agent')
    }
  })
}

// Test webhook with mock data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the test webhook
    console.log("Test webhook received:", body)
    
    return NextResponse.json({
      message: "Test webhook received successfully",
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to process test webhook",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}