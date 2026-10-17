import { NextResponse } from 'next/server';
import { telematicsLookupSchema } from '@atm/shared';
import { telematicsRepository } from '@/server/repositories/telematics.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = telematicsLookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { bookingReference, passengerPhone } = parsed.data;
    const journey = await telematicsRepository.lookupJourneyByBooking(bookingReference, passengerPhone);

    if (!journey) {
      return NextResponse.json(
        {
          error: 'Journey not found or phone number does not match booking record',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingReference: journey.bookingReference,
      tripId: journey.tripId,
      trackingUrl: `/track/journey/${journey.bookingReference}`,
      status: journey.tripStatus,
      corridor: `${journey.originTerminal.city} to ${journey.destinationTerminal.city}`,
      estimatedArrivalWat: journey.estimatedArrivalWat,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to lookup journey telematics' },
      { status: 500 }
    );
  }
}
