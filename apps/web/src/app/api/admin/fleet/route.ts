import { logMaintenanceSchema } from '@atm/shared';
import { fleetRepository } from '@/server/repositories/fleet.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET() {
  try {
    const [vehicles, kpis] = await Promise.all([
      fleetRepository.getAllVehicles(),
      fleetRepository.getKPIs(),
    ]);

    return jsonResponse(
      successResponse({
        vehicles,
        kpis,
      }),
      200
    );
  } catch (err) {
    console.error('Fleet retrieval error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = logMaintenanceSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid maintenance log input', parsed.error.flatten());
    }

    const result = await fleetRepository.logMaintenance(parsed.data);
    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Log maintenance error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
