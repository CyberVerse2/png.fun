import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  // Generate a unique nonce for wallet authentication
  // The nonce must be at least 8 alphanumeric characters
  const nonce = crypto.randomUUID().replace(/-/g, "")
  
  // Store the nonce in a secure cookie
  const cookieStore = await cookies()
  cookieStore.set("siwe", nonce, { secure: true, httpOnly: true })
  
  return NextResponse.json({ nonce })
}
