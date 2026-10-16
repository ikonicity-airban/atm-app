import { createCorridorPricingRuleSchema } from '@atm/shared';
import { pricingRepository } from '@/server/repositories/pricing.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || undefined;

    const [corridors, rules] = await Promise.all([
      pricingRepository.getCorridorSummaries(date),
      pricingRepository.getAllRules(),
    ]);

    return jsonResponse(
      successResponse({
        corridors,
        rules,
      }),
      200
    );
  } catch (err) {
    console.error('Pricing retrieval error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createCorridorPricingRuleSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid pricing rule input', parsed.error.flatten());
    }

    const created = await pricingRepository.createRule(parsed.data);
    return jsonResponse(successResponse(created), 201);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Create pricing rule error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
