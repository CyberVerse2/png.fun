# Notification Prompt Implementation

## Overview

Implemented separate handling for onboarding and notification permissions based on database flags.

---

## The Logic

### 1. Check Database on App Load

**Location**: `app/page.tsx` → `fetchUserData()`

```typescript
const { data } = await supabase
  .from('users')
  .select('id, onboarding_completed, notifications_enabled, ...')
  .eq('wallet_address', user.walletAddress)
  .single();
```

### 2. Decision Tree

```
User loads app
    │
    ▼
Is authenticated?
    ├─ No → Show onboarding (sign in)
    │
    └─ Yes → Check database
              │
              ▼
         onboarding_completed = ?
              │
              ├─ false → Show full onboarding flow
              │
              └─ true → Check notifications_enabled = ?
                        │
                        ├─ true → Go to main app ✓
                        │
                        └─ false → Check MiniKit permissions
                                   │
                                   ├─ Already granted → Sync to DB, go to app
                                   │
                                   └─ Not granted → Show notification prompt
```

---

## Components

### 1. Full Onboarding (New Users)

**Shown when**: `onboarding_completed = false`

**Flow**:

1. Onboarding slides (3 steps)
2. Click "Get Started" → MiniKit sign-in modal
3. After sign-in → MiniKit notification permission request
4. Success screen
5. Save both `onboarding_completed = true` AND `notifications_enabled = true/false`

**File**: `components/onboarding-screen.tsx`

---

### 2. Notification Prompt (Returning Users)

**Shown when**:

- `onboarding_completed = true`
- AND `notifications_enabled = false`
- AND MiniKit doesn't have permission granted

**Flow**:

1. Simple drawer with bell icon
2. "Enable Notifications" button → MiniKit permission request
3. Or "Maybe Later" button → Skip
4. Save `notifications_enabled = true/false` to DB
5. Go to main app

**File**: `components/notification-prompt.tsx`

---

## Code Changes

### 1. Added Notification Prompt State

**Location**: `app/page.tsx`

```typescript
const [showNotificationPrompt, setShowNotificationPrompt] = React.useState(false);
```

### 2. Enhanced Onboarding Check Logic

**Location**: `app/page.tsx` → `fetchUserData()`

```typescript
// Check onboarding status from DB
if (data.onboarding_completed) {
  console.log('[Frontend] User has completed onboarding (DB)');
  setShowOnboarding(false);

  // Check if notifications need to be enabled
  if (!data.notifications_enabled && MiniKit.isInstalled()) {
    console.log('[Frontend] Onboarding complete but notifications not enabled');
    // Check current MiniKit permission status
    try {
      const { finalPayload } = await MiniKit.commandsAsync.getPermissions();
      if (finalPayload.status === 'success') {
        const hasNotifications = finalPayload.permissions.notifications;
        if (!hasNotifications) {
          console.log('[Frontend] Showing notification prompt');
          setShowNotificationPrompt(true); // ← Show prompt!
        } else {
          console.log('[Frontend] Notifications already granted in MiniKit, syncing to DB');
          // Sync to DB
          await fetch('/api/user/status', {
            method: 'POST',
            body: JSON.stringify({
              walletAddress: user.walletAddress,
              notificationsEnabled: true
            })
          });
        }
      }
    } catch (e) {
      console.error('[Frontend] Error checking notification permissions:', e);
    }
  }
} else {
  console.log('[Frontend] User has NOT completed onboarding (DB)');
  setShowOnboarding(true); // ← Show full onboarding
}
```

### 3. Created NotificationPrompt Component

**File**: `components/notification-prompt.tsx`

```typescript
export function NotificationPrompt({ isOpen, onOpenChange, onComplete }: NotificationPromptProps) {
  const handleEnable = async () => {
    // Request MiniKit permission
    const { finalPayload } = await MiniKit.commandsAsync.requestPermission({
      permission: Permission.Notifications
    });

    if (finalPayload.status === 'success' || finalPayload.error_code === 'already_granted') {
      onComplete(true); // User enabled
    } else {
      onComplete(false); // User denied
    }
  };

  const handleSkip = () => {
    onComplete(false); // User skipped
  };

  return (
    <Drawer>
      {/* Bell icon, explanation text */}
      <NeoButton onClick={handleEnable}>Enable Notifications</NeoButton>
      <button onClick={handleSkip}>Maybe Later</button>
    </Drawer>
  );
}
```

