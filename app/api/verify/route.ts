import { NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js"

export async function GET() {
  // In a real app, you should generate a unique nonce and store it
  const nonce = crypto.randomUUID().replace(/-/g, "")
  return NextResponse.json({ nonce })
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = await req.json()

  // In a real app, you would verify the proof with World ID API
  // For this demo/staging environment, we'll simulate a successful verification
  // if the payload structure looks correct.

  // NOTE: You need to set these environment variables for real verification
  // const app_id = process.env.APP_ID
  // const action = process.env.ACTION

  // const verifyRes = await verifyCloudProof(payload, app_id, action, nonce)

  // Mock success for now
  const mockSuccess = true

  if (mockSuccess) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: "Verification failed" })
  }
}
