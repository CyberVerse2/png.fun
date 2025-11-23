import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * @deprecated This endpoint is deprecated. Authentication now handled by NextAuth.
 * See /auth/wallet/server-helpers.ts for nonce generation.
 * Kept for backwards compatibility during migration.
 */
export async function GET() {
  // Generate a unique nonce for wallet authentication
  // The nonce must be at least 8 alphanumeric characters
  const nonce = crypto.randomUUID().replace(/-/g, '');

  console.log('[API] Generated nonce:', nonce);

  // Store the nonce in a secure cookie with 10 minute expiry
  const cookieStore = await cookies();
  cookieStore.set('siwe', nonce, {
    secure: true,
    httpOnly: true,
    maxAge: 600, // 10 minutes - plenty of time for user to complete auth
    sameSite: 'lax'
  });

  console.log('[API] Nonce stored in cookie');
  return NextResponse.json({ nonce });
}
