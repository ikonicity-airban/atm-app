import { NextRequest, NextResponse } from 'next/server';
import { twoFactorVerifySchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = twoFactorVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid two-factor code format', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code, challengeToken } = parsed.data;
    // Extract userId or lookup
    const userId = body.userId || 'user-cust-dev-01';
    await customerRepository.verifyTwoFactor(userId, code);

    const profile = await customerRepository.getCustomerProfile(userId);
    return NextResponse.json({
      success: true,
      verified: true,
      user: {
        id: profile?.userId || userId,
        name: profile?.fullName || 'Traveler',
        email: profile?.email || '',
        role: 'customer',
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/2fa/verify] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
