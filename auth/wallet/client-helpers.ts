// Edge Runtime compatible crypto
export const hashNonce = async ({ nonce }: { nonce: string }) => {
  console.log('[Auth] [HMAC] Hashing nonce...', nonce.substring(0, 8) + '...');

  const encoder = new TextEncoder();
  const hmacSecretKey = process.env.HMAC_SECRET_KEY;

  if (!hmacSecretKey) {
    console.error('[Auth] [HMAC] ERROR: HMAC_SECRET_KEY not found in environment variables!');
    throw new Error('HMAC_SECRET_KEY is required');
  }

  console.log('[Auth] [HMAC] HMAC_SECRET_KEY found:', hmacSecretKey ? '✓' : '✗');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(hmacSecretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(nonce));

  // Convert ArrayBuffer to hex string
  const hash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  console.log('[Auth] [HMAC] Nonce hashed successfully:', hash.substring(0, 16) + '...');
  return hash;
};
