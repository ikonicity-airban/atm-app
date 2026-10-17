import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { driverBoardPassengerSchema } from '@atm/shared';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const driverId = cookieStore.get('atm_driver_id')?.value || 'drv-enugu-01';

    const body = await request.json();
    const parsed = driverBoardPassengerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid passenger boarding data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tripId, seatNo, isBoarded } = parsed.data;
    const ok = await driverRepository.markPassengerBoarded(driverId, tripId, seatNo, isBoarded);

    return NextResponse.json({
      success: ok,
      message: isBoarded ? `Seat ${seatNo} marked boarded` : `Seat ${seatNo} marked not boarded`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Boarding update failed' },
      { status: 500 }
    );
  }
}
