import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const logEntry = await req.json();

    // Log to server console (visible in terminal)
    console.log('📋 [CLIENT LOG]', logEntry.category, ':', logEntry.message);
    if (logEntry.data) {
      console.log('   Data:', JSON.stringify(logEntry.data, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail on logging errors
    return NextResponse.json({ success: false });
  }
}
