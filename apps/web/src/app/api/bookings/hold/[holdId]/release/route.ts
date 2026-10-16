import { bookingRepository } from '../../../../../../server/repositories/bookings.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../../../lib/errors.ts';

function extractHoldToken(req: Request, body?: any): string | null {
  const headerToken = req.headers.get('x-hold-token');
  if (headerToken) return headerToken.trim();

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (body && typeof body.holdToken === 'string') {
    return body.holdToken.trim();
  }

  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ holdId: string }> | { holdId: string } }
) {
  try {
    const { holdId } = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const holdToken = extractHoldToken(req, body);

    if (!holdToken) {
      throw AppError.unauthorized('Hold authorization token is required in x-hold-token header or body');
    }

    const released = await bookingRepository.releaseHold(holdId, holdToken);
    return jsonResponse(successResponse({ holdId, released }));
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}
