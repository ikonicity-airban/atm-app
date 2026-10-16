import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loginSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user, customer } = await customerRepository.authenticatePassword(
      parsed.data.identifier,
      parsed.data.password
    );

    // Check if 2FA is active
    const tfStatus = await customerRepository.getTwoFactorStatus(user.id);
    if (tfStatus.enabled) {
      const challengeToken = crypto.randomBytes(24).toString('hex');
      return NextResponse.json({
        requires2FA: true,
        challengeToken,
        userId: user.id,
        email: user.email,
      });
    }

    return NextResponse.json({
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
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/login] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
