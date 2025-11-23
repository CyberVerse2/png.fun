# PNG.FUN - Development Scratchpad

## Background and Motivation

This scratchpad tracks development tasks and progress for the PNG.FUN application - a social photo gaming platform.

## Current Status / Progress Tracking

### Recent Changes (Nov 22, 2024)

#### ✅ Implemented Auto-Authentication Flow

**Task**: Modified the app to automatically attempt sign-in on launch, fetch user details from database, and only show onboarding if the user hasn't completed it.

**Changes Made**:

1. **MiniKitProvider** (`components/minikit-provider.tsx`):

   - Added auto-authentication on app launch
   - Automatically triggers SIWE wallet authentication when MiniKit is installed
   - Falls back gracefully if authentication fails or is cancelled
   - Sets `isLoading: false` after authentication attempt completes

2. **Main App** (`app/page.tsx`):
   - Removed immediate onboarding display logic
   - Now waits for authentication attempt to complete
   - Fetches user data from database after authentication
   - Checks `onboarding_completed` field from database (source of truth)
   - Only shows onboarding if:
     - User is not authenticated, OR
     - User is authenticated but `onboarding_completed = false`
   - Added detailed console logging for debugging the flow

**Flow Now**:

1. App launches → MiniKit initializes → Auto-attempt SIWE authentication
2. If auth succeeds → Fetch user details from Supabase
3. Check `onboarding_completed` in database
4. If `onboarding_completed = true` → Hide onboarding, show main app
5. If `onboarding_completed = false` or not authenticated → Show onboarding

**Success Criteria**:

- ✅ Auto-authentication attempts on app launch
- ✅ User data fetched from database after authentication
- ✅ Onboarding only shown when needed (based on DB status)
- ✅ No linter errors
- ✅ Console logs added for debugging

#### ✅ Implemented Voting Functionality

**Task**: Implement voting where swiping yes (right) creates a vote that adds 1 WLD to the submission.

**Changes Made**:

1. **Main App** (`app/page.tsx`):
   - Updated `handleVote` function to create actual votes
   - Swipe right ("up") → Creates vote with 1 WLD via `/api/votes` endpoint
   - Swipe left ("down") → Just skips, no vote created
   - Refreshes submissions after successful vote to show updated counts
   - Handles duplicate vote attempts (409 conflict)
   - Added detailed console logging for debugging

**How It Works**:

- User swipes right on photo → POST to `/api/votes` with `{ submissionId, voterId, wldAmount: 1 }`
- Database trigger automatically updates submission's `vote_count` and `total_wld_voted`
- Submissions list refreshes to show updated vote counts
- Duplicate votes are prevented by database unique constraint

**Success Criteria**:

- ✅ Swipe right creates vote with 1 WLD
- ✅ Swipe left skips without creating vote
- ✅ Submissions refresh after vote
- ✅ Duplicate votes prevented
- ✅ No linter errors
- ✅ Console logs added for debugging

#### ✅ Implemented Auto-Refresh Leaderboard & Filter Voted Submissions

**Task**: Automatically update the leaderboard ranking after votes, and don't show cards that have been swiped on the vote stack.

**Changes Made**:

1. **Main App** (`app/page.tsx`):
   - Added `votedSubmissionIds` state to track which submissions user has voted on
   - Created `fetchUserVotes()` function to load user's existing votes on app load
   - Updated `fetchSubmissions()` to filter out submissions the user has already voted on
   - Updated `handleVote()` to:
     - Call `fetchLeaderboard()` after successful vote to update rankings
     - Add voted submission ID to the set (for both yes and skip)
     - Filter voted submissions from the stack
   - Added useEffect to fetch user votes when userId becomes available
   - Added useEffect to refetch submissions when voted IDs change

**How It Works**:

- On load → Fetch user's votes from `/api/votes?voterId={userId}`
- Store voted submission IDs in a Set
- Filter submissions to exclude already-voted ones from vote stack
- After each vote/skip → Add submission ID to set
- Swiped cards won't appear again in the stack
- Leaderboard refreshes after each vote to show updated rankings in real-time

**Success Criteria**:

- ✅ User's existing votes fetched on app load
- ✅ Voted submissions filtered from vote stack
- ✅ Swiped cards (yes or skip) don't appear again
- ✅ Leaderboard automatically updates after votes
- ✅ No linter errors
- ✅ Console logs added for debugging

#### ✅ Fixed Leaderboard & Profile Data Issues

**Task**: Fix leaderboard to show current challenge submission vote WLD, and show user votes as predictions in profile.

**Issues Found**:

