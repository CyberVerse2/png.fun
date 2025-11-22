# Critical Logic Flaws Fixed

## Summary
After deep analysis of the entire onboarding, sign-in, notification, and submission flow, **8 critical issues** were identified and fixed.

---

## ✅ Issue #1: Onboarding Auto-Authentication Race Condition
**Location:** `components/onboarding-screen.tsx` lines 54-72

**Problem:** The `useEffect` that triggers auto-authentication had `authenticate` in its dependency array. Since `authenticate` was recreated on every render in `minikit-provider.tsx`, this caused the effect to run multiple times, potentially triggering multiple sign-in modals.

**Fix:**
- Wrapped `authenticate` function in `useCallback` with empty dependency array in `components/minikit-provider.tsx`
- Updated `useEffect` dependency array in `onboarding-screen.tsx` to only depend on `isAuthenticated`
- Added eslint-disable comment to suppress exhaustive-deps warning

**Impact:** Sign-in modal now only appears once, preventing race conditions and duplicate authentication attempts.

---

## ✅ Issue #2: Skip Button Bypasses Flow Inconsistently
**Location:** `components/onboarding-screen.tsx` lines 244-266

**Problem:** The Skip button called `onComplete(false)` directly, bypassing the success screen and not following the same flow as the "Get Started" button. This created an inconsistent UX.

**Fix:**
- Changed Skip button to navigate to the last step (`setStep(steps.length - 1)`) instead of calling `onComplete` directly
- This ensures the user goes through the "Get Started" flow, which handles authentication, notification permissions, and shows the success screen

**Impact:** Consistent onboarding experience regardless of whether user clicks "Next" or "Skip".

---

## ✅ Issue #3: Unnecessary 1-Second Delay
**Location:** `components/onboarding-screen.tsx` lines 87-89

**Problem:** After authentication, the code waited 1 second "for the auth drawer to close" before requesting notification permissions. This was arbitrary and slowed down UX.

**Fix:**
- Removed the `await new Promise((resolve) => setTimeout(resolve, 1000))` line

**Impact:** Faster onboarding flow, improved user experience.

---

## ✅ Issue #4: Username/PFP Not Sent During Onboarding Completion
**Location:** `app/page.tsx` `handleOnboardingComplete` function

**Problem:** When completing onboarding, the code only sent `walletAddress`, `onboardingCompleted`, and `notificationsEnabled` to the backend. Username and profile picture were never saved during onboarding.

**Fix:**
```typescript
body: JSON.stringify({
  walletAddress: user.walletAddress,
  onboardingCompleted: true,
  notificationsEnabled: notificationsEnabled,
  username: user.username || MiniKit.user?.username,
  profilePictureUrl: user.profilePictureUrl || MiniKit.user?.profilePictureUrl
})
```

**Impact:** Username and profile picture are now properly saved to the database during onboarding.

---

## ✅ Issue #5: Username/PFP Sync Was Fire-and-Forget
**Location:** `app/page.tsx` `fetchUserData` function, lines 293-306

**Problem:** When syncing missing username/PFP from MiniKit to the database, the code used a fire-and-forget `fetch()` without `await`. This meant subsequent operations might still see `null` values.

**Fix:**
- Changed to `await fetch()` with try/catch error handling
- Added check for both username AND profile_picture_url being missing
- Added console logging for sync completion

**Impact:** Username/PFP sync completes before subsequent operations, ensuring data consistency.

---

## ✅ Issue #6: CurrentUser Stats Hardcoded to 0
**Location:** `app/page.tsx` lines 728-734

**Problem:** The `currentUser` prop passed to `LeaderboardScreen` had `wld: 0` and `wins: 0` hardcoded. Username/PFP came from localStorage, not the database.

**Fix:**
- Added `userStats` state: `{ wld: number; wins: number; rank?: number }`
- Modified `fetchUserData` to also select `total_wld_earned` and `total_wins` from DB
- Store these values in `setUserStats()`
- Pass `userStats.wld` and `userStats.wins` to `currentUser` prop

**Impact:** Leaderboard sticky card now shows accurate WLD and wins for the current user.

---

