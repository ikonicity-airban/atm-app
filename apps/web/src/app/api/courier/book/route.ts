import { bookParcelSchema, SEED_TERMINALS, formatNaira } from '@atm/shared';
import { StaticParcelRepository } from '@/server/repositories/parcels.ts';

const parcelRepo = new StaticParcelRepository();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bookParcelSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const { parcel, timeline } = await parcelRepo.createParcel(parsed.data);

    const originTerminal = SEED_TERMINALS.find((t) => t.id === parcel.originTerminalId);
    const destTerminal = SEED_TERMINALS.find((t) => t.id === parcel.destinationTerminalId);

    // Mock SMS notification to sender
    console.log(
      `[SMS Stub to ${parcel.senderPhone} via ATMNigeria]: "Ascent Express: Waybill booked! Code: ${parcel.trackingCode}. Drop package at ${originTerminal?.name || 'origin terminal'} within 24h. Total: ${formatNaira(parcel.totalFeeKobo || parcel.feeKobo)}. Track: atm.ng/track?q=${parcel.trackingCode}"`
    );

    return Response.json({
      success: true,
      parcel,
      timeline,
      originTerminal,
      destTerminal,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
