import { NextRequest, NextResponse } from 'next/server';
import { charterQuoteInputSchema, calculateCharterQuote } from '@atm/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = charterQuoteInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const quote = calculateCharterQuote(parsed.data);
    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Charter quote error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to calculate charter quote' },
      { status: 500 }
    );
  }
}