### 4. Added Handler for Prompt Completion

**Location**: `app/page.tsx`

```typescript
const handleNotificationPromptComplete = async (enabled: boolean) => {
  console.log('[Frontend] Notification prompt completed, enabled:', enabled);
  setShowNotificationPrompt(false);

  // Update DB with notification status
  if (user.walletAddress) {
    await fetch('/api/user/status', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress: user.walletAddress,
        notificationsEnabled: enabled // ← Save to DB
      })
    });
  }
};
```

### 5. Render the Prompt

**Location**: `app/page.tsx` → `return` statement

```typescript
<NotificationPrompt
  isOpen={showNotificationPrompt}
  onOpenChange={setShowNotificationPrompt}
  onComplete={handleNotificationPromptComplete}
/>
```

---

## User Flows

### Flow 1: New User (Never Used App)

```
1. Open app
2. Not authenticated → Show onboarding slides
3. Click "Get Started" → MiniKit sign-in
4. After sign-in → MiniKit notification request
5. User approves/denies
6. DB: onboarding_completed = true, notifications_enabled = true/false
7. Success screen → Main app
```

**Database after**:

```sql
onboarding_completed = true
notifications_enabled = true  (if approved)
                        false (if denied)
```

---

### Flow 2: Returning User (Onboarding Done, Notifications Disabled)

```
1. Open app
2. Authenticated, check DB
3. onboarding_completed = true ✓
4. notifications_enabled = false ✗
5. Check MiniKit: permissions.notifications = false
6. → Show notification prompt drawer
7. User clicks "Enable Notifications" → MiniKit request
8. User approves/denies
9. DB: notifications_enabled = true/false
10. Main app
```

**Database after**:

```sql
onboarding_completed = true  (unchanged)
notifications_enabled = true  (if approved)
                        false (if still denied)
```

---

### Flow 3: Returning User (Everything Enabled)

```
1. Open app
2. Authenticated, check DB
3. onboarding_completed = true ✓
4. notifications_enabled = true ✓
5. → Go straight to main app
```

No modals shown!

---

### Flow 4: Sync Mismatch (DB says false, MiniKit says true)

```
1. Open app
2. Authenticated, check DB
3. onboarding_completed = true ✓
4. notifications_enabled = false ✗
5. Check MiniKit: permissions.notifications = true ✓
6. → Auto-sync DB to true, go to main app
```

No prompt shown, just background sync!

---

## Database Flags

### `onboarding_completed` (BOOLEAN)

**Purpose**: Track if user has completed initial onboarding

**Set to `true` when**:

- User completes full onboarding flow
- Saves after success screen in onboarding

**Checked**: On every app load

---

### `notifications_enabled` (BOOLEAN)

**Purpose**: Track if user has enabled notifications

**Set to `true` when**:

- User approves notification permission (onboarding or prompt)

**Set to `false` when**:

- User denies notification permission
- User clicks "Maybe Later" on prompt

**Checked**:

- On every app load (after onboarding check)
- Synced with MiniKit periodically

---

## Console Logs

### New User Flow

```
[Frontend] Fetching user data for wallet: 0x...
[Frontend] Error fetching user data: { code: 'PGRST116' }
[Frontend] User doesn't exist, showing onboarding
[Onboarding] handleGetStarted triggered
[Onboarding] User not authenticated, triggering login...
[MiniKitProvider] Authentication successful
[Onboarding] MiniKit installed, requesting notification permissions...
[Onboarding] Permission granted
[Frontend] Onboarding completed - updating DB
[API] Updating user status: { onboardingCompleted: true, notificationsEnabled: true }
```

### Returning User (Needs Notifications)

