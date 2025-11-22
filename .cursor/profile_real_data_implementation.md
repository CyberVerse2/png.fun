# Profile Screen - Real Data Implementation

## Summary

Replaced all mock data in the profile screen with actual data fetched from the Supabase database.

---

## Changes Made

### 1. Added Profile Data State

**Location:** `app/page.tsx`

Added new state to store profile data:

```typescript
const [profileData, setProfileData] = React.useState<any>(null);
```

### 2. Created `fetchProfileData` Function

**Location:** `app/page.tsx`

New function that fetches:

- **User stats** from `users` table:

  - username
  - profile_picture_url
  - total_wld_earned
  - total_wins
  - current_streak

- **User submissions** from `submissions` table:

  - id
  - photo_url
  - total_wld_voted (used as votes)
  - created_at
  - challenge title (joined from challenges table)

- **Predictions**: Currently returns empty array (voting/prediction system not fully implemented yet)

The function transforms the database data into the format expected by the ProfileScreen component:

```typescript
const profile = {
  username: userData.username || user.username || 'You',
  avatarUrl: userData.profile_picture_url || user.profilePictureUrl || '/placeholder.svg',
  wld: userData.total_wld_earned || 0,
  wins: userData.total_wins || 0,
  streak: userData.current_streak || 0,
  totalWldEarned: userData.total_wld_earned || 0,
  submissions: (submissionsData || []).map((sub: any, index: number) => ({
    id: sub.id,
    imageUrl: sub.photo_url,
    challenge: sub.challenge?.title || 'Challenge',
    votes: sub.total_wld_voted || 0,
    rank: index + 1
  })),
  predictions: []
};
```

### 3. Added useEffect to Fetch Profile Data

**Location:** `app/page.tsx`

```typescript
useEffect(() => {
  if (userId) {
    fetchProfileData();
  }
}, [userId]);
```

Profile data is fetched whenever `userId` changes (i.e., when user logs in or user data is loaded from DB).

### 4. Updated ProfileScreen Rendering

**Location:** `app/page.tsx`

Changed from:

```typescript
<ProfileScreen data={mockProfile} />
```

To:

```typescript
{
  profileData ? (
    <ProfileScreen data={profileData} />
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-xl font-black uppercase tracking-widest animate-pulse">
          Loading Profile...
        </div>
      </div>
    </div>
  );
}
```

Now shows a loading spinner while profile data is being fetched.

### 5. Removed Mock Data

**Location:** `app/page.tsx`

Removed the entire `mockProfile` constant (60+ lines of mock data) and replaced it with a comment:

```typescript
// Mock profile data removed - now using real data from database
```

---

## Data Flow

1. **User logs in** → `userId` is set
2. **`useEffect` triggers** → calls `fetchProfileData()`
3. **Fetch user stats** from `users` table
4. **Fetch submissions** from `submissions` table (with challenge titles)
5. **Transform data** into ProfileScreen format
6. **Update state** → `setProfileData(profile)`
7. **Render ProfileScreen** with real data

---

## Profile Screen Features

### Stats Cards

- **Wins**: `total_wins` from users table
- **Streak**: `current_streak` from users table
- **Earned**: `total_wld_earned` from users table

### Submissions Tab

Shows all user submissions with:

- Photo from Supabase Storage
- Challenge title
- Votes (total_wld_voted)
- Rank (calculated based on order)

### Predictions Tab

Currently shows empty state (voting/prediction system to be implemented)

---

## Database Schema Used

### `users` table

- `id` (UUID)
- `username` (TEXT)
- `profile_picture_url` (TEXT)
- `total_wld_earned` (NUMERIC)
- `total_wins` (INTEGER)
- `current_streak` (INTEGER)

### `submissions` table

- `id` (UUID)
- `user_id` (UUID) - foreign key to users
- `challenge_id` (UUID) - foreign key to challenges
- `photo_url` (TEXT)
- `total_wld_voted` (NUMERIC)
- `created_at` (TIMESTAMP)

### `challenges` table

- `id` (UUID)
- `title` (TEXT)

---

## Loading States

### Before Profile Data Loads

Shows animated loading spinner with "Loading Profile..." text

### After Profile Data Loads

Shows full profile with:

- Avatar and username from DB
- Real wallet address (truncated)
- Current WLD balance badge
- Stats cards with real numbers
- Submissions grid with actual photos
- Predictions tab (empty for now)

---

## Fallbacks

The implementation includes several fallbacks for missing data:

1. **Username**: DB → MiniKit session → "You"
2. **Avatar**: DB → MiniKit session → placeholder
3. **Stats**: DB values → 0
4. **Challenge title**: Join result → "Challenge"
5. **Submissions**: DB array → empty array
6. **Predictions**: Empty array (not implemented yet)

---

## Console Logging

Added comprehensive logging for debugging:

```
[Frontend] Fetching profile data for user: [userId]
[Frontend] Profile data fetched: { username, wld, wins, ... }
[Frontend] Error fetching user data: [error]
[Frontend] Error fetching submissions: [error]
```

---

## Next Steps / Future Enhancements

1. **Predictions Tab**: Implement voting/prediction system to populate this tab
2. **Rank Calculation**: Calculate actual rank based on votes/position in challenge
3. **Refresh on Actions**: Refresh profile data when user submits a new photo
4. **Pull to Refresh**: Add gesture to manually refresh profile data
5. **Caching**: Cache profile data to reduce database queries
6. **Pagination**: Add pagination for submissions if user has many

---

## Testing

To verify the implementation works:

1. **Sign in and complete onboarding**
2. **Submit at least one photo**
3. **Navigate to profile tab**
4. **Verify**:
   - Avatar shows your profile picture
   - Username is correct
   - Stats show real numbers (initially 0 for new users)
   - Submissions tab shows your submitted photos
   - Each submission shows the challenge title
   - Loading spinner appears briefly on first load

---

## Files Modified

1. **`app/page.tsx`**
   - Added `profileData` state
   - Created `fetchProfileData()` function
   - Added useEffect to fetch on userId change
   - Updated ProfileScreen rendering with loading state
   - Removed `mockProfile` constant

---

## Impact

✅ Profile now shows real user data from database
✅ Submissions tab shows actual submitted photos
✅ Stats are calculated from real database values
✅ No more mock/fake data in profile
✅ Loading states provide better UX
✅ Proper error handling and logging
