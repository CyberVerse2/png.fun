import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface VoteRequest {
  submissionId: string
  voterId: string
  wldAmount: number
}

export async function POST(req: NextRequest) {
  console.log('[API] Creating vote...')
  
  try {
    const { submissionId, voterId, wldAmount } = (await req.json()) as VoteRequest
    console.log('[API] Vote request:', { submissionId, voterId, wldAmount })

    if (!submissionId || !voterId || !wldAmount) {
      console.error('[API] Missing required fields')
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (wldAmount <= 0) {
      console.error('[API] Invalid WLD amount:', wldAmount)
      return NextResponse.json(
        { error: "WLD amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Create vote in database
    console.log('[API] Inserting vote into database...')
    const { data: vote, error } = await supabaseAdmin
      .from('votes')
      .insert({
        submission_id: submissionId,
        voter_id: voterId,
        wld_amount: wldAmount,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        console.warn('[API] Duplicate vote attempt:', { submissionId, voterId })
        return NextResponse.json(
          { error: "You have already voted on this submission" },
          { status: 409 }
        )
      }
      console.error('[API] Error creating vote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API] Vote created successfully:', vote.id)
    return NextResponse.json({ vote })
  } catch (error: any) {
    console.error('[API] Vote creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  console.log('[API] Fetching votes...')
  
  try {
    const { searchParams } = new URL(req.url)
    const voterId = searchParams.get('voterId')
    const submissionId = searchParams.get('submissionId')
    console.log('[API] Query params:', { voterId, submissionId })

    let query = supabaseAdmin.from('votes').select('*')

    if (voterId) {
      query = query.eq('voter_id', voterId)
    }

    if (submissionId) {
      query = query.eq('submission_id', submissionId)
    }

    const { data: votes, error } = await query

    if (error) {
      console.error('[API] Error fetching votes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API] Found', votes?.length || 0, 'votes')
    return NextResponse.json({ votes })
  } catch (error: any) {
    console.error('[API] Votes fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
