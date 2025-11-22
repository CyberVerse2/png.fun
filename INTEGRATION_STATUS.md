# Supabase Integration Status

## ✅ Completed

### Database Setup
- [x] Created database schema with 4 tables (users, challenges, submissions, votes)
- [x] Added indexes for optimized queries
- [x] Created triggers for auto-updating vote counts
- [x] Disabled RLS for simpler development

### API Routes
- [x] `/api/challenges` - GET active challenge
- [x] `/api/submissions` - POST/GET photo submissions
- [x] `/api/votes` - POST/GET votes with WLD amounts
- [x] `/api/leaderboard` - GET top users
- [x] `/api/complete-siwe` - Updated to create/update users in Supabase

### Utilities
- [x] `lib/supabase.ts` - Supabase client with TypeScript types
- [x] `lib/storage.ts` - Photo upload/delete functions

### Frontend Integration
- [x] Updated `app/page.tsx` to fetch real data
- [x] Integrated challenge display
- [x] Integrated submissions for voting
- [x] Integrated leaderboard
- [x] Added loading states

## 📋 Setup Required

To use Supabase, you need to:

1. **Create Supabase Project** - See `SUPABASE_SETUP.md`
2. **Add Environment Variables**:
   ```bash
   cp .env.local.example .env.local
   # Then fill in your Supabase credentials
   ```
3. **Run Migrations**:
   - Execute `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
   - Execute `supabase/migrations/002_rls_policies.sql` (currently empty, RLS disabled)
4. **Create Storage Bucket**:
   - Create a bucket named `photos` in Supabase Storage
   - Set to public read access

## 🔄 Data Flow

### Authentication
1. User authenticates with World ID
2. `complete-siwe` API creates/updates user in Supabase
3. User data available throughout app

### Voting
1. User views submissions from active challenge
2. User votes on submission (swipe or press-hold)
3. Vote recorded in database with WLD amount
4. Submission vote count auto-updates via trigger

### Photo Submission
1. User captures photo with camera
2. Photo verified with World ID
3. Photo uploaded to Supabase Storage
4. Submission created in database linked to challenge

### Leaderboard
1. Fetches top users by `total_wld_earned`
2. Displays wins, streaks, and earnings
3. Updates in real-time

## 🚧 TODO

- [ ] Integrate World ID Pay for actual WLD transactions
- [ ] Add photo submission flow to upload to Supabase
- [ ] Implement challenge creation admin panel
- [ ] Add real-time subscriptions for live updates
- [ ] Implement payout logic for winners
- [ ] Add user profile updates (username, avatar)

## 📊 Database Schema

### users
- Stores wallet address, username, profile picture
- Tracks wins, streaks, total WLD earned

### challenges
- Daily photo challenges with prize pools
- Status: active, voting, completed

### submissions
- Photos submitted for challenges
- Auto-tracks vote count and total WLD voted

### votes
- User votes with WLD amounts
- Serves as both votes and predictions
- Unique constraint prevents duplicate votes

## 🔐 Security

- RLS disabled for development simplicity
- All access control handled in API routes
- Service role key used for admin operations
- Validate user permissions in API endpoints

## 🎯 Next Steps

1. Set up your Supabase project
2. Add environment variables
3. Run database migrations
4. Create storage bucket
5. Test the integration!
