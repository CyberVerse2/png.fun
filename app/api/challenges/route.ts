import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  
  try {
    const now = new Date()

    // Get active challenge (current day's challenge)
    const { data: challenge, error } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .lte('start_time', now.toISOString())
      .gte('end_time', now.toISOString())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!challenge) {
      return NextResponse.json({ challenge: null, message: 'No active challenge' })
    }


    // Calculate prize pool from total WLD voted on all submissions
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('total_wld_voted')
      .eq('challenge_id', challenge.id)

    if (submissionsError) {
    }

    const prizePool = submissions?.reduce((sum: number, sub: any) => sum + (sub.total_wld_voted || 0), 0) || 0

    const response = { 
      challenge: {
        ...challenge,
        prize_pool: prizePool
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
