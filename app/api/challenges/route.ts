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
      console.error('Error fetching challenge:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!challenge) {
      return NextResponse.json({ challenge: null, message: 'No active challenge' })
    }

    return NextResponse.json({ challenge })
  } catch (error: any) {
    console.error('Challenge fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
