# Complete Verification Flow - Sign-In & Notifications

## Overview

The app uses a multi-step verification process to ensure users are authenticated and notifications are properly set up. Here's how it works:

---

## 📋 Table of Contents

1. [Sign-In Verification (SIWE)](#sign-in-verification-siwe)
2. [Notification Verification](#notification-verification)
3. [Onboarding Completion](#onboarding-completion)
4. [Session Persistence](#session-persistence)
5. [Complete Flow Diagram](#complete-flow-diagram)

---

## 1. Sign-In Verification (SIWE)

### Step 1: User Clicks "Connect World ID"

**Location**: `components/onboarding-screen.tsx` → `handleGetStarted()`

```typescript
if (!isAuthenticated) {
  const success = await authenticate(); // Triggers MiniKit authentication
}
```

### Step 2: Generate Nonce

**Location**: `components/minikit-provider.tsx` → `authenticate()`

```typescript
const res = await fetch('/api/nonce');
const { nonce } = await res.json();
```

**Backend**: `app/api/nonce/route.ts`

```typescript
const nonce = crypto.randomUUID().replace(/-/g, '');
cookieStore.set('siwe', nonce, {
  maxAge: 600, // 10 minutes
  httpOnly: true,
  secure: true
});
return NextResponse.json({ nonce });
```

✅ **Verification**: Nonce is stored in HTTP-only cookie

### Step 3: MiniKit Wallet Authentication

**Location**: `components/minikit-provider.tsx`

```typescript
const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
  nonce,
  requestId: '0',
  statement: 'Sign in to PNG.FUN'
});
```

✅ **Verification**: User signs message with their wallet via MiniKit

### Step 4: Backend Verification

**Location**: `app/api/complete-siwe/route.ts`

```typescript
// 1. Verify nonce matches cookie
const storedNonce = cookieStore.get('siwe')?.value;
if (storedNonce !== nonce) {
  return error; // Nonce mismatch
}

// 2. Verify SIWE signature
const validMessage = await verifySiweMessage(payload, nonce);
if (!validMessage.isValid) {
  return error; // Invalid signature
}

// 3. Create/update user in database
const userData = {
  wallet_address: payload.address,
  username: username || null,
  profile_picture_url: profilePictureUrl || null
};
await supabaseAdmin.from('users').upsert(userData);
```

✅ **Verifications**:

1. ✅ Nonce in cookie matches nonce from request
2. ✅ SIWE signature is valid (cryptographically verified)
3. ✅ User record created/updated in database

### Step 5: Frontend Receives Confirmation

**Location**: `components/minikit-provider.tsx`

```typescript
if (verifyData.isValid) {
  setUserData({
    walletAddress: finalPayload.address,
    username: MiniKit.user?.username,
    profilePictureUrl: MiniKit.user?.profilePictureUrl,
    isAuthenticated: true
  });
  return true; // Authentication successful
}
```

✅ **Verification**: Frontend state updated, `isAuthenticated = true`

---

## 2. Notification Verification

### Step 1: Request Permission

**Location**: `components/onboarding-screen.tsx` → `handleGetStarted()`

After successful authentication:

```typescript
const { finalPayload } = await MiniKit.commandsAsync.requestPermission({
  permission: Permission.Notifications
});
```

### Step 2: Handle Response

```typescript
if (finalPayload.status === 'success') {
  setNotificationsEnabled(true);
} else if (finalPayload.error_code === 'already_granted') {
  setNotificationsEnabled(true); // User already granted permission
} else {
  setNotificationsEnabled(false); // User denied or error
  // Still proceed - notifications are optional
}
```

✅ **Verification**: MiniKit confirms notification permission status

### Step 3: Save to Database

**Location**: `app/page.tsx` → `handleOnboardingComplete()`

```typescript
await fetch('/api/user/status', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: user.walletAddress,
    onboardingCompleted: true,
    notificationsEnabled: notificationsEnabled, // ← Saved here
    username: user.username,
    profilePictureUrl: user.profilePictureUrl
  })
});
```

**Backend**: `app/api/user/status/route.ts`

```typescript
const updates = {
  wallet_address: walletAddress,
  onboarding_completed: onboardingCompleted,
  notifications_enabled: notificationsEnabled, // ← Stored in DB
  username: username,
  profile_picture_url: profilePictureUrl
};
await supabaseAdmin.from('users').upsert(updates);
```

✅ **Verification**: Notification status stored in database

### Step 4: Sync on App Load

**Location**: `app/page.tsx` → `fetchUserData()`

Every time the app loads, it syncs notification status:

```typescript
// Get current permission status from MiniKit
const { finalPayload } = await MiniKit.commandsAsync.getPermissions();
const hasNotifications = finalPayload.permissions.notifications;

// Compare with database
if (hasNotifications !== data.notifications_enabled) {
  // Sync to database if different
  await fetch('/api/user/status', {
    body: JSON.stringify({
      walletAddress: user.walletAddress,
      notificationsEnabled: hasNotifications
    })
  });
}
```

✅ **Verification**: Database stays in sync with MiniKit permission state

---

## 3. Onboarding Completion

### Database Fields Checked

When user loads app, we query database:

```typescript
const { data } = await supabase
  .from('users')
  .select('id, world_id_verified, onboarding_completed, notifications_enabled')
  .eq('wallet_address', user.walletAddress)
  .single();
```

### Decision Logic

**Location**: `app/page.tsx` → `fetchUserData()`

```typescript
if (data.onboarding_completed) {
  setShowOnboarding(false); // Go to main app
} else {
  setShowOnboarding(true); // Show onboarding
}
```

✅ **Verification**: `onboarding_completed` flag in database determines if user sees onboarding

---

## 4. Session Persistence

### MiniKit Native Sessions

**Location**: `components/minikit-provider.tsx`

```typescript
// On app load, check if MiniKit has existing session
if (MiniKit.isInstalled() && MiniKit.user?.username) {
  setUserData({
    walletAddress: undefined, // Not available until walletAuth
    username: MiniKit.user.username,
    profilePictureUrl: MiniKit.user.profilePictureUrl,
    isAuthenticated: false // Need wallet auth for full authentication
  });
}
```

✅ **Verification**: MiniKit SDK persists username and profile picture across refreshes

### Database as Source of Truth

**Location**: `app/page.tsx` → `fetchUserData()`

```typescript
// Fetch user data from database
const { data } = await supabase
  .from('users')
  .select(
    'id, world_id_verified, onboarding_completed, notifications_enabled, username, profile_picture_url, total_wld_earned, total_wins'
  )
  .eq('wallet_address', user.walletAddress)
  .single();

// Use database data as authoritative
setUserId(data.id);
setIsWorldIdVerified(data.world_id_verified);
setUserStats({
  wld: data.total_wld_earned,
  wins: data.total_wins
});
```

✅ **Verification**: All user state comes from database on app load

---

## 5. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  USER OPENS APP                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Check MiniKit.user                                     │
│  ├─ Has username? → Restore username/PFP from MiniKit  │
│  └─ No username? → New user, continue to onboarding    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Show Onboarding Slides                                 │
│  (User learns about the app)                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  User Clicks "Connect World ID"                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  AUTHENTICATION FLOW                                    │
│                                                         │
│  1. Frontend: fetch('/api/nonce')                      │
│     ├─ Backend generates random nonce                   │
│     └─ Stores in cookie (10min expiry)                  │
│                                                         │
│  2. Frontend: MiniKit.commandsAsync.walletAuth()       │
│     ├─ User signs message with wallet                   │
│     └─ Returns signed payload                           │
│                                                         │
│  3. Frontend: fetch('/api/complete-siwe')              │
│     ├─ Backend verifies nonce matches cookie            │
│     ├─ Backend verifies SIWE signature                  │
│     ├─ Backend creates/updates user in database         │
│     └─ Returns success                                  │
│                                                         │
│  ✅ User is now authenticated                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  NOTIFICATION PERMISSION                                │
│                                                         │
│  1. Frontend: MiniKit.commandsAsync.requestPermission() │
│     ├─ MiniKit shows permission dialog                  │
│     └─ User approves/denies                             │
│                                                         │
│  2. Frontend: Save result                               │
│     ├─ setNotificationsEnabled(true/false)             │
│     └─ Show success screen                              │
│                                                         │
│  ✅ Notification preference captured                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  User Clicks "Let's Go"                                 │
│  (On success screen)                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SAVE TO DATABASE                                       │
│                                                         │
│  Frontend: fetch('/api/user/status')                   │
│  {                                                      │
│    walletAddress: "0x...",                             │
│    onboardingCompleted: true,    ← Sets this flag     │
│    notificationsEnabled: true/false,                   │
│    username: "user123",                                │
│    profilePictureUrl: "https://..."                    │
│  }                                                      │
│                                                         │
│  Backend: supabaseAdmin.from('users').upsert(...)      │
│                                                         │
│  ✅ Onboarding marked as complete in database          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  MAIN APP                                               │
│  (Vote, Leaderboard, Profile)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PAGE REFRESH / RETURN VISIT                            │
│                                                         │
│  1. Check MiniKit.user → Restore username/PFP          │
│  2. Query database by wallet_address                    │
│  3. Check onboarding_completed flag                     │
│     ├─ true → Go to main app                           │
│     └─ false → Show onboarding again                   │
│                                                         │
│  ✅ User stays logged in, onboarding skipped           │
└─────────────────────────────────────────────────────────┘
```

---

## Verification Checkpoints Summary

### 🔐 Sign-In Verification (5 checks)

1. ✅ Nonce generated and stored securely
2. ✅ Nonce matches between cookie and request
3. ✅ SIWE signature is cryptographically valid
4. ✅ User record created/updated in database
5. ✅ Frontend state updated to `isAuthenticated: true`

### 🔔 Notification Verification (3 checks)

1. ✅ MiniKit permission request completed
2. ✅ Permission status saved to database
3. ✅ Status synced on each app load

### ✅ Onboarding Verification (2 checks)

1. ✅ `onboarding_completed` flag set to `true` in database
2. ✅ Flag checked on every app load to determine if onboarding should show

### 💾 Session Persistence (2 checks)

1. ✅ MiniKit persists username/PFP natively
2. ✅ Database queried on app load to restore full user state

---

## Database Schema

### `users` table fields used for verification:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  profile_picture_url TEXT,
  world_id_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,    ← Tracks onboarding
  notifications_enabled BOOLEAN DEFAULT false,   ← Tracks notifications
  total_wld_earned NUMERIC DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Considerations

### ✅ What's Secure:

1. **Nonce in HTTP-only cookie** - Not accessible to JavaScript (XSS protection)
2. **SIWE signature verification** - Cryptographically proves wallet ownership
3. **10-minute nonce expiry** - Limits replay attack window
4. **Server-side verification** - All checks happen on backend
5. **No localStorage** - No sensitive data exposed to XSS

### ⚠️ Limitations:

1. **MiniKit dependency** - Relies on MiniKit SDK being properly implemented
2. **No session tokens** - Could add JWT for additional security layer
3. **Cookie-based nonce** - Cookies can be cleared by user
4. **No rate limiting** - Could add rate limits on `/api/nonce` endpoint

---

## Troubleshooting

### User Not Staying Signed In

**Check**: Does MiniKit.user persist after refresh?

```typescript
console.log('MiniKit.user:', MiniKit.user);
// Should show { username: "...", profilePictureUrl: "..." }
```

### Notifications Not Saving

**Check**: Is notification status being sent to backend?

```typescript
// Look for this log after onboarding
[API] Updating user status: { notificationsEnabled: true/false }
```

### Onboarding Shows Again After Completion

**Check**: Is `onboarding_completed` flag set in database?

```sql
SELECT onboarding_completed FROM users WHERE wallet_address = '0x...';
-- Should return true after onboarding
```

---

## Summary

The app uses a **multi-layered verification approach**:

1. **Cryptographic verification** (SIWE signature)
2. **Nonce-based replay protection** (HTTP-only cookie)
3. **Database persistence** (source of truth for all user state)
4. **MiniKit native sessions** (SDK handles session lifecycle)
5. **Permission syncing** (keeps database in sync with MiniKit)

All verifications are **server-side** with **cryptographic proofs**, ensuring security and reliability.
