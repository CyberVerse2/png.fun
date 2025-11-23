import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get top users by total WLD earned
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address, username, profile_picture_url, total_wins, current_streak, total_wld_earned, id')
      .order('total_wld_earned', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch latest submission photo for each user
    const usersWithPhotos = await Promise.all(
      (users || []).map(async (user: any) => {
        const { data: submission } = await supabaseAdmin
          .from('submissions')
          .select('photo_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...user,
          latest_photo_url: submission?.photo_url || null
        }
      })
    )

    return NextResponse.json({ leaderboard: usersWithPhotos })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
