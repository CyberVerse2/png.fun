import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client-side Supabase client (only create if we have the required env vars)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

// Server-side Supabase client with service role key
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null as any

// Database types
export type User = {
  id: string
  wallet_address: string
  username: string | null
  profile_picture_url: string | null
  total_wins: number
  current_streak: number
  total_wld_earned: number
  world_id_verified: boolean
  onboarding_completed: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export type Challenge = {
  id: string
  title: string
  description: string
  prize_pool?: number // Calculated dynamically from votes
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
