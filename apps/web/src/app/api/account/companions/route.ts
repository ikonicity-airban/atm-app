import { NextRequest, NextResponse } from 'next/server';
import { companionPassengerSchema } from '@atm/shared';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const companions = await customerRepository.getCompanions(custId);
    return NextResponse.json({ companions });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/companions GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const custId = body.customerId || 'cust-dev-01';
    const parsed = companionPassengerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid companion data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const companion = await customerRepository.addCompanion(custId, parsed.data);
    return NextResponse.json({ success: true, companion }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/companions POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
