import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user, customer } = await customerRepository.register(parsed.data);

    // Also dispatch OTP for phone verification
    const { code } = await customerRepository.createVerificationToken(customer.phone, 'phone_otp');

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        customer: {
          id: customer.id,
          phone: customer.phone,
          creditsKobo: customer.creditsKobo,
        },
        phoneVerificationRequired: true,
        devOtpCode: code, // surfaced in dev/test for zero friction
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/register] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
