import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadPhoto } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface SubmissionRequest {
  challengeId: string;
  userId: string;
  photoData: string; // base64 data URL
}

export async function POST(req: NextRequest) {
  console.log('[API] Creating new submission...');

  try {
    const { challengeId, userId, photoData } = (await req.json()) as SubmissionRequest;
    console.log('[API] Submission request:', {
      challengeId,
      userId,
      photoDataLength: photoData?.length
    });

    if (!challengeId || !userId || !photoData) {
      console.error('[API] Missing required fields:', {
        challengeId: !!challengeId,
        userId: !!userId,
        photoData: !!photoData
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload photo to storage
    console.log('[API] Uploading photo to Supabase Storage...');
    const photoUrl = await uploadPhoto(photoData, userId);
    console.log('[API] Photo uploaded successfully:', photoUrl);

    // Create submission in database
    console.log('[API] Creating submission record in database...');
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        photo_url: photoUrl,
        verified: true // Set to true after World ID verification
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error creating submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Submission created successfully:', submission.id);
    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error('[API] Submission creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  console.log('[API] Fetching submissions...');

  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');
    console.log('[API] Challenge ID:', challengeId);

    if (!challengeId) {
      console.error('[API] Challenge ID required');
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 });
    }

    // Get all submissions for a challenge with user data
    console.log('[API] Querying submissions with user data...');
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        *,
        user:users(username, profile_picture_url)
      `
      )
      .eq('challenge_id', challengeId)
      .order('total_wld_voted', { ascending: false });

    if (error) {
      console.error('[API] Error fetching submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Found', submissions?.length || 0, 'submissions');
    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('[API] Submissions fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
