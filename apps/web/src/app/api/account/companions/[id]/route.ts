import { NextRequest, NextResponse } from 'next/server';
import { customerRepository } from '../../../../../server/repositories/customer.ts';
import { AppError } from '../../../../../lib/errors.ts';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    await customerRepository.deleteCompanion(custId, id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/companions/[id] DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