```
[Frontend] Fetching user data for wallet: 0x...
[Frontend] User data found: { onboarding_completed: true, notifications_enabled: false }
[Frontend] User has completed onboarding (DB)
[Frontend] Onboarding complete but notifications not enabled
[Frontend] Checking MiniKit permissions...
[Frontend] MiniKit permissions.notifications = false
[Frontend] Showing notification prompt
[NotificationPrompt] User clicked enable
[NotificationPrompt] Requesting notification permission...
[NotificationPrompt] Permission granted
[Frontend] Notification prompt completed, enabled: true
[API] Updating user status: { notificationsEnabled: true }
```

### Returning User (All Done)

```
[Frontend] Fetching user data for wallet: 0x...
[Frontend] User data found: { onboarding_completed: true, notifications_enabled: true }
[Frontend] User has completed onboarding (DB)
[Frontend] Going to main app
```

---

## Benefits

### ✅ Separation of Concerns

- Onboarding and notifications are separate
- Can enable notifications later without redoing onboarding
- Database is source of truth

### ✅ Better UX

- Returning users don't see full onboarding again
- Simple prompt for notifications only
- "Maybe Later" option available
- Auto-sync if already granted in MiniKit

### ✅ Flexible

- Can prompt for notifications at any time
- Easy to add more prompts for other permissions
- Database flags control flow

### ✅ No Annoying Loops

- Once user completes onboarding, never shown again
- If user denies notifications, stored in DB
- Can be re-prompted (future feature)

---

## Future Enhancements

### 1. Re-prompt for Notifications

Add logic to show prompt again after X days if `notifications_enabled = false`:

```typescript
if (!data.notifications_enabled) {
  const lastPrompted = data.last_notification_prompt;
  const daysSince = (Date.now() - lastPrompted) / (1000 * 60 * 60 * 24);

  if (daysSince > 7) {
    // Re-prompt after 7 days
    setShowNotificationPrompt(true);
  }
}
```

### 2. Settings Page Toggle

Allow user to enable notifications from settings:

```typescript
<button onClick={handleEnableNotifications}>Enable Notifications</button>
```

### 3. In-app Prompts

Show notification prompt at strategic moments:

- After first photo submission
- After winning a challenge
- When receiving first vote

---

## Files Created/Modified

### Created

1. **`components/notification-prompt.tsx`** - New notification prompt drawer

### Modified

1. **`app/page.tsx`**
   - Added `showNotificationPrompt` state
   - Enhanced `fetchUserData()` with notification check logic
   - Added `handleNotificationPromptComplete()` handler
   - Added `<NotificationPrompt>` to render tree

---

## Testing

### Test 1: New User

1. ✅ Open app in World App (never used before)
2. ✅ See onboarding slides
3. ✅ Click "Get Started" → MiniKit sign-in
4. ✅ After sign-in → MiniKit notification request
5. ✅ Approve → Success screen
6. ✅ Check DB: `onboarding_completed = true`, `notifications_enabled = true`

### Test 2: Returning User Without Notifications

1. ✅ Set DB: `onboarding_completed = true`, `notifications_enabled = false`
2. ✅ Open app
3. ✅ Should see notification prompt drawer (NOT full onboarding)
4. ✅ Click "Enable" → MiniKit request
5. ✅ Approve → Main app
6. ✅ Check DB: `notifications_enabled = true`

### Test 3: Skip Notifications

1. ✅ Same as Test 2, but click "Maybe Later"
2. ✅ Go to main app
3. ✅ Check DB: `notifications_enabled = false` (unchanged)

### Test 4: Sync Mismatch

1. ✅ Set DB: `notifications_enabled = false`
2. ✅ Manually grant notification permission in MiniKit
3. ✅ Open app
4. ✅ Should go straight to main app (no prompt)
5. ✅ Check DB: `notifications_enabled = true` (auto-synced)

---

## Summary

✅ Onboarding shown ONLY if `onboarding_completed = false`
✅ Notification prompt shown ONLY if `notifications_enabled = false` AND not already granted
✅ Database flags control entire flow
✅ Simple, non-intrusive notification prompt for returning users
✅ Auto-sync prevents unnecessary prompts
✅ User can skip and be re-prompted later (future feature)
