# World Mini App - Quick Setup

Convert your Next.js app into a World mini app with these code snippets.

## 1. Install Dependencies

```bash
npm install @worldcoin/minikit-js @worldcoin/minikit-react @worldcoin/mini-apps-ui-kit-react next-auth@^5.0.0-beta.25 viem
```

## 2. Environment Variables

Create `.env.local`:

```bash
NEXTAUTH_SECRET=your-secret-here          # npx auth secret
AUTH_URL=http://localhost:3000            # or ngrok URL
HMAC_SECRET_KEY=your-hmac-secret          # openssl rand -hex 32
NEXT_PUBLIC_APP_ID=app_staging_xxxxx      # from developer.worldcoin.org
NEXT_PUBLIC_APP_ENV=development
```

## 3. Config Files

**next.config.ts**

```typescript
const nextConfig = {
  images: { domains: ['static.usernames.app-backend.toolsforhumanity.com'] },
  allowedDevOrigins: ['*'], // Change to your domain in production
  reactStrictMode: false
};
export default nextConfig;
```

**middleware.ts**

```typescript
export { auth as middleware } from '@/auth';
```

## 4. Auth Setup

**src/auth/index.ts**

```typescript
import { hashNonce } from '@/auth/wallet/client-helpers';
import { MiniAppWalletAuthSuccessPayload, MiniKit, verifySiweMessage } from '@worldcoin/minikit-js';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        nonce: { type: 'text' },
        signedNonce: { type: 'text' },
        finalPayloadJson: { type: 'text' }
      },
      authorize: async ({ nonce, signedNonce, finalPayloadJson }) => {
        const expectedSignedNonce = hashNonce({ nonce });
        if (signedNonce !== expectedSignedNonce) return null;

        const finalPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);
        if (!result.isValid) return null;

        const userInfo = await MiniKit.getUserInfo(finalPayload.address);
        return { id: finalPayload.address, ...userInfo };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.walletAddress = token.walletAddress;
        session.user.username = token.username;
        session.user.profilePictureUrl = token.profilePictureUrl;
      }
      return session;
    }
  }
});
```

**src/auth/wallet/client-helpers.ts**

```typescript
import crypto from 'crypto';

export const hashNonce = ({ nonce }: { nonce: string }) => {
  const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET_KEY!);
  hmac.update(nonce);
  return hmac.digest('hex');
};
```

**src/auth/wallet/server-helpers.ts**

```typescript
'use server';
import crypto from 'crypto';
import { hashNonce } from './client-helpers';

export const getNewNonces = async () => {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const signedNonce = hashNonce({ nonce });
  return { nonce, signedNonce };
};
```

**src/auth/wallet/index.ts**

```typescript
import { MiniKit } from '@worldcoin/minikit-js';
import { signIn } from 'next-auth/react';
import { getNewNonces } from './server-helpers';

export const walletAuth = async () => {
  const { nonce, signedNonce } = await getNewNonces();

  const result = await MiniKit.commandsAsync.walletAuth({
    nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`
  });

  if (result.finalPayload.status !== 'success') return;

  await signIn('credentials', {
    redirectTo: '/home',
    nonce,
    signedNonce,
    finalPayloadJson: JSON.stringify(result.finalPayload)
  });
};
```

**src/app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

## 5. MiniKit Provider

**src/providers/index.tsx**

```typescript
'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { SessionProvider } from 'next-auth/react';

export default function ClientProviders({ children, session }) {
  return (
    <MiniKitProvider>
      <SessionProvider session={session}>{children}</SessionProvider>
    </MiniKitProvider>
  );
}
```

**src/app/layout.tsx**

```typescript
import { auth } from '@/auth';
import ClientProviders from '@/providers';
import '@worldcoin/mini-apps-ui-kit-react/styles.css';

export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

## 6. Auth Button Component

**src/components/AuthButton.tsx**

```typescript
'use client';
import { walletAuth } from '@/auth/wallet';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';

export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) return;
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Auth error', error);
    }
    setIsPending(false);
  }, [isInstalled, isPending]);

  return (
    <Button onClick={onClick} disabled={isPending}>
      Login with Wallet
    </Button>
  );
};
```

