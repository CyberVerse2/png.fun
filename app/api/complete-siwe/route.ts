import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from "@worldcoin/minikit-js"

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = (await req.json()) as IRequestPayload
  
  // Verify the nonce matches the one we created
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get("siwe")?.value
  if (!storedNonce || storedNonce !== nonce) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "Invalid nonce",
    }, { status: 400 })
  }
  
  try {
    // Verify the SIWE message signature
    const validMessage = await verifySiweMessage(payload, nonce)
    
    if (validMessage.isValid) {
      // Clear the used nonce
      const cookieStore = await cookies()
      cookieStore.delete("siwe")
      
      // Here you would typically create a session for the user
      // For now, we'll just return success
      return NextResponse.json({
        status: "success",
        isValid: true,
        address: payload.address,
      })
    } else {
      return NextResponse.json({
        status: "error",
        isValid: false,
        message: "Invalid signature",
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error("SIWE verification error:", error)
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message || "Verification failed",
    }, { status: 500 })
  }
}
