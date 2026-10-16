import { updateVehicleStatusSchema } from '@atm/shared';
import { fleetRepository } from '@/server/repositories/fleet.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const vehicle = await fleetRepository.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new AppError(`Vehicle ${vehicleId} not found.`, 404);
    }
    return jsonResponse(successResponse(vehicle), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const body = await req.json().catch(() => null);

    const parsed = updateVehicleStatusSchema.safeParse({
      ...body,
      vehicleId,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid vehicle status update', parsed.error.flatten());
    }

    const updated = await fleetRepository.updateVehicleStatus(parsed.data);
    return jsonResponse(successResponse(updated), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Update vehicle status error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
