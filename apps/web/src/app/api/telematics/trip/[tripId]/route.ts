import { NextResponse } from 'next/server';
import { telematicsRepository } from '@/server/repositories/telematics.ts';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const liveTelematics = await telematicsRepository.getLiveTripTelematics(tripId);
    if (!liveTelematics) {
      return NextResponse.json(
        { error: `No telematics available for trip "${tripId}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: liveTelematics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch trip telematics' },
      { status: 500 }
    );
  }
}