1. Leaderboard was showing users' lifetime `total_wld_earned` instead of current challenge submissions with their vote counts
2. Profile predictions were hardcoded to an empty array instead of fetching user votes

**Changes Made**:

1. **Leaderboard** (`app/page.tsx` - `fetchLeaderboard()`):

   - Changed to fetch current challenge submissions ranked by `total_wld_voted`
   - Falls back to user leaderboard if no active challenge
   - Shows submission photo, username, and current WLD votes
   - Updates user's rank based on their submission position in current challenge
   - Properly displays vote WLD amounts per submission

2. **Profile Predictions** (`app/page.tsx` - `fetchProfileData()`):
   - Now fetches user's votes from the votes table
   - Joins with submissions to get photo, photographer info
   - Transforms votes into predictions format showing:
     - Challenge name
     - Vote status (active/won/lost)
     - WLD amount voted
     - Submission photo
     - Photographer username and avatar
   - Displays in the Predictions tab on profile screen

**How It Works**:

- **Leaderboard**: Fetches `/api/submissions?challengeId={id}` which returns submissions sorted by `total_wld_voted`
- **Profile Predictions**: Queries votes table with joins to get all vote data and related submission info
- Both update automatically after new votes are created

**Success Criteria**:

- ✅ Leaderboard shows current challenge submissions
- ✅ Leaderboard displays correct WLD vote amounts
- ✅ Profile predictions show user's votes
- ✅ Predictions include submission photos and photographer info
- ✅ No linter errors
- ✅ Console logs added for debugging

## Project Status Board

- [x] Implement auto-authentication flow
- [x] Implement voting functionality (swipe right adds 1 WLD)
- [x] Auto-refresh leaderboard after voting
- [x] Filter out voted submissions from vote stack
- [x] Fix leaderboard to show current challenge submissions with vote WLD
- [x] Fix profile to show votes as predictions
- [ ] Test auto-authentication with returning users
- [ ] Test onboarding flow with new users
- [ ] Test voting functionality
- [ ] Test leaderboard updates
- [ ] Test vote stack filtering
- [ ] Test leaderboard showing correct WLD amounts
- [ ] Test profile predictions showing user votes

## Executor's Feedback or Assistance Requests

**Completed Task 1**: Auto-authentication flow implementation

- All files updated successfully
- No linter errors detected
- Ready for testing by human user

**Completed Task 2**: Voting functionality implementation

- Swiping right (yes) now creates a vote with 1 WLD
- Swiping left (no) is a skip - no vote created
- Vote creation calls `/api/votes` endpoint
- Database trigger automatically updates submission's `total_wld_voted`
- Submissions refresh after successful vote to show updated counts
- Proper error handling for duplicate votes (409 conflict)
- All console logs added for debugging
- No linter errors detected
- Ready for testing by human user

**Completed Task 3**: Auto-refresh leaderboard & filter voted submissions

- User's existing votes are fetched on app load
- Voted submissions are filtered out from the vote stack
- Once a card is swiped (yes or skip), it won't appear again
- Leaderboard automatically refreshes after each vote to show updated rankings
- Both yes votes and skips are tracked to prevent re-showing
- All console logs added for debugging
- No linter errors detected
- Ready for testing by human user

**Completed Task 4**: Fixed leaderboard & profile data issues

- Leaderboard now shows current challenge submissions ranked by vote WLD
- Leaderboard displays correct WLD amounts per submission
- Profile predictions now fetch and display user's votes
- Predictions show submission photos, photographer info, and vote amounts
- All console logs added for debugging
- No linter errors detected
- Ready for testing by human user

**Next Steps**:
The human user should test:

1. Fresh user experience (should see onboarding)
2. Returning user experience (should skip onboarding if already completed)
3. Check browser console for detailed logs of the authentication flow
4. **Swipe right on photos** to vote (should add 1 WLD to submission)
5. **Swipe left** to skip (should not create vote)
6. **Check that swiped cards don't appear again** in the vote stack
7. **Check leaderboard displays current challenge submissions** with correct WLD vote amounts
8. **Check leaderboard updates** after voting (rankings should change based on votes)
9. **Check profile Predictions tab** shows user's votes with photos and photographer info
10. Reload the app and verify previously voted submissions don't show in vote stack
11. Try to vote twice on same photo (should prevent duplicate votes with console warning)
12. Check that submission vote counts update after voting

## Lessons

- Include info useful for debugging in the program output (already applied with console.logs)
- Read the file before you try to edit it (followed)
- Authentication flow should happen before checking onboarding status to avoid showing incorrect screens
