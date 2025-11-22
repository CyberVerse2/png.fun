# Double Nonce Generation - Root Cause and Fix

## 🔴 Problem Identified

Looking at the logs, `/api/nonce` was being called **TWICE**:

```
Line 994: Generated nonce: 5bb90d95de9345af96eb6cf035075d58  // FIRST call
Line 997: Generated nonce: b7c591971af84b369b1a7849ce8a2c9b  // SECOND call (overwrites)
```

This caused:

1. First nonce `5bb90...` generated and stored in cookie
2. Second nonce `b7c59...` generated and **overwrites** cookie
3. MiniKit signs message with first nonce `5bb90...` (embedded in SIWE payload)
4. Backend tries to verify with second nonce `b7c59...` from cookie
5. **MISMATCH!** ❌

## 🔍 Root Cause

**Auto-authentication on onboarding mount** was calling `authenticate()` twice:

### Location 1: Auto-authenticate (useEffect)

`components/onboarding-screen.tsx` lines 60-71

```typescript
const autoAuthenticate = async () => {
  if (!isAuthenticated && MiniKit.isInstalled()) {
    console.log('[Onboarding] Not authenticated, triggering auto-login on mount...');
    const success = await authenticate(); // ❌ FIRST CALL
    // ...
  }
};
autoAuthenticate();
```

### Location 2: Manual authenticate (handleGetStarted)

`components/onboarding-screen.tsx` lines 75-87

```typescript
const handleGetStarted = async () => {
  if (!isAuthenticated) {
    console.log('[Onboarding] User not authenticated, triggering login...');
    const success = await authenticate(); // ❌ SECOND CALL
    // ...
  }
};
```

### The Flow That Caused Double Call

1. User opens app → Onboarding screen mounts
2. `useEffect` runs → calls `autoAuthenticate()` → calls `/api/nonce` (first nonce)
3. User clicks "Get Started" button
4. `handleGetStarted` runs → calls `authenticate()` again → calls `/api/nonce` (second nonce)
5. MiniKit auth modal opens with **second** nonce
6. BUT the SIWE message was prepared with **first** nonce
7. Verification fails because nonces don't match

## ✅ The Fix

**Removed auto-authentication on mount**

```typescript
// Before:
React.useEffect(() => {
  console.log('[Onboarding] Component mounted/updated...');

  const autoAuthenticate = async () => {
    if (!isAuthenticated && MiniKit.isInstalled()) {
      const success = await authenticate(); // ❌ Causes double call
    }
  };
  autoAuthenticate();
}, [isAuthenticated]);

// After:
React.useEffect(() => {
  console.log('[Onboarding] Component mounted/updated...');
  // Note: Removed auto-authentication to prevent double nonce generation
  // User should explicitly trigger authentication by clicking button
}, [isAuthenticated]);
```

Now `authenticate()` is only called once - when the user explicitly clicks a button.

## 📋 Testing

After this fix, you should see:

```
[API] Generated nonce: abc123...  // Only ONE nonce generated
[MiniKitProvider] Received nonce: abc123...
[MiniKitProvider] Starting wallet auth with nonce: abc123...
[MiniKitProvider] Wallet auth completed, status: success
[MiniKitProvider] Verifying with backend, using nonce: abc123...
[API] Nonce comparison: { storedNonce: abc123..., receivedNonce: abc123..., match: true }
✅ [API] SIWE verification successful
```

**NO second nonce should be generated!**

## 🎯 Why Auto-Authentication Was Added

The auto-authentication was originally added to show the sign-in modal immediately when the onboarding screen appeared. However, this created the double-call issue.

### Better UX Flow

Instead of auto-triggering on mount:

1. Show onboarding slides
2. User clicks through slides
3. User clicks "Connect World ID" or "Get Started" on last slide
4. THEN trigger authentication (only once)

This gives the user time to see what the app is about before being asked to authenticate.

## 🔄 Related Changes

This works in conjunction with:

1. **localStorage removal** - We no longer persist sessions in localStorage
2. **MiniKit native sessions** - We rely on MiniKit.user for session state
3. **Extended cookie expiry** - Nonce cookie lasts 10 minutes

## 📝 Files Modified

- `components/onboarding-screen.tsx` - Removed auto-authentication logic

## ✅ Expected Behavior Now

### First Time User

1. Open app → See onboarding slides
2. Click through slides (NO auth triggered yet)
3. Click "Connect World ID" on last slide → Auth modal appears
4. Complete auth → Success!

### Returning User (with MiniKit session)

1. Open app → MiniKit.user detected
2. Skip onboarding (already completed)
3. Go straight to app

### Skip Button

1. User clicks "Skip" on early slide
2. Goes to last slide
3. Still needs to click "Connect World ID" to authenticate
4. Single authentication call

## 🎉 Result

**ONE nonce generation, ONE authentication call, NO mismatches!**
