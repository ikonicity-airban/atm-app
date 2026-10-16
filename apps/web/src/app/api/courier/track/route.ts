import { trackParcelSchema, SEED_TERMINALS } from '@atm/shared';
import { StaticParcelRepository } from '@/server/repositories/parcels.ts';

const parcelRepo = new StaticParcelRepository();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    const parsed = trackParcelSchema.safeParse({ query });
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: 'Please enter a valid tracking code or phone number',
        },
        { status: 400 }
      );
    }

    const cleanQuery = parsed.data.query.trim();

    // Check if matching tracking code pattern
    if (cleanQuery.toUpperCase().startsWith('ATM-EXP-')) {
      const result = await parcelRepo.getParcelByTrackingCode(cleanQuery);
      if (!result) {
        return Response.json(
          {
            success: false,
            error: `No parcel found matching tracking code "${cleanQuery}". Please verify and try again.`,
          },
          { status: 404 }
        );
      }

      const originTerminal = SEED_TERMINALS.find((t) => t.id === result.parcel.originTerminalId);
      const destTerminal = SEED_TERMINALS.find((t) => t.id === result.parcel.destinationTerminalId);

      return Response.json({
        success: true,
        parcel: result.parcel,
        timeline: result.timeline,
        originTerminal,
        destTerminal,
      });
    }

    // Otherwise check by phone number
    const parcelsByPhone = await parcelRepo.getParcelsByPhone(cleanQuery);
    if (!parcelsByPhone || parcelsByPhone.length === 0) {
      return Response.json(
        {
          success: false,
          error: `No parcels found associated with phone "${cleanQuery}".`,
        },
        { status: 404 }
      );
    }

    // Return the latest parcel for this phone
    const latestParcel = parcelsByPhone[0]!;
    const result = await parcelRepo.getParcelByTrackingCode(latestParcel.trackingCode);

    const originTerminal = SEED_TERMINALS.find((t) => t.id === latestParcel.originTerminalId);
    const destTerminal = SEED_TERMINALS.find((t) => t.id === latestParcel.destinationTerminalId);

    return Response.json({
      success: true,
      parcel: latestParcel,
      timeline: result?.timeline || [],
      matchedCount: parcelsByPhone.length,
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
