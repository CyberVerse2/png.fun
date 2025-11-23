'use server';
import { hashNonce } from './client-helpers';

export const getNewNonces = async () => {
  console.log('[Auth] [Nonce Generation] Starting nonce generation...');
  const nonce = crypto.randomUUID().replace(/-/g, '');
  console.log('[Auth] [Nonce Generation] Generated nonce:', nonce.substring(0, 8) + '...');

  const signedNonce = await hashNonce({ nonce });
  console.log(
    '[Auth] [Nonce Generation] Generated signed nonce:',
    signedNonce.substring(0, 16) + '...'
  );
  console.log('[Auth] [Nonce Generation] Nonce generation complete');

  return { nonce, signedNonce };
};
