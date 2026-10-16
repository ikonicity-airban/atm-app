import { NextRequest, NextResponse } from 'next/server';
import { twoFactorSetupSchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'user-cust-dev-01';
    const setup = await customerRepository.setupTwoFactor(userId);
    return NextResponse.json({
      success: true,
      secret: setup.secret,
      uri: setup.uri,
      backupCodes: setup.backupCodes,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/2fa/setup] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = twoFactorSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid setup payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = body.userId || 'user-cust-dev-01';

    if (parsed.data.enabled) {
      if (parsed.data.verificationCode) {
        await customerRepository.verifyTwoFactor(userId, parsed.data.verificationCode);
      }
      return NextResponse.json({ success: true, enabled: true });
    } else {
      await customerRepository.disableTwoFactor(userId);
      return NextResponse.json({ success: true, enabled: false });
    }
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/2fa/setup] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
