import { createCustomerInquirySchema } from '@atm/shared';
import { inquiriesRepository } from '@/server/repositories/inquiries.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const query = url.searchParams.get('q') || undefined;

    const [inquiries, kpis] = await Promise.all([
      inquiriesRepository.getInquiries({ status, category, query }),
      inquiriesRepository.getKPIs(),
    ]);

    return jsonResponse(
      successResponse({
        inquiries,
        kpis,
      }),
      200
    );
  } catch (err) {
    console.error('Inquiries retrieval error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createCustomerInquirySchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid customer inquiry input', parsed.error.flatten());
    }

    const created = await inquiriesRepository.createInquiry(parsed.data);
    return jsonResponse(successResponse(created), 201);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Create inquiry error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
