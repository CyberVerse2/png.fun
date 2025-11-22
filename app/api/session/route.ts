import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Check if user exists based on World ID nullifier
// This persists across sessions since World ID verification is permanent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worldIdNullifier } = body;

    if (!worldIdNullifier) {
      return NextResponse.json({ authenticated: false, onboardingCompleted: false });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, wallet_address, username, profile_picture_url, onboarding_completed, notifications_enabled, world_id_verified'
      )
      .eq('world_id_nullifier', worldIdNullifier)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, onboardingCompleted: false });
    }

    return NextResponse.json({
      authenticated: true,
      onboardingCompleted: user.onboarding_completed || false,
      notificationsEnabled: user.notifications_enabled || false,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        profilePictureUrl: user.profile_picture_url
      }
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, onboardingCompleted: false });
  }
}
