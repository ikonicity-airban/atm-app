import { NextRequest, NextResponse } from 'next/server';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const archive = await customerRepository.exportCustomerData(custId);

    const jsonString = JSON.stringify(archive, null, 2);
    const filename = `ascent-traveler-data-${custId}-${Date.now()}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/export-data GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
