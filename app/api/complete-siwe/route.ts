import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js';
import { supabaseAdmin } from '@/lib/supabase';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
  username?: string;
  profilePictureUrl?: string;
}

export async function POST(req: NextRequest) {
  console.log('[API] SIWE verification request received');

  const { payload, nonce, username, profilePictureUrl } = (await req.json()) as IRequestPayload;
  console.log('[API] Request data:', {
    address: payload.address,
    username,
    hasProfilePicture: !!profilePictureUrl,
    receivedNonce: nonce
  });

  // Verify the nonce matches the one we created
  const cookieStore = await cookies();
  const storedNonce = cookieStore.get('siwe')?.value;

  console.log('[API] Nonce comparison:', {
    storedNonce: storedNonce,
    receivedNonce: nonce,
    match: storedNonce === nonce
  });

  if (!storedNonce || storedNonce !== nonce) {
    console.error('[API] Nonce mismatch! Got:', nonce, 'Expected:', storedNonce);
    return NextResponse.json(
      {
        status: 'error',
        isValid: false,
        message: 'Invalid nonce'
      },
      { status: 400 }
    );
  }

  try {
    // Verify the SIWE message signature
    console.log('[API] Verifying SIWE message...');
    const validMessage = await verifySiweMessage(payload, nonce);

    if (validMessage.isValid) {
      console.log('[API] SIWE verification successful');

      // Clear the used nonce
      cookieStore.delete('siwe');

      // Create or update user in Supabase
      console.log('[API] Checking for existing user...');
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', payload.address)
        .single();

      const userData = {
        wallet_address: payload.address,
        username: username || null,
        profile_picture_url: profilePictureUrl || null,
        updated_at: new Date().toISOString()
      };

      if (existingUser) {
        console.log('[API] Updating existing user:', existingUser.id);
        // Update existing user
        await supabaseAdmin.from('users').update(userData).eq('wallet_address', payload.address);
        console.log('[API] User updated successfully');
      } else {
        console.log('[API] Creating new user');
        // Create new user
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (insertError) {
          console.error('[API] Error creating user:', insertError);
        } else {
          console.log('[API] New user created:', newUser.id);
        }
      }

      return NextResponse.json({
        status: 'success',
        isValid: true,
        address: payload.address
      });
    } else {
      console.error('[API] SIWE verification failed');
      return NextResponse.json(
        {
          status: 'error',
          isValid: false,
          message: 'Invalid signature'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[API] SIWE verification error:', error);
    return NextResponse.json(
      {
        status: 'error',
        isValid: false,
        message: error.message || 'Verification failed'
      },
      { status: 500 }
    );
  }
}
