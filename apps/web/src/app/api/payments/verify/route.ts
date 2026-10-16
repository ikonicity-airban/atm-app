import { verifyPaymentQuerySchema } from '@atm/shared';
import { getPaymentProvider } from '../../../../server/payments/index.ts';
import { paymentRepository } from '../../../../server/repositories/payments.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../lib/errors.ts';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference') || '';
    const bookingRef = url.searchParams.get('bookingRef') || reference;

    const parsed = verifyPaymentQuerySchema.safeParse({ reference, bookingRef });
    if (!parsed.success) {
      throw AppError.validationError('Payment reference query parameter is required');
    }

    const paymentProvider = getPaymentProvider();
    const verification = await paymentProvider.verifyPayment(parsed.data.reference);

    if (!verification.verified || verification.status !== 'successful') {
      throw AppError.badRequest(
        verification.gatewayResponse || 'Payment has not been completed successfully on Paystack'
      );
    }

    // Resolve channel to allowed union
    const rawChannel = verification.channel || 'card';
    const validChannels = ['card', 'bank_transfer', 'ussd', 'mobile_money', 'pay_at_terminal'] as const;
    const channel = (validChannels as readonly string[]).includes(rawChannel)
      ? (rawChannel as typeof validChannels[number])
      : 'card';

    const result = await paymentRepository.confirmBookingAndIssueTickets({
      bookingRef: parsed.data.bookingRef || parsed.data.reference,
      providerRef: parsed.data.reference,
      amountKobo: verification.amountKobo,
      method: channel,
      gatewayResponse: verification.gatewayResponse,
      metadataJson: verification.metadata,
    });

    return jsonResponse(successResponse(result), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Payment callback verification error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
