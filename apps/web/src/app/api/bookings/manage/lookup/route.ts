import { manageBookingLookupSchema } from '@atm/shared';
import { manageBookingRepository } from '@/server/repositories/manage-booking.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json().catch(() => null);
    const parsed = manageBookingLookupSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid lookup inputs', parsed.error.flatten());
    }

    const result = await manageBookingRepository.lookupBooking(parsed.data, ip);
    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Manage lookup error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
