import { bookingHoldInputSchema } from '@atm/shared';
import { bookingRepository } from '../../../../server/repositories/bookings.ts';
import { rateLimiter } from '../../../../server/rate-limiter.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../lib/errors.ts';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimiter.check(`hold:${ip}`, 30, 60);

    if (!limit.allowed) {
      throw AppError.rateLimited();
    }

    const body = await req.json().catch(() => null);
    const parsed = bookingHoldInputSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid booking data', parsed.error.flatten());
    }

    const result = await bookingRepository.createHold(parsed.data);
    return jsonResponse(successResponse(result), 201);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Hold creation error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
