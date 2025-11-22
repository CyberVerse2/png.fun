import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export type User = {
  id: string
  wallet_address: string
  username: string | null
  profile_picture_url: string | null
  total_wins: number
  current_streak: number
  total_wld_earned: number
  created_at: string
  updated_at: string
}

export type Challenge = {
  id: string
  title: string
  description: string
  prize_pool: number
  start_time: string
  end_time: string
  status: 'active' | 'voting' | 'completed'
  created_at: string
}

export type Submission = {
  id: string
  challenge_id: string
  user_id: string
  photo_url: string
  vote_count: number
  total_wld_voted: number
  rank: number | null
  created_at: string
  verified: boolean
}

export type Vote = {
  id: string
  submission_id: string
  voter_id: string
  wld_amount: number
  status: 'active' | 'won' | 'lost'
  created_at: string
}
