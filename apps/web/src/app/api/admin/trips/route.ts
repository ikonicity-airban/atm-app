import { dispatchRepository } from '@/server/repositories/dispatch.ts';
import { successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const terminalId = url.searchParams.get('terminalId') || undefined;
    const date = url.searchParams.get('date') || undefined;

    const [trips, vehicles, drivers] = await Promise.all([
      dispatchRepository.getTripsForDispatch({ terminalId, date }),
      dispatchRepository.getVehicles(terminalId),
      dispatchRepository.getDrivers(terminalId),
    ]);

    return jsonResponse(
      successResponse({
        trips,
        vehicles,
        drivers,
      }),
      200
    );
  } catch (err) {
    console.error('Dispatch trips list error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
