# MiniKit Modals Not Showing - Debug Guide

## Issue

Sign-in and notification modals aren't appearing in World App when buttons are clicked.

---

## Debug Steps

### 1. Check Console Logs

When you click "Connect World ID", you should see this sequence:

```
[Onboarding] handleGetStarted triggered
[Onboarding] User not authenticated, triggering login...
[MiniKitProvider] Fetching nonce...
[MiniKitProvider] Received nonce: xxx
[MiniKitProvider] Starting wallet auth with nonce: xxx
[MiniKitProvider] MiniKit.isInstalled(): true  ← Must be true!
[MiniKitProvider] About to call MiniKit.commandsAsync.walletAuth...
```

**If it stops here** → Modal should be showing. If not, there's an issue with MiniKit SDK.

**If you see this:**

```
[MiniKitProvider] walletAuth returned: { ... }
[MiniKitProvider] Wallet auth completed, status: ...
```

Then the modal did show and user completed/cancelled it.

### 2. Common Issues

#### Issue A: `MiniKit.isInstalled(): false`

**Cause**: Not actually in World App
**Fix**:

- Make sure you're testing in World App, not browser
- Check app URL is correct in World App settings
- Try closing and reopening the app in World App

#### Issue B: No logs after "About to call..."

**Cause**: MiniKit command is hanging or erroring silently
**Fix**:

- Check if app_id is correct: `app_a9e1e8a3c65d60bcf0432ec93883b524`
- Try updating MiniKit SDK: `npm update @worldcoin/minikit-js`
- Check World App is latest version

#### Issue C: Returns immediately with error status

**Cause**: MiniKit rejected the command
**Fix**: Check the error in `finalPayload`:

```
[MiniKitProvider] Wallet auth error: { status: 'error', error_code: '...' }
```

### 3. Verify App ID

Current app ID in code: `app_a9e1e8a3c65d60bcf0432ec93883b524`

**Check**:

1. Is this the correct app ID from your World ID Developer Portal?
2. Is the app approved and published?
3. Is the domain/URL whitelisted in the app settings?

### 4. Check MiniKit SDK Installation

Run these checks in the console (in World App):

```javascript
// Check MiniKit is installed
console.log('MiniKit installed:', MiniKit.isInstalled());

// Check MiniKit object exists
console.log('MiniKit object:', MiniKit);

// Check commands are available
console.log('Commands:', MiniKit.commandsAsync);

// Check current user (if any)
console.log('MiniKit.user:', MiniKit.user);
```

Expected output:

```
MiniKit installed: true
MiniKit object: { ... }
Commands: { walletAuth: [Function], requestPermission: [Function], ... }
MiniKit.user: { username: "...", ... } or undefined
```

### 5. Test Commands Manually

Try calling commands directly from console:

```javascript
// Test wallet auth
MiniKit.commandsAsync
  .walletAuth({
    nonce: 'test123',
    requestId: '0',
    expirationTime: new Date(Date.now() + 86400000),
    notBefore: new Date(Date.now() - 86400000),
    statement: 'Test'
  })
  .then((r) => console.log('Result:', r));
```

Modal should appear. If not, there's an issue with MiniKit SDK or World App.

---

## Possible Causes

### 1. App Not Whitelisted

- URL must match exactly what's in World ID Portal
- Check for http vs https
- Check for trailing slashes
- Check subdomain matches

### 2. Wrong App ID

- Using `app_a9e1e8a3c65d60bcf0432ec93883b524`
- Verify this matches your app in World ID Developer Portal
- If you have multiple apps, make sure you're using the right one

### 3. MiniKit SDK Version Issue

Current version in package.json:

```bash
cat package.json | grep minikit
```

Try updating:

```bash
npm install @worldcoin/minikit-js@latest
```

### 4. Z-Index / CSS Issues

The onboarding screen has `z-50`. MiniKit modals should be higher.

Check in DevTools:

- Look for modal elements in DOM
- Check z-index values
- Check if modals are behind other elements

### 5. Click Handler Not Firing

Verify button click works:

```typescript
// In onboarding-screen.tsx
<NeoButton onClick={() => {
  console.log('BUTTON CLICKED!'); // Add this
  handleNext();
}}>
```

---

## Expected Flow

### Sign-In Modal

**Trigger**: Click "Connect World ID" button on last onboarding slide

**Should see**:

1. MiniKit modal slides up from bottom
2. Shows "Sign in with your wallet"
3. User approves/denies
4. Modal closes
5. Console shows result

**If modal doesn't show**:

- Check `[MiniKitProvider] About to call MiniKit.commandsAsync.walletAuth...` appears in logs
- Check if `walletAuth returned:` appears (if yes, modal showed but closed immediately)
- Check for error status in logs

### Notification Modal

**Trigger**: After successful sign-in, automatically requests permissions

**Should see**:

1. MiniKit modal for notifications
2. "Allow PNG.FUN to send you notifications?"
3. User approves/denies
4. Modal closes
5. Console shows result

**If modal doesn't show**:

- Check `[Onboarding] About to call MiniKit.commandsAsync.requestPermission...` appears
- Check if `requestPermission returned:` appears
- If it proceeds without modal, notifications might be already granted/denied

---

## Quick Fixes to Try

### 1. Hard Refresh

Close World App completely, reopen, try again.

### 2. Clear App Data

In World App settings, clear cache/data for your app.

### 3. Re-add App

Remove app from World App, add it again from Developer Portal.

### 4. Check Network

Make sure device has internet connection. MiniKit commands require network.

### 5. Update World App

Make sure World App is latest version from app store.

---

## If Still Not Working

### Collect Debug Info

Run this in console and share output:

```javascript
console.log('DEBUG INFO:', {
  miniKitInstalled: MiniKit.isInstalled(),
  hasMiniKit: typeof MiniKit !== 'undefined',
  hasCommandsAsync: typeof MiniKit?.commandsAsync !== 'undefined',
  hasWalletAuth: typeof MiniKit?.commandsAsync?.walletAuth === 'function',
  hasRequestPermission: typeof MiniKit?.commandsAsync?.requestPermission === 'function',
  miniKitUser: MiniKit.user,
  userAgent: navigator.userAgent,
  currentUrl: window.location.href
});
```

### Check World ID Portal

1. Go to https://developer.worldcoin.org
2. Find your app
3. Verify:
   - App ID matches code
   - App is published/approved
   - URL is whitelisted
   - App type is correct (Mini App)

---

## Last Resort: Fallback Mode

If MiniKit modals won't show, you can temporarily add mock authentication for testing:

```typescript
// In components/minikit-provider.tsx, authenticate function
if (!MiniKit.isInstalled()) {
  // Mock auth for testing
  console.warn('MOCK AUTH - REMOVE IN PRODUCTION');
  setUserData({
    walletAddress: '0x1234...mock',
    username: 'TestUser',
    profilePictureUrl: '/placeholder.svg',
    isAuthenticated: true,
    isLoading: false
  });
  return true;
}
```

**⚠️ ONLY FOR DEBUGGING - REMOVE BEFORE PRODUCTION**

---

## Contact Support

If none of this works:

1. Check World ID Discord: https://discord.gg/worldcoin
2. Check MiniKit docs: https://docs.worldcoin.org/minikit
3. File issue on GitHub: https://github.com/worldcoin/minikit-js/issues
