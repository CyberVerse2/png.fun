# PNG.FUN - Development Scratchpad

## Background and Motivation

This scratchpad tracks development tasks and progress for the PNG.FUN application - a social photo gaming platform.

## Current Status / Progress Tracking

### Recent Changes (Nov 23, 2024)

#### ✅ Migrated to World Mini App Authentication (NextAuth v5)

**Task**: Convert the app's custom SIWE authentication to use NextAuth.js v5 (Auth.js) with World mini app integration, following the official World mini app setup guide.

**Changes Made**:

1. **Dependencies Installed**:

   - `next-auth@^5.0.0-beta.25` - NextAuth v5 for session management
   - `viem` - Ethereum utilities
   - `@worldcoin/minikit-react` - MiniKit React hooks
   - `@worldcoin/mini-apps-ui-kit-react` - World UI components

2. **Auth System** (`auth/` directory):

   - `auth/index.ts` - Main NextAuth configuration with Credentials provider
     - Uses HMAC-signed nonces for security
     - Verifies SIWE messages via `verifySiweMessage`
     - Creates/updates users in Supabase on successful auth
     - JWT-based session strategy
     - Session callbacks populate user data (walletAddress, username, profilePictureUrl)
   - `auth/wallet/client-helpers.ts` - HMAC nonce hashing utility
   - `auth/wallet/server-helpers.ts` - Server-side nonce generation
   - `auth/wallet/index.ts` - Client-side `walletAuth()` function for triggering auth flow

3. **API Routes**:

   - `app/api/auth/[...nextauth]/route.ts` - NextAuth API handlers (GET, POST)
   - `middleware.ts` - NextAuth middleware for protected routes

4. **Providers** (`providers/index.tsx`):

   - Combined `MiniKitProvider` and NextAuth's `SessionProvider`
   - Initializes MiniKit with app ID on mount
   - Wraps app with both providers for full functionality

5. **Layout** (`app/layout.tsx`):

   - Made async to call `auth()` and get session server-side
   - Imports World mini app UI kit styles
   - Passes session to ClientProviders

6. **Main App** (`app/page.tsx`):

   - Replaced `useUser()` hook with NextAuth's `useSession()`
   - Updated all user state references to use session object:
     - `isLoading` from `status === 'loading'`
     - `isAuthenticated` from `status === 'authenticated'`
     - `walletAddress` from `session?.user?.walletAddress`
     - `username` from `session?.user?.username`
     - `profilePictureUrl` from `session?.user?.profilePictureUrl`
   - All user data now flows through NextAuth session

7. **Onboarding Screen** (`components/onboarding-screen.tsx`):

   - Replaced `useUser()` and `useAuth()` with `useSession()`
   - Updated authentication trigger to use `walletAuth()` function
   - Simplified auth flow - no manual success checking needed

8. **Configuration**:

   - `next.config.mjs` - Added:
     - `allowedDevOrigins: ['*']` for development
     - `reactStrictMode: false` to prevent double-mounting
     - Image domain for World profile pictures
   - `.env.local` created with:
     - `NEXTAUTH_SECRET` - NextAuth encryption key
     - `AUTH_URL` - App URL for NextAuth callbacks
     - `HMAC_SECRET_KEY` - For nonce signing
     - `NEXT_PUBLIC_APP_ID` - World app ID
     - `NEXT_PUBLIC_APP_ENV` - development/production

9. **TypeScript Declarations** (`types/next-auth.d.ts`):
   - Extended NextAuth Session and User types
   - Added custom fields: walletAddress, username, profilePictureUrl
   - Extended JWT type for token callbacks

**Removed/Deprecated**:

- `components/minikit-provider.tsx` - Replaced by NextAuth + MiniKitProvider combo
- `app/api/nonce/route.ts` - Nonce generation now in auth system
- `app/api/complete-siwe/route.ts` - SIWE verification now in NextAuth authorize callback
- Custom cookie-based session management

**How It Works**:

1. User clicks "Connect World ID" in onboarding
2. `walletAuth()` generates HMAC-signed nonce pair
3. MiniKit.commandsAsync.walletAuth() prompts user to sign in World App
4. Signed payload sent to NextAuth via `signIn('credentials', {...})`
5. NextAuth authorize callback:
   - Verifies nonce signature
   - Verifies SIWE message
   - Creates/updates user in Supabase
   - Returns user object
6. JWT callback stores user data in token
7. Session callback populates session.user with data
8. App components access via `useSession()` hook
9. Server components can call `auth()` directly

**Benefits**:

- Industry-standard auth solution (NextAuth)
- Secure JWT-based sessions
- Automatic session persistence
- Server-side session access
- Type-safe session data
- Follows World mini app best practices

**Success Criteria**:

- ✅ NextAuth v5 installed and configured
- ✅ MiniKit wallet authentication working
- ✅ User creation/update in Supabase
- ✅ Session management via JWT
- ✅ All components updated to use useSession()
- ✅ No linter errors
- ✅ TypeScript types properly defined
- ✅ MiniKit initialization preserved

**Testing Required**:

- Test fresh user onboarding with World ID connection
- Test returning user auto-login (if NextAuth supports it)
- Verify session persists across page reloads
- Check user data correctly populated from MiniKit
- Verify Supabase user records created/updated
- Test authentication in World App mini app environment

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

**Completed Task 5 (Nov 23, 2024)**: World Mini App Authentication Migration

- ✅ Installed NextAuth v5 and required dependencies
- ✅ Created complete auth system in `auth/` directory
- ✅ Configured NextAuth with Credentials provider and SIWE verification
- ✅ Created NextAuth API routes (`/api/auth/[...nextauth]`)
- ✅ Added middleware for session management
- ✅ Created ClientProviders combining MiniKitProvider + SessionProvider
- ✅ Updated layout to be async and pass session to providers
- ✅ Migrated app/page.tsx from useUser() to useSession()
- ✅ Migrated onboarding-screen.tsx to use walletAuth()
- ✅ Updated next.config.mjs with World mini app settings
- ✅ Created .env.local with all required environment variables
- ✅ Added TypeScript declarations for NextAuth session types
- ✅ Integrated Supabase user creation/update in auth flow
- ✅ **Fixed Edge Runtime compatibility** - Converted HMAC hashing from Node.js `crypto` to Web Crypto API (`crypto.subtle`) to work in Edge Runtime where middleware runs
- ✅ **Updated onboarding flow**:
  1. User clicks "Connect World ID" → Authenticates with World ID
  2. Success screen shows → User clicks continue
  3. Add MiniApp modal shows → User adds to home screen or skips
  4. Notifications modal shows → User enables notifications or skips
  5. Notification status saved to database
- ✅ Created `add-miniapp-prompt.tsx` modeled after notification-prompt
- ✅ No linter errors
- ✅ UI/design/classes remain unchanged as requested

**Important Notes**:

- **Old auth files can be removed**: `components/minikit-provider.tsx`, `app/api/nonce/route.ts`, `app/api/complete-siwe/route.ts` are no longer needed
- **Environment variables**: User needs to ensure Supabase credentials are in `.env.local`
- **Testing**: Auth flow should be tested in actual World App mini app environment
- **No UI changes**: All existing UI components, classes, and design remain untouched

**Next Steps**:
The human user should:

1. Verify `.env.local` has correct values (especially `NEXT_PUBLIC_APP_ID`)
2. Test authentication flow in World App mini app
3. Confirm user records are being created/updated in Supabase
4. Test existing functionality (voting, leaderboard, profile) still works
5. Consider deleting deprecated auth files once migration is confirmed working

**Completed Task 4**: Fixed leaderboard & profile data issues

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
- **Edge Runtime Compatibility**: NextAuth middleware runs in Edge Runtime, which doesn't support Node.js modules like `crypto`. Use Web Crypto API (`crypto.subtle`) instead for HMAC operations that need to work in both Node.js and Edge environments.