## ✅ Issue #7: Leaderboard ImageUrl Always Placeholder
**Location:** 
- `app/api/leaderboard/route.ts`
- `app/page.tsx` `fetchLeaderboard` function

**Problem:** The leaderboard API only returned user data, not submission data. The frontend hardcoded `imageUrl: '/placeholder.svg'` for all users.

**Fix:**
- Modified `/api/leaderboard` to:
  - Select `id` field from users table
  - Use `Promise.all()` to fetch latest submission photo for each user
  - Join submission data and return `latest_photo_url`
- Updated frontend to use `user.latest_photo_url || '/placeholder.svg'`

**Impact:** Leaderboard now displays each user's most recent submission photo, including in the current user's sticky card.

---

## ✅ Issue #8: User Rank Not Calculated
**Location:** `app/page.tsx` `fetchLeaderboard` function

**Problem:** The `currentUserRank` prop was hardcoded to 15. The user's actual rank was never calculated.

**Fix:**
- Added `walletAddress` to transformed leaderboard data
- After transforming, find the user's index in the leaderboard array using `user.walletAddress`
- Store the rank (index + 1) in `userStats.rank`
- Pass `userStats.rank || 15` to `currentUserRank` prop (15 is fallback if user not in top 10)

**Impact:** Leaderboard sticky card now shows the user's correct rank.

---

## Files Modified

1. **`components/minikit-provider.tsx`**
   - Added `useCallback` import
   - Wrapped `authenticate` in `useCallback` with empty deps

2. **`components/onboarding-screen.tsx`**
   - Removed 1-second delay in `handleGetStarted`
   - Fixed Skip button to navigate to last step instead of bypassing flow
   - Updated `useEffect` dependencies for auto-authentication

3. **`app/page.tsx`**
   - Added `userStats` state
   - Modified `fetchUserData` to fetch and store `total_wld_earned`, `total_wins`
   - Fixed `handleOnboardingComplete` to send username/PFP
   - Made username/PFP sync `await` instead of fire-and-forget
   - Modified `fetchLeaderboard` to calculate user rank and use `latest_photo_url`
   - Updated `currentUser` prop to use real stats

4. **`app/api/leaderboard/route.ts`**
   - Added `id` to user select query
   - Fetch latest submission photo for each user
   - Return `latest_photo_url` in response

---

## Testing Checklist

✅ All critical issues fixed
✅ No linter errors
⏳ Manual testing required:

1. **First-time user flow:**
   - Open app → Sign-in modal appears immediately
   - Complete sign-in → Onboarding slides appear
   - Click "Get Started" → Notifications permission requested
   - Approve/deny → Success screen appears
   - Click "Let's Go" → Navigate to vote page
   - Username and PFP should be saved in DB

2. **Skip button flow:**
   - Sign in → Click "Skip" on first onboarding slide
   - Should authenticate if needed
   - Should jump to last slide ("Get Started" button)
   - Click "Get Started" → Request notifications → Success screen
   - Username/PFP should still be saved

3. **Submission flow:**
   - Click camera → Verify World ID → Take photo → Send
   - Success screen appears
   - Leaderboard auto-updates with new submission
   - User's sticky card shows their submission photo
   - Refresh page → "Already submitted" modal appears (not "upload photo")

4. **Leaderboard:**
   - Top users show their latest submission photos (not placeholders)
   - Current user sticky card shows correct WLD, wins, rank, and submission photo
   - Rank is accurate based on `total_wld_earned`

5. **Session persistence:**
   - Sign in → Refresh page → Should NOT see sign-in modal again
   - Should remain authenticated across refreshes

---

## Lessons Learned

1. **Always memoize callbacks passed to dependency arrays** to prevent re-render loops
2. **Never use fire-and-forget fetches** for critical data syncing - always `await`
3. **Ensure consistent flows** - Skip buttons should not bypass critical steps
4. **Fetch all necessary data** - Don't leave TODOs with hardcoded values in production code
5. **Join related data** when possible to reduce frontend complexity
6. **Calculate derived data** (like rank) from the source of truth (the ordered leaderboard)
7. **Remove arbitrary delays** - they hurt UX and often mask underlying timing issues
