import { assignTripDispatchSchema } from '@atm/shared';
import { dispatchRepository } from '@/server/repositories/dispatch.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await req.json().catch(() => null);

    const parsed = assignTripDispatchSchema.safeParse({
      ...body,
      tripId: body?.tripId || tripId,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid assignment input', parsed.error.flatten());
    }

    const updated = await dispatchRepository.assignVehicleAndDriver(parsed.data);
    return jsonResponse(successResponse(updated), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Trip assignment error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
