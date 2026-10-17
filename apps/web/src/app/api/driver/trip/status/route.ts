import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateTripStatusSchema } from '@atm/shared';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const driverId = cookieStore.get('atm_driver_id')?.value || 'drv-enugu-01';

    const body = await request.json();
    const parsed = updateTripStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid trip status transition', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tripId, status, note } = parsed.data;
    const res = await driverRepository.updateTripStatus(driverId, tripId, status, note);

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      trip: res.updatedTrip,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status update failed' },
      { status: 500 }
    );
  }
}
