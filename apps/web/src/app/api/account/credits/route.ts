import { NextRequest, NextResponse } from 'next/server';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const balanceKobo = await customerRepository.getCreditBalance(custId);
    const ledger = await customerRepository.getCreditLedger(custId);

    return NextResponse.json({
      balanceKobo,
      balanceNaira: balanceKobo / 100,
      ledger,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/credits GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
