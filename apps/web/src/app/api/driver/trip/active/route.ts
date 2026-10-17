import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cookieStore = await cookies();
    const driverId = url.searchParams.get('driverId') || cookieStore.get('atm_driver_id')?.value || 'drv-enugu-01';

    const { trip, manifest, cachedManifest } = await driverRepository.getActiveTrip(driverId);
    const incidents = trip ? await driverRepository.getDriverIncidents(trip.id) : [];

    return NextResponse.json({
      success: true,
      trip,
      manifest,
      cachedManifest,
      incidents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch active trip' },
      { status: 500 }
    );
  }
}
