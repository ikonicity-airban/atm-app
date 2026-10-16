import { paystackWebhookEventSchema } from '@atm/shared';
import { getPaymentProvider } from '../../../../server/payments/index.ts';
import { paymentRepository } from '../../../../server/repositories/payments.ts';
import { AppError, jsonResponse, errorResponse } from '../../../../lib/errors.ts';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    const provider = getPaymentProvider();
    const isValidSignature = provider.verifyWebhookSignature(signature, rawBody);

    if (!isValidSignature) {
      console.warn('[Paystack Webhook] Invalid signature rejected');
      return jsonResponse(errorResponse(AppError.unauthorized('Invalid Paystack signature')), 400);
    }

    const payload = JSON.parse(rawBody);
    const parsed = paystackWebhookEventSchema.safeParse(payload);

    if (!parsed.success) {
      console.warn('[Paystack Webhook] Unrecognized webhook event payload structure');
      // Return 200 to acknowledge webhook delivery even if unsupported event type
      return jsonResponse({ status: 'ignored', message: 'Event not recognized' }, 200);
    }

    const event = parsed.data;

    // Handle successful charge event
    if (event.event === 'charge.success') {
      const data = event.data;
      const bookingRef =
        (typeof data.metadata?.bookingRef === 'string' && data.metadata.bookingRef) ||
        data.reference;

      const rawChannel = data.channel || 'card';
      const validChannels = ['card', 'bank_transfer', 'ussd', 'mobile_money', 'pay_at_terminal'] as const;
      const channel = (validChannels as readonly string[]).includes(rawChannel)
        ? (rawChannel as typeof validChannels[number])
        : 'card';

      await paymentRepository.confirmBookingAndIssueTickets({
        bookingRef,
        providerRef: data.reference,
        amountKobo: data.amount,
        method: channel,
        gatewayResponse: data.gateway_response || 'Approved',
        metadataJson: data.metadata,
      });

      console.log(`[Paystack Webhook] Successfully processed charge.success for ref ${bookingRef}`);
    }

    return jsonResponse({ status: 'success' }, 200);
  } catch (err) {
    console.error('[Paystack Webhook] Internal processing error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
