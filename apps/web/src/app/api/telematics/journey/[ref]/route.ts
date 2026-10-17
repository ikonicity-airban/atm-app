import { NextResponse } from 'next/server';
import { telematicsRepository } from '@/server/repositories/telematics.ts';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;
    if (!ref) {
      return NextResponse.json({ error: 'Booking reference is required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || undefined;

    const journey = await telematicsRepository.lookupJourneyByBooking(ref, phone);
    if (!journey) {
      return NextResponse.json(
        { error: `No active or recent journey found for reference "${ref}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: journey,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch journey telematics' },
      { status: 500 }
    );
  }
}
