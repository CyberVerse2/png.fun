import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from "@worldcoin/minikit-js"
import { supabaseAdmin } from "@/lib/supabase"

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
      
      // Create or update user in Supabase
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', payload.address)
        .single()

      if (existingUser) {
        // Update existing user
        await supabaseAdmin
          .from('users')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('wallet_address', payload.address)
      } else {
        // Create new user
        await supabaseAdmin
          .from('users')
          .insert({
            wallet_address: payload.address,
            username: null, // Will be populated from MiniKit
            profile_picture_url: null,
          })
      }
      
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
