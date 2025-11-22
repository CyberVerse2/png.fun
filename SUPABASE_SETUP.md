# Supabase Integration Setup

## Prerequisites
- Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: `png-fun` (or your preferred name)
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 4: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to create tables
5. Repeat for `supabase/migrations/002_rls_policies.sql`

Alternatively, if you have Supabase CLI installed:
```bash
supabase db push
```

## Step 5: Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it `photos`
4. Set to **Public bucket** (for public read access)
5. Click **Create bucket**

### Configure Storage Policies

In **Storage** → **Policies** → **photos bucket**:

1. **Allow public read access**:
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'photos');
   ```

2. **Allow authenticated uploads**:
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
   ```

## Step 6: Verify Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check for any connection errors in the console
3. Test authentication flow - users should be created in Supabase

## Database Schema

The following tables will be created:

- **users** - User profiles with wallet addresses
- **challenges** - Daily photo challenges
- **submissions** - Photo submissions for challenges
- **votes** - User votes with WLD amounts

## API Endpoints

Once set up, the following endpoints will be available:

- `GET /api/challenges` - Fetch active challenge
- `POST /api/submissions` - Submit a photo
- `GET /api/submissions?challengeId=xxx` - Get challenge submissions
- `POST /api/votes` - Vote on a submission
- `GET /api/leaderboard` - Get top users

## Troubleshooting

### "Invalid API key" error
- Double-check your environment variables
- Ensure `.env.local` is in the root directory
- Restart the dev server after updating env vars

### Database connection errors
- Verify your Supabase project URL is correct
- Check that migrations ran successfully
- Ensure RLS policies are enabled

### Storage upload errors
- Verify the `photos` bucket exists
- Check storage policies are configured
- Ensure bucket is set to public

## Next Steps

1. Create a test challenge in Supabase
2. Test photo submission flow
3. Test voting functionality
4. Monitor database in Supabase dashboard
