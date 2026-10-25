import { NextRequest, NextResponse } from 'next/server';
import { customerPreferencesSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const preferences = await customerRepository.getPreferences(custId);
    return NextResponse.json({ preferences });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/preferences GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const custId = body.customerId || 'cust-dev-01';
    const parsed = customerPreferencesSchema.safeParse(body.preferences || body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await customerRepository.updatePreferences(custId, parsed.data);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/preferences PUT] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
