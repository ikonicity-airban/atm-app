import { boardPassengerSchema } from '@atm/shared';
import { dispatchRepository } from '@/server/repositories/dispatch.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = boardPassengerSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid boarding request', parsed.error.flatten());
    }

    const result = await dispatchRepository.checkInSeats(parsed.data);
    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Check-in boarding error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
