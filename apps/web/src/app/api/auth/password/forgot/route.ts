import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email required', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const { token, code } = await customerRepository.createVerificationToken(email, 'password_reset');

    return NextResponse.json({
      success: true,
      message: `Password reset instructions dispatched to ${email}`,
      devResetToken: token,
      devOtpCode: code,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/password/forgot] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
