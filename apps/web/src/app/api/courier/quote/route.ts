import { parcelQuoteSchema, calculateParcelDeliveryFee, type ParcelCategory } from '@atm/shared';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = parcelQuoteSchema.safeParse(body);

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

    const { category, weightKg, fragile, declaredValueKobo } = parsed.data;
    const breakdown = calculateParcelDeliveryFee({
      category: category as ParcelCategory,
      weightKg,
      fragile,
      declaredValueKobo,
    });

    return Response.json({
      success: true,
      quote: breakdown,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
