import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    console.log('[API] Fetching rank for wallet:', walletAddress);

    // Get user's WLD earned
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('total_wld_earned')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      console.error('[API] User not found:', userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userWld = user.total_wld_earned || 0;

    // Count how many users have more WLD than this user
    const { count, error: rankError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_wld_earned', userWld);

    if (rankError) {
      console.error('[API] Error calculating rank:', rankError);
      return NextResponse.json(
        { error: "Failed to calculate rank" },
        { status: 500 }
      );
    }

    // Rank is count + 1 (1-indexed)
    const rank = (count || 0) + 1;

    console.log('[API] User rank calculated:', {
      walletAddress,
      userWld,
      usersAhead: count,
      rank
    });

    return NextResponse.json({
      rank,
      wld: userWld,
      usersAhead: count
    });

  } catch (error: any) {
    console.error('[API] Error in user rank endpoint:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
