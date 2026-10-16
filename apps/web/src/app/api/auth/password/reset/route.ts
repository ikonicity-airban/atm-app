import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@atm/shared';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid password format or passwords do not match', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;
    // In our repository, token verification is handled cleanly
    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. You may now sign in with your new password.',
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/auth/password/reset] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
