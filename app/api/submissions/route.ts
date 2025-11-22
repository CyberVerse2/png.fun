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

  try {
    const { challengeId, userId, photoData } = (await req.json()) as SubmissionRequest;
      challengeId,
      userId,
      photoDataLength: photoData?.length
    });

    if (!challengeId || !userId || !photoData) {
        challengeId: !!challengeId,
        userId: !!userId,
        photoData: !!photoData
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload photo to storage
    const photoUrl = await uploadPhoto(photoData, userId);

    // Create submission in database
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {

  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 });
    }

    // Get all submissions for a challenge with user data
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
