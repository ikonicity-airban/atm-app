import { NextRequest, NextResponse } from 'next/server';
import { bookingRepository } from '../../../../server/repositories/bookings.ts';
import { customerRepository } from '../../../../server/repositories/customer.ts';
import { AppError } from '../../../../lib/errors.ts';

export async function GET(req: NextRequest) {
  try {
    const custId = req.nextUrl.searchParams.get('customerId') || 'cust-dev-01';
    const customer = await customerRepository.getCustomerById(custId);
    const customerPhone = customer ? customer.phone : '+2348031234567';

    const allBookings = await bookingRepository.getAllBookings();

    // Match bookings by customer phone or customer ID
    const customerBookings = allBookings.filter((b) => {
      return (
        b.contact?.phone === customerPhone ||
        b.contact?.phone === customer?.phone ||
        b.id === custId ||
        b.ref === 'ATM-7K9W2P' // default seeded demo journey
      );
    });

    return NextResponse.json({
      trips: customerBookings,
      totalCount: customerBookings.length,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/account/trips GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
