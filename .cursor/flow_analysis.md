# Flow Analysis: Expected vs Actual

## Your Expected Flow

1. ✅ User opens app → **Onboarding screen shows**
2. ❌ **Sign in modal from MiniKit pops up immediately**
3. ✅ User signs in → Goes through onboarding flow
4. ✅ User clicks "Get Started" → Notification permission request from MiniKit
5. ✅ User approves notifications → Success page shows
6. ✅ User clicks "Let's Go" → Goes to vote page
7. ✅ User clicks camera button → Verify World ID modal pops up
8. ✅ User clicks verify button → World ID verification from MiniKit
9. ✅ After verification → "Open Camera" modal/button appears
10. ✅ User takes pic → Retake or Send options
11. ✅ User clicks Send → Creates submission for challenge
12. ✅ Success page shows
13. ⚠️ **Submission appears in vote cards** (YES, but with delay)
14. ⚠️ **Submission appears in leaderboard current rank** (YES, but user needs to switch tabs)

## Actual Flow Issues

### Issue #1: Sign-In Modal Timing ❌

**Expected:** Sign-in modal pops up immediately when opening the app
**Actual:** Onboarding screen shows first with 3 intro slides. Sign-in only triggers when user clicks "Connect World ID" on the last slide (if not authenticated) or "Get Started" (if authenticated).

**Fix Needed:** Show sign-in modal BEFORE onboarding screens.

### Issue #2: Submission Not Auto-Showing in Vote Cards ⚠️

**Expected:** Submission automatically appears in vote cards after success
**Actual:** The code DOES call `fetchSubmissions()` after successful submission, BUT the new submission will appear at the END of the vote stack (since it has 0 votes). If the user has already swiped through cards, they won't see their own submission unless they finish all cards or refresh.

**Fix Needed:** Either:

- Filter out user's own submission from vote stack
- Or show a different success message indicating their submission is "in queue"

### Issue #3: Leaderboard Rank Not Auto-Updating ⚠️

**Expected:** Submission appears in leaderboard current rank immediately
**Actual:** The leaderboard is only fetched once on mount (`useEffect(() => { fetchLeaderboard() }, [])`). It does NOT re-fetch when a submission is created. The `userSubmission` state is updated with the photo, but the rank/stats aren't recalculated.

**Fix Needed:**

- Call `fetchLeaderboard()` after successful submission
- Or update `userSubmission` to trigger a re-render of the leaderboard

### Issue #4: Success Page Button Text ⚠️

**Expected:** "Let's Go" button
**Actual:** Need to verify if the success screen says "Let's Go" or "Continue"

## Current Flow Breakdown

```
1. App opens
   ↓
2. Loading screen (checking auth state)
   ↓
3a. If NOT authenticated → Onboarding Screen (3 slides)
   ↓
   User clicks through slides (Next, Next, "Connect World ID")
   ↓
   MiniKit sign-in modal pops up
   ↓
   User signs in
   ↓
   Notification permission request
   ↓
   Success screen ("onboarding" type)
   ↓
   User clicks continue → DB updated with onboarding_completed
   ↓
   Vote page

3b. If authenticated but NOT onboarding_completed → Same as 3a but skips sign-in

3c. If authenticated AND onboarding_completed → Vote page directly

4. User on vote page clicks camera
   ↓
   HumanVerificationModal opens
   ↓
   If NOT world_id_verified:
     User clicks "Verify World ID"
     ↓
     MiniKit World ID verification modal
     ↓
     Backend verifies → world_id_verified set to true
     ↓
     Modal shows "Open Camera" button
   ↓
   If already verified: Shows "Open Camera" button immediately
   ↓
5. User clicks "Open Camera"
   ↓
   File input opens (camera on mobile)
   ↓
   User takes photo
   ↓
   PhotoPreviewScreen shows
   ↓
6. User clicks "Send"
   ↓
   Submission created
   ↓
   fetchSubmissions() called (new submission at end of stack)
   ↓
   Success screen ("challenge" type)
   ↓
7. User clicks continue
   ↓
   Back to vote page (submission visible at end of stack)
```

## Recommendations

1. **Move Sign-In Earlier:** Show MiniKit sign-in immediately on first open, THEN show onboarding slides
2. **Auto-Refresh Leaderboard:** Call `fetchLeaderboard()` after submission success
3. **Better Feedback:** Show "Your submission has been added!" message clarifying it's in the queue
