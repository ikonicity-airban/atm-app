import { NextRequest, NextResponse } from 'next/server';
import { updateCustomerProfileSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const profile = await customerRepository.getCustomerProfile(custId);

    if (!profile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/profile GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const custId = body.customerId || 'cust-dev-01';
    const parsed = updateCustomerProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile update data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await customerRepository.updateProfile(custId, parsed.data);
    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/profile PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