## 7. Payment Feature

**src/app/api/initiate-payment/route.ts**

```typescript
import { NextResponse } from 'next/server';

export async function POST() {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  // Store uuid in your database to verify payment later
  return NextResponse.json({ id: uuid });
}
```

**src/components/Pay.tsx**

```typescript
'use client';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';

export const Pay = () => {
  const onClickPay = async () => {
    const res = await fetch('/api/initiate-payment', { method: 'POST' });
    const { id } = await res.json();

    const result = await MiniKit.commandsAsync.pay({
      reference: id,
      to: '0x...', // recipient address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(0.5, Tokens.WLD).toString()
        }
      ],
      description: 'Payment description'
    });

    if (result.finalPayload.status === 'success') {
      console.log('Payment successful');
      // Verify on-chain using reference id
    }
  };

  return <Button onClick={onClickPay}>Pay</Button>;
};
```

## 8. World ID Verification

**src/app/api/verify-proof/route.ts**

```typescript
import { verifyCloudProof } from '@worldcoin/minikit-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { payload, action, signal } = await req.json();
  const app_id = process.env.NEXT_PUBLIC_APP_ID;

  const verifyRes = await verifyCloudProof(payload, app_id, action, signal);

  if (verifyRes.success) {
    // User verified - update database
    return NextResponse.json({ verifyRes, status: 200 });
  }
  return NextResponse.json({ verifyRes, status: 400 });
}
```

**src/components/Verify.tsx**

```typescript
'use client';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';

export const Verify = () => {
  const onClickVerify = async () => {
    const result = await MiniKit.commandsAsync.verify({
      action: 'test-action', // Create in developer portal
      verification_level: VerificationLevel.Device
    });

    const response = await fetch('/api/verify-proof', {
      method: 'POST',
      body: JSON.stringify({ payload: result.finalPayload, action: 'test-action' })
    });

    const data = await response.json();
    if (data.verifyRes.success) {
      console.log('Verified!');
    }
  };

  return <Button onClick={onClickVerify}>Verify</Button>;
};
```

## 9. Smart Contract Transactions

**src/components/Transaction.tsx**

```typescript
'use client';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

export const Transaction = () => {
  const [transactionId, setTransactionId] = useState('');

  const client = createPublicClient({
    chain: worldchain,
    transport: http()
  });

  const { isConfirmed } = useWaitForTransactionReceipt({
    client,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID },
    transactionId
  });

  const onClickSendTx = async () => {
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: '0x...', // contract address
          abi: YourContractABI,
          functionName: 'yourFunction',
          args: []
        }
      ]
    });

    if (finalPayload.status === 'success') {
      setTransactionId(finalPayload.transaction_id);
    }
  };

  return <Button onClick={onClickSendTx}>Send Transaction</Button>;
};
```

## 10. Testing

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000
```

1. Copy ngrok URL (e.g., `https://abc123.ngrok-free.app`)
2. Update `AUTH_URL` in `.env.local` with ngrok URL
3. Add ngrok URL to [developer.worldcoin.org](https://developer.worldcoin.org)
4. Restart dev server
5. Open World App → Mini Apps → Your App

## Developer Portal Setup

1. Create app at [developer.worldcoin.org](https://developer.worldcoin.org)
2. Add ngrok URL to app settings
3. Create Incognito Action: `test-action`
4. Add contract addresses to **Configuration → Advanced**:
   - Contract Entrypoints
   - Permit2 Tokens

## Notes

- Import UI components: `@worldcoin/mini-apps-ui-kit-react`
- All MiniKit commands are in `MiniKit.commandsAsync`
- Always verify proofs server-side
- Verify payments on-chain using reference ID
- Use `reactStrictMode: false` to avoid double-mounting

## Resources

- [Docs](https://docs.worldcoin.org/mini-apps)
- [Discord](https://discord.gg/worldcoin)
- [Detailed Guide](./DETAILED_GUIDE.md)
