import { NextResponse } from 'next/server';
import { driverLoginSchema } from '@atm/shared';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = driverLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid driver credentials', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { identifier, credential, authMethod } = parsed.data;
    const driver = await driverRepository.authenticateWithCredential(
      identifier,
      credential,
      authMethod
    );

    if (!driver) {
      return NextResponse.json(
        { error: 'Invalid credentials or inactive driver account' },
        { status: 401 }
      );
    }

    // Return authenticated session profile (stored in client-side secure cookie or storage)
    const response = NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        driverBadgeId: driver.driverBadgeId,
        fullName: driver.fullName,
        phone: driver.phone,
        email: driver.email,
        assignedTerminalId: driver.assignedTerminalId,
      },
    });

    response.cookies.set('atm_driver_id', driver.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
