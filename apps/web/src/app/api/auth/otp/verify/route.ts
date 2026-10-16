import { NextRequest, NextResponse } from 'next/server';
import { phoneOtpVerifySchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = phoneOtpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid verification input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;
    await customerRepository.verifyToken(phone, code, 'phone_otp');

    const customer = await customerRepository.getCustomerByPhone(phone);
    let user = null;
    if (customer && customer.userId) {
      const profile = await customerRepository.getCustomerProfile(customer.id);
      if (profile) {
        user = {
          id: profile.userId,
          name: profile.fullName,
          email: profile.email || '',
          role: 'customer' as const,
        };
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      phone,
      user,
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            creditsKobo: customer.creditsKobo,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/otp/verify] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
