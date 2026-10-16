import { checkInLookupSchema } from '@atm/shared';
import { dispatchRepository } from '@/server/repositories/dispatch.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = checkInLookupSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid lookup criteria', parsed.error.flatten());
    }

    const result = await dispatchRepository.lookupForCheckIn(parsed.data);

    if (!result) {
      throw new AppError('No matching passenger booking found for the provided reference, phone, or QR code.', 404);
    }

    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Check-in lookup error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
