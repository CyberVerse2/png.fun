import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const {
      walletAddress,
      onboardingCompleted,
      notificationsEnabled,
      username,
      profilePictureUrl
    } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[API] Updating user status:', {
      walletAddress,
      onboardingCompleted,
      notificationsEnabled,
      username,
      profilePictureUrl
    });

    const updates: any = {
      wallet_address: walletAddress, // Required for upsert to identify/create the row
      updated_at: new Date().toISOString()
    };

    if (onboardingCompleted !== undefined) updates.onboarding_completed = onboardingCompleted;
    if (notificationsEnabled !== undefined) updates.notifications_enabled = notificationsEnabled;
    if (username !== undefined) updates.username = username;
    if (profilePictureUrl !== undefined) updates.profile_picture_url = profilePictureUrl;

    // Use upsert instead of update to handle cases where user doesn't exist yet
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(updates, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating user status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] User status updated successfully:', data);
    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('[API] Error in user status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
