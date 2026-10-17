import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { reportIncidentSchema } from '@atm/shared';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const driverId = cookieStore.get('atm_driver_id')?.value || 'drv-enugu-01';

    const body = await request.json();
    const parsed = reportIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident report payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tripId, category, description, locationNote } = parsed.data;
    const incident = await driverRepository.reportIncident(
      driverId,
      tripId,
      category,
      description,
      locationNote
    );

    return NextResponse.json({
      success: true,
      message: 'Roadside incident advisory submitted to dispatch',
      incident,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit incident report' },
      { status: 500 }
    );
  }
}
