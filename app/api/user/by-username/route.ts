import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    console.log('[API] Looking up user by username:', username);

    // Query database for user with this username
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, wallet_address, username, profile_picture_url, onboarding_completed, notifications_enabled'
      )
      .eq('username', username)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no user found

    if (error) {
      console.error('[API] Error querying user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!user) {
      console.log('[API] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[API] User found:', { id: user.id, wallet_address: user.wallet_address });
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('[API] Error in by-username lookup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
