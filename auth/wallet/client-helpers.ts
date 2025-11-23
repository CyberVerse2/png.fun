// Use Web Crypto API which works in both Node.js and Edge Runtime
export const hashNonce = async ({ nonce }: { nonce: string }): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(process.env.HMAC_SECRET_KEY!);
  const messageData = encoder.encode(nonce);

  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
