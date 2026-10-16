import { NextRequest, NextResponse } from 'next/server';
import { charterRepository } from '../../../../server/repositories/charter.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const serviceType = searchParams.get('serviceType') || undefined;
    const search = searchParams.get('search') || undefined;

    const requests = await charterRepository.getAllRequests({
      status,
      serviceType,
      search,
    });

    return NextResponse.json({ success: true, count: requests.length, requests });
  } catch (error: any) {
    console.error('Admin requests listing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list charter requests' },
      { status: 500 }
    );
  }
}
