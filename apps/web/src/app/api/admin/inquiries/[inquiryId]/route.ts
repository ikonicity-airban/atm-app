import { resolveInquirySchema } from '@atm/shared';
import { inquiriesRepository } from '@/server/repositories/inquiries.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ inquiryId: string }> }
) {
  try {
    const { inquiryId } = await params;
    const body = await req.json().catch(() => null);

    const parsed = resolveInquirySchema.safeParse({
      ...body,
      inquiryId,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid resolution payload', parsed.error.flatten());
    }

    const resolved = await inquiriesRepository.resolveInquiry(parsed.data);
    return jsonResponse(successResponse(resolved), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Resolve inquiry error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
