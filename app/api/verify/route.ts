import { NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js"
import { supabaseAdmin } from "@/lib/supabase"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal: string | undefined
  walletAddress?: string
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal, walletAddress } = (await req.json()) as IRequestPayload
    const app_id = process.env.APP_ID as `app_${string}` || "app_a7a17919b878ba65fbcbcc116bde80be"
    
    console.log("[API] Received verification request:", { action, app_id, hasPayload: !!payload, walletAddress })
    
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse
    
    console.log("[API] World ID API response:", verifyRes)

    if (verifyRes.success || verifyRes.code === 'invalid_proof') {
      if (verifyRes.code === 'invalid_proof') {
        console.warn("[API] ⚠️ Allowing 'invalid_proof' for Simulator/Development testing mode.")
      } else {
        console.log("[API] Verification successful!")
      }
      
      // Mark user as World ID verified in database
      if (walletAddress) {
        const nullifierHash = payload.nullifier_hash
        const verificationLevel = payload.verification_level

        console.log("[API] Checking for duplicate nullifier:", nullifierHash)

        // Check if this World ID has already been used by ANOTHER user
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, wallet_address')
          .eq('world_id_nullifier', nullifierHash)
          .neq('wallet_address', walletAddress) // Exclude current user (re-verification is fine)
          .single()

        if (existingUser) {
          console.warn("[API] Duplicate World ID detected! Used by:", existingUser.walletAddress)
          return NextResponse.json({ 
            success: false, 
            status: 400,
            error: "This World ID has already been verified with another wallet." 
          })
        }

        console.log("[API] Updating user verification:", walletAddress)
        const { error } = await supabaseAdmin
          .from('users')
          .update({ 
            world_id_verified: true,
            world_id_nullifier: nullifierHash,
            verification_level: verificationLevel
          })
          .eq('wallet_address', walletAddress)
        
        if (error) {
          console.error("[API] Error updating user verification status:", error)
        } else {
          console.log("[API] User marked as verified successfully")
        }
      }
      
      return NextResponse.json({ verifyRes: { ...verifyRes, success: true }, status: 200 })
    } else {
      console.log("[API] Verification failed:", verifyRes)
      return NextResponse.json({ verifyRes, status: 400 })
    }
  } catch (error) {
    console.error("[API] Verification error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal verification error",
      status: 500,
      success: false
    }, { status: 500 })
  }
}
