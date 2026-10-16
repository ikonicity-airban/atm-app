import { initializePaymentSchema } from '@atm/shared';
import { bookingRepository } from '../../../../server/repositories/bookings.ts';
import { getPaymentProvider } from '../../../../server/payments/index.ts';
import { rateLimiter } from '../../../../server/rate-limiter.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../lib/errors.ts';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimiter.check(`pay-init:${ip}`, 30, 60);

    if (!limit.allowed) {
      throw AppError.rateLimited();
    }

    const body = await req.json().catch(() => null);
    const parsed = initializePaymentSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid initialization request', parsed.error.flatten());
    }

    const { bookingRef, holdToken, email, callbackUrl } = parsed.data;

    // Verify booking hold validity and ownership
    const booking = await bookingRepository.getHeldBooking(bookingRef, holdToken);

    const paymentProvider = getPaymentProvider();
    const contactEmail = email || booking.contact.email || `${booking.ref.toLowerCase()}@tickets.atm.ng`;

    const result = await paymentProvider.initializePayment({
      email: contactEmail,
      amountKobo: booking.totalFareKobo,
      reference: booking.ref,
      callbackUrl: callbackUrl || `/book/success/${booking.ref}`,
      metadata: {
        bookingRef: booking.ref,
        tripId: booking.tripId,
        seats: booking.seats,
        phone: booking.contact.phone,
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
    });

    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Payment initialization error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
