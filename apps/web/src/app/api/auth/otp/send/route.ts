import { NextRequest, NextResponse } from 'next/server';
import { phoneOtpSendSchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = phoneOtpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be a valid Nigerian number.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const { token, code } = await customerRepository.createVerificationToken(phone, 'phone_otp');

    return NextResponse.json({
      success: true,
      phone,
      message: `A 6-digit verification code has been dispatched to ${phone}.`,
      cooldownSeconds: 60,
      devOtpCode: code, // surfaced for development convenience
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/otp/send] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
