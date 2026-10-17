import { NextResponse } from 'next/server';
import { driverOtpSendSchema, driverOtpVerifySchema } from '@atm/shared';
import { driverRepository } from '@/server/repositories/driver.ts';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'send';
    const body = await request.json();

    if (action === 'send') {
      const parsed = driverOtpSendSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Valid Nigerian phone number required', details: parsed.error.issues },
          { status: 400 }
        );
      }

      const res = await driverRepository.sendOtp(parsed.data.phone);
      if (!res.success) {
        return NextResponse.json(
          { error: 'Phone number not registered to an active commercial driver' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '6-digit OTP code dispatched via SMS',
        retryAfterSeconds: res.retryAfterSeconds,
      });
    }

    if (action === 'verify') {
      const parsed = driverOtpVerifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Valid phone and 6-digit OTP code required', details: parsed.error.issues },
          { status: 400 }
        );
      }

      const driver = await driverRepository.verifyOtp(parsed.data.phone, parsed.data.otp);
      if (!driver) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP verification code' },
          { status: 401 }
        );
      }

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
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid OTP action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OTP processing failed' },
      { status: 500 }
    );
  }
}
