import { NextRequest, NextResponse } from 'next/server';
import { updateCharterRequestSchema } from '@atm/shared';
import { charterRepository } from '../../../../../server/repositories/charter.ts';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const request = await charterRepository.getRequestById(id);

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch request' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCharterRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await charterRepository.updateRequest(id, parsed.data);
    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Update charter request error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}
