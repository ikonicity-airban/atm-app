import { pricingRepository } from '@/server/repositories/pricing.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await req.json().catch(() => null);

    if (typeof body?.isActive !== 'boolean') {
      throw AppError.badRequest('Field isActive (boolean) is required');
    }

    const updated = await pricingRepository.toggleRule(ruleId, body.isActive);
    return jsonResponse(successResponse(updated), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Toggle pricing rule error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const deleted = await pricingRepository.deleteRule(ruleId);
    if (!deleted) {
      throw new AppError(`Pricing rule ${ruleId} was not found.`, 404);
    }
    return jsonResponse(successResponse({ deleted: true, ruleId }), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}
