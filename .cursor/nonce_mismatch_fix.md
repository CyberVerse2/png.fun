# Nonce Mismatch Error - Diagnosis and Fix

## Error

```
[API] SIWE verification error: Error: Nonce mismatch.
Got: 952542b2f8234ee4b3a2bdc10b967cb3
Expected: fa5a1b63012c49cf854a9d8d0b05f26b
```

## Root Cause

The nonce stored in the cookie doesn't match the nonce used during authentication. This can happen when:

1. **Multiple nonce requests**: If `/api/nonce` is called twice, the second call overwrites the cookie
2. **Cookie expiration**: Cookie expires before verification completes
3. **Cookie domain/path issues**: Cookie isn't being read back correctly
4. **Race condition**: Authentication completes before nonce cookie is set

## Fixes Applied

### 1. Extended Cookie Expiry

**File**: `app/api/nonce/route.ts`

Changed from no `maxAge` to 10 minutes:

```typescript
cookieStore.set('siwe', nonce, {
  secure: true,
  httpOnly: true,
  maxAge: 600, // 10 minutes - plenty of time for user to complete auth
  sameSite: 'lax'
});
```

**Why**: Gives user enough time to complete MiniKit authentication without cookie expiring.

### 2. Enhanced Logging

**Files**:

- `app/api/nonce/route.ts`
- `app/api/complete-siwe/route.ts`
- `components/minikit-provider.tsx`

Added comprehensive logging to track nonce through entire flow:

```
[API] Generated nonce: xxx
[MiniKitProvider] Received nonce: xxx
[MiniKitProvider] Starting wallet auth with nonce: xxx
[MiniKitProvider] Verifying with backend, using nonce: xxx
[API] Nonce comparison: { storedNonce: xxx, receivedNonce: xxx, match: true/false }
```

**Why**: Makes it easy to identify exactly where the nonce gets lost or changes.

---

## Debugging Steps

When you see this error, check the console logs in this order:

### Step 1: Nonce Generation

```
[API] Generated nonce: abc123...
[API] Nonce stored in cookie
```

✅ Nonce is created and stored

### Step 2: Frontend Receives Nonce

```
[MiniKitProvider] Fetching nonce...
[MiniKitProvider] Received nonce: abc123...
```

✅ Frontend got the same nonce

### Step 3: Wallet Auth Started

```
[MiniKitProvider] Starting wallet auth with nonce: abc123...
```

✅ Using correct nonce for auth

### Step 4: Wallet Auth Completed

```
[MiniKitProvider] Wallet auth completed, status: success
```

✅ MiniKit authentication successful

### Step 5: Backend Verification

```
[MiniKitProvider] Verifying with backend, using nonce: abc123...
[API] SIWE verification request received
[API] Nonce comparison: {
  storedNonce: abc123...,
  receivedNonce: abc123...,
  match: true
}
```

✅ Nonces match, verification succeeds

---

## Common Issues and Solutions

### Issue 1: Nonces Don't Match

**Symptom**:

```
[API] Nonce comparison: {
  storedNonce: xxx,
  receivedNonce: yyy,  // Different!
  match: false
}
```

**Possible Causes**:

1. Multiple authentication attempts without page refresh
2. Browser back/forward during auth
3. Multiple tabs triggering auth simultaneously

**Solution**:

- Refresh page before trying again
- Only have one authentication attempt active at a time
- Clear cookies and retry

### Issue 2: Stored Nonce is Undefined

**Symptom**:

```
[API] Nonce comparison: {
  storedNonce: undefined,
  receivedNonce: abc123...,
  match: false
}
```

**Possible Causes**:

1. Cookie wasn't set properly
2. Cookie domain/path mismatch
3. Cookie expired (should not happen with 10min maxAge)
4. Browser blocking cookies

**Solution**:

- Check browser cookie settings
- Verify cookies are enabled
- Check if running on correct domain (not `localhost` vs `127.0.0.1` mismatch)

### Issue 3: No Nonce Logs

**Symptom**: No `[API] Generated nonce:` log appears

**Possible Causes**:

1. `/api/nonce` endpoint not being called
2. Network error
3. API route not deployed

**Solution**:

- Check Network tab in DevTools
- Verify `/api/nonce` returns 200
- Check if API route file exists

---

## Testing the Fix

### Test 1: Normal Flow

1. Open app (fresh page load)
2. Click "Connect World ID"
3. Complete MiniKit auth
4. Check console logs - should see all steps with matching nonces

**Expected logs**:

```
[API] Generated nonce: xxx
[MiniKitProvider] Received nonce: xxx
[MiniKitProvider] Starting wallet auth with nonce: xxx
[MiniKitProvider] Wallet auth completed, status: success
[MiniKitProvider] Verifying with backend, using nonce: xxx
[API] Nonce comparison: { storedNonce: xxx, receivedNonce: xxx, match: true }
[API] SIWE verification successful
[MiniKitProvider] Authentication successful
```

### Test 2: Multiple Attempts

1. Start authentication
2. Cancel MiniKit auth
3. Try authenticating again
4. Should still work (new nonce generated each time)

### Test 3: Slow Network

1. Throttle network in DevTools (Slow 3G)
2. Start authentication
3. Complete within 10 minutes
4. Should still work (nonce doesn't expire)

---

## Prevention

To prevent nonce mismatches:

1. **Don't call authenticate() multiple times simultaneously**

   - The `useCallback` with empty deps helps with this
   - Each call generates a new nonce, overwriting the cookie

2. **Don't refresh page during auth**

   - New page load = new nonce
   - Old authentication will fail

3. **Complete auth within 10 minutes**

   - Cookie expires after 10 minutes
   - Should be plenty of time for user

4. **One tab at a time**
   - Multiple tabs share cookies
   - Authentication in one tab can interfere with another

---

## If Issue Persists

If you still see nonce mismatches after these fixes, check:

1. **Console logs**: Follow the nonce through each step
2. **Network tab**: Verify `/api/nonce` and `/api/complete-siwe` requests
3. **Cookies**: Check Application tab in DevTools, verify `siwe` cookie exists
4. **Timing**: Is there a long delay between nonce fetch and verification?

### Advanced Debugging

Add this to check cookie in frontend:

```typescript
// In authenticate function, after fetching nonce:
console.log('Document cookies:', document.cookie);
```

If `siwe` cookie is not in `document.cookie`, there's a cookie setting issue.

---

## Related Files

- `app/api/nonce/route.ts` - Generates and stores nonce in cookie
- `app/api/complete-siwe/route.ts` - Verifies nonce and SIWE message
- `components/minikit-provider.tsx` - Orchestrates authentication flow

---

## Summary

✅ **Extended cookie expiry** to 10 minutes
✅ **Added comprehensive logging** to track nonce through flow
✅ **Added sameSite: 'lax'** for better cookie handling

The nonce mismatch should now be resolved. If you still see it, the detailed logs will show exactly where the issue occurs.
