import { NextRequest, NextResponse } from 'next/server';
import { applyCheckoutCreditSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applyCheckoutCreditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credit checkout payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const custId = body.customerId || 'cust-dev-01';
    const { bookingRef, holdToken, applyCreditKobo } = parsed.data;

    const result = await customerRepository.applyCreditToBookingHold(
      custId,
      bookingRef,
      holdToken,
      applyCreditKobo
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/bookings/checkout-credit] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
