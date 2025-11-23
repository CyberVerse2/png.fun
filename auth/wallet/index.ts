import { MiniKit } from '@worldcoin/minikit-js';
import { signIn } from 'next-auth/react';
import { getNewNonces } from './server-helpers';

// Browser-compatible UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
import { log, logError } from '@/lib/logger';

export const walletAuth = async () => {
  // Immediate log - visible in World App via server
  await log('WalletAuth', '🚀 FUNCTION CALLED - Starting wallet authentication flow...');
  console.log('🚀🚀🚀 WALLET AUTH CALLED 🚀🚀🚀');
  console.log('[Auth] [WalletAuth] ========================================');
  console.log('[Auth] [WalletAuth] FUNCTION CALLED - Starting wallet authentication flow...');
  console.log('[Auth] [WalletAuth] Timestamp:', new Date().toISOString());
  console.log('[Auth] [WalletAuth] Environment check:', {
    isClient: typeof window !== 'undefined',
    isServer: typeof window === 'undefined',
    hasMiniKit: typeof MiniKit !== 'undefined',
    windowType: typeof window
  });

  try {
    await log('WalletAuth', 'Checking MiniKit installation...');
    console.log('[Auth] [WalletAuth] Checking MiniKit installation...');
    const isInstalled = MiniKit.isInstalled();
    await log('WalletAuth', 'MiniKit installed check', { isInstalled });
    console.log('[Auth] [WalletAuth] MiniKit installed:', isInstalled);

    if (!isInstalled) {
      await logError('WalletAuth', new Error('MiniKit is not installed'), {
        reason: 'App may not be running in World App or MiniKit SDK not loaded'
      });
      console.error('[Auth] [WalletAuth] ERROR: MiniKit is not installed!');
      console.error('[Auth] [WalletAuth] This usually means:');
      console.error('[Auth] [WalletAuth] 1. App is not running in World App');
      console.error('[Auth] [WalletAuth] 2. MiniKit SDK not loaded');
      console.error('[Auth] [WalletAuth] 3. Running in browser instead of World App');
      console.log('[Auth] [WalletAuth] ========================================');
      return false;
    }

    // Step 1: Generate nonces
    console.log('[Auth] [WalletAuth] Step 1: Generating nonces...');
    const { nonce, signedNonce } = await getNewNonces();
    console.log('[Auth] [WalletAuth] Nonces generated:', {
      nonceLength: nonce.length,
      signedNonceLength: signedNonce.length
    });

    // Step 2: Request wallet signature
    await log('WalletAuth', 'Step 2: Requesting wallet signature from MiniKit...');
    console.log('[Auth] [WalletAuth] Step 2: Requesting wallet signature from MiniKit...');
    const statement = `Authenticate (${generateUUID().replace(/-/g, '')}).`;
    await log('WalletAuth', 'SIWE statement generated', { statement });
    console.log('[Auth] [WalletAuth] SIWE statement:', statement);

    const expirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log('[Auth] [WalletAuth] Auth window:', {
      notBefore: notBefore.toISOString(),
      expirationTime: expirationTime.toISOString()
    });

    const result = await MiniKit.commandsAsync.walletAuth({
      nonce,
      expirationTime,
      notBefore,
      statement
    });

    console.log('[Auth] [WalletAuth] MiniKit response received:', {
      status: result.finalPayload?.status
    });

    if (result.finalPayload.status !== 'success') {
      const errorPayload = result.finalPayload as { status: string; error_code?: string };
      console.error('[Auth] [WalletAuth] Authentication failed:', {
        status: errorPayload.status,
        error: errorPayload.error_code || 'Unknown error'
      });
      console.log('[Auth] [WalletAuth] ========================================');
      return false;
    }

    const successPayload = result.finalPayload as { status: 'success'; address: string };
    console.log('[Auth] [WalletAuth] ✓ Wallet signature successful!');
    console.log('[Auth] [WalletAuth] Wallet address:', successPayload.address);

    // Step 3: Sign in with NextAuth
    console.log('[Auth] [WalletAuth] Step 3: Signing in with NextAuth...');
    console.log('[Auth] [WalletAuth] Sending to NextAuth:', {
      nonceLength: nonce.length,
      signedNonceLength: signedNonce.length,
      finalPayloadSize: JSON.stringify(successPayload).length
    });

    const signInResult = await signIn('credentials', {
      redirect: false,
      nonce,
      signedNonce,
      finalPayloadJson: JSON.stringify(successPayload)
    });

    console.log('[Auth] [WalletAuth] NextAuth signIn result:', signInResult);
    console.log('[Auth] [WalletAuth] ✓ Authentication flow complete!');
    console.log('[Auth] [WalletAuth] ========================================');

    return true;
  } catch (error) {
    await logError('WalletAuth', error, {
      step: 'authentication flow'
    });
    console.error('[Auth] [WalletAuth] ERROR during authentication:', error);
    console.error('[Auth] [WalletAuth] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('[Auth] [WalletAuth] ========================================');
    return false;
  }
};
