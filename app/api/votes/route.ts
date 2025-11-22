import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface VoteRequest {
  submissionId: string
  voterId: string
  wldAmount: number
}

export async function POST(req: NextRequest) {
  try {
    const { submissionId, voterId, wldAmount } = (await req.json()) as VoteRequest

    if (!submissionId || !voterId || !wldAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (wldAmount <= 0) {
      return NextResponse.json(
        { error: "WLD amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Create vote in database
    const { data: vote, error } = await supabaseAdmin
      .from('votes')
      .insert({
        submission_id: submissionId,
        voter_id: voterId,
        wld_amount: wldAmount,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "You have already voted on this submission" },
          { status: 409 }
        )
      }
      console.error('Error creating vote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ vote })
  } catch (error: any) {
    console.error('Vote creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const voterId = searchParams.get('voterId')
    const submissionId = searchParams.get('submissionId')

    let query = supabaseAdmin.from('votes').select('*')

    if (voterId) {
      query = query.eq('voter_id', voterId)
    }

    if (submissionId) {
      query = query.eq('submission_id', submissionId)
    }

    const { data: votes, error } = await query

    if (error) {
      console.error('Error fetching votes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ votes })
  } catch (error: any) {
    console.error('Votes fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
