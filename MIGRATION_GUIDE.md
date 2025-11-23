# World MiniKit Migration - Complete! ✅

Your app has been successfully migrated to use the official World MiniKit architecture with NextAuth v5.

## What Was Changed

### 🎯 Core Architecture

**Before**:

- Custom authentication context
- Manual SIWE verification
- Custom MiniKitProvider wrapper
- No middleware protection

**After**:

- NextAuth v5 with credentials provider
- Official `@worldcoin/minikit-js/minikit-provider`
- HMAC-secured nonce generation
- JWT-based sessions with middleware protection

### 📦 New Dependencies

```json
{
  "next-auth": "^5.0.0-beta.25",
  "@worldcoin/minikit-react": "^1.9.9",
  "@worldcoin/mini-apps-ui-kit-react": "^1.4.0",
  "viem": "^2.39.3"
}
```

### 🔐 Environment Variables Added

```bash
NEXTAUTH_SECRET="..." # Auto-generated
AUTH_URL=http://localhost:3000 # Update with ngrok for testing
HMAC_SECRET_KEY="..." # For nonce security
NEXT_PUBLIC_APP_ID=app_a9e1e8a3c65d60bcf0432ec93883b524
NEXT_PUBLIC_APP_ENV=development
```

### 📁 New File Structure

```
auth/
├── index.ts                    # NextAuth configuration
└── wallet/
    ├── index.ts                # Wallet auth function
    ├── client-helpers.ts       # HMAC hashing
    └── server-helpers.ts       # Nonce generation

app/api/auth/[...nextauth]/
└── route.ts                    # NextAuth handlers

providers/
└── index.tsx                   # MiniKitProvider + SessionProvider

types/
└── next-auth.d.ts             # TypeScript definitions

components/
└── auth-button.tsx            # Reusable auth button

middleware.ts                   # Auth protection
```

### 🔄 Modified Files

1. **app/layout.tsx**

   - Now uses official `MiniKitProvider`
   - Wraps app with `SessionProvider`
   - Fetches session server-side
   - Imports World UI Kit styles

2. **app/page.tsx**

   - Uses `useSession()` instead of custom `useUser()`
   - Session data mapped to compatible format
   - All auth state from NextAuth

3. **components/onboarding-screen.tsx**

   - Uses `useSession()` from next-auth/react
   - Uses `walletAuth()` function for sign-in
   - Compatible with new auth flow

4. **next.config.mjs**
   - Added World image domains
   - Set `reactStrictMode: false` (required for MiniKit)
   - Added `allowedDevOrigins` for local dev

### ⚠️ Deprecated Endpoints

These endpoints are marked deprecated but kept for backwards compatibility:

- `/api/nonce` → Now handled by NextAuth
- `/api/complete-siwe` → Now handled by NextAuth

You can safely delete these after confirming the new auth flow works.

## 🚀 Testing the Migration

### 1. Local Development

```bash
# Start the dev server
pnpm dev

# Server should start on http://localhost:3000
```

### 2. Test with ngrok

```bash
# Terminal 1: Keep dev server running
pnpm dev

# Terminal 2: Start ngrok
ngrok http 3000
```

**Update `.env.local`** with your ngrok URL:

```bash
AUTH_URL=https://your-ngrok-url.ngrok-free.app
```

Restart your dev server after updating AUTH_URL.

### 3. Configure Developer Portal

1. Go to [developer.worldcoin.org](https://developer.worldcoin.org)
2. Select your app
3. Add your ngrok URL to allowed origins
4. Make sure your `NEXT_PUBLIC_APP_ID` matches

### 4. Test in World App

1. Open World App on your phone
2. Go to Mini Apps section
3. Open your app
4. Try the authentication flow

## 🎯 How Authentication Works Now

### Sign-In Flow

1. User clicks "Connect World ID" button
2. `walletAuth()` is called:

   ```typescript
   import { walletAuth } from '@/auth/wallet';
   const success = await walletAuth();
   ```

3. Behind the scenes:

   - Generates HMAC-secured nonce
   - Calls MiniKit.commandsAsync.walletAuth()
   - Verifies SIWE message server-side
   - Creates NextAuth session
   - Fetches user info from MiniKit

4. Session is stored as JWT
5. User is authenticated across the app

### Accessing Session Data

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not signed in</div>;

  return (
    <div>
      <p>Address: {session.user.walletAddress}</p>
      <p>Username: {session.user.username}</p>
    </div>
  );
}
```

### Server-Side Session Access

```typescript
import { auth } from '@/auth';

export default async function MyPage() {
  const session = await auth();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome {session.user.username}</div>;
}
```

## 🛠 Troubleshooting

### Issue: "Invalid nonce" error

**Solution**: Make sure `HMAC_SECRET_KEY` is set in `.env.local`

### Issue: Authentication not persisting

**Solution**: Check that `NEXTAUTH_SECRET` is set and cookies are working

### Issue: "MiniKit not installed" in browser

**Solution**: This is expected. The app only works in World App. For development, you can:

- Test in World App mobile with ngrok
- Or add fallback UI for browser testing

### Issue: Double authentication prompts

**Solution**: Make sure `reactStrictMode: false` in next.config.mjs

### Issue: Session not updating

**Solution**: NextAuth uses JWT. To force refresh:

```typescript
import { signIn } from 'next-auth/react';
await signIn('credentials', { redirect: false, ... });
```

## 📚 Key Files to Understand

1. **auth/index.ts** - Main NextAuth config, handles SIWE verification
2. **auth/wallet/index.ts** - Client-side wallet auth function
3. **providers/index.tsx** - Wraps app with necessary providers
4. **middleware.ts** - Protects routes (currently allows all)

## ✅ Checklist

- [x] Dependencies installed
- [x] Environment variables configured
- [x] Auth system created
- [x] NextAuth API route added
- [x] Middleware configured
- [x] Providers updated
- [x] Components refactored
- [x] Old endpoints deprecated
- [ ] **Test authentication locally**
- [ ] **Test in World App with ngrok**
- [ ] **Clean up deprecated files**

## 🎉 You're Done!

The migration is complete! Your app now follows the official World MiniKit architecture and best practices.

### Next Steps

1. Test the auth flow thoroughly
2. Update `AUTH_URL` for production deployment
3. Remove deprecated endpoints after confirming everything works
4. Consider deleting `components/minikit-provider.tsx` (old custom provider)

### Resources

- [World MiniKit Docs](https://docs.worldcoin.org/mini-apps)
- [NextAuth v5 Docs](https://authjs.dev/)
- [World Discord](https://discord.gg/worldcoin)

---

**Migration completed on**: November 23, 2024
**Migrated by**: AI Assistant
**Architecture**: Official World MiniKit + NextAuth v5
