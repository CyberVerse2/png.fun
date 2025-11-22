# Flow Fixes Applied

## Issue #1: Sign-In Modal Timing ✅ FIXED

**Problem:** Sign-in modal only appeared after user clicked through 3 onboarding slides
**Solution:** Added auto-authentication trigger in `components/onboarding-screen.tsx` on component mount. Now when the onboarding screen loads, it automatically triggers the MiniKit sign-in modal if the user is not authenticated.

**Changes:**

- Added `useEffect` hook that calls `authenticate()` automatically when component mounts and user is not authenticated
- This happens BEFORE the user interacts with any onboarding slides

## Issue #3: Leaderboard Not Refreshing After Submission ✅ FIXED

**Problem:** Leaderboard was only fetched once on mount and never updated after submission
**Solution:** Added `await fetchLeaderboard()` call in `app/page.tsx` after successful submission creation.

**Changes:**

- In `handleSend()`, after `fetchSubmissions()` completes, now also calls `fetchLeaderboard()`
- This ensures the leaderboard rankings and stats are up-to-date after each new submission

## Updated Flow

```
1. User opens app for first time
   ↓
2. Onboarding screen loads
   ↓
3. MiniKit sign-in modal AUTOMATICALLY pops up (NEW!)
   ↓
4. User signs in with World ID
   ↓
5. Onboarding slides appear (3 intro screens)
   ↓
6. User clicks "Get Started"
   ↓
7. Notification permission request from MiniKit
   ↓
8. Success screen
   ↓
9. User clicks continue → Vote page
   ↓
10. Camera flow → verification → photo → send
   ↓
11. Submission created
   ↓
12. Both vote cards AND leaderboard refresh (NEW!)
   ↓
13. Success screen
```

## Remaining Known Issues

### Minor UX Issue (Not Critical)

User's new submission appears at the END of the vote stack (because it has 0 votes). If they've already swiped through some cards, they won't immediately see their own submission in the stack. However, it WILL appear in:

- The leaderboard sticky rank card (with their photo)
- The submission list if they finish swiping all cards

This is expected behavior based on the sorting by votes.
