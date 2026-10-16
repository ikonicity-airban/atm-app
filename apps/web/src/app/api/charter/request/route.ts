import { NextRequest, NextResponse } from 'next/server';
import { createCharterRequestSchema } from '@atm/shared';
import { charterRepository } from '../../../../server/repositories/charter.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCharterRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await charterRepository.createRequest(parsed.data);
    return NextResponse.json({ success: true, request: created }, { status: 201 });
  } catch (error: any) {
    console.error('Charter request creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit charter request' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('ref');

    if (!reference) {
      return NextResponse.json({ error: 'Reference query parameter is required' }, { status: 400 });
    }

    const request = await charterRepository.getRequestByReference(reference);
    if (!request) {
      return NextResponse.json({ error: 'Charter request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to lookup request' }, { status: 500 });
  }
}
