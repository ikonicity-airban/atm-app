import { cancellationQuoteInputSchema } from '@atm/shared';
import { manageBookingRepository } from '@/server/repositories/manage-booking.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = cancellationQuoteInputSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid cancellation quote request', parsed.error.flatten());
    }

    const result = await manageBookingRepository.quoteCancellation(parsed.data);
    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Cancellation quote error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
