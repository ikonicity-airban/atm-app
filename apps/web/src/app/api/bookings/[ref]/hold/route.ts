import { replaceHoldInputSchema } from '@atm/shared';
import { bookingRepository } from '../../../../../server/repositories/bookings.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../../lib/errors.ts';

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ref: string }> | { ref: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const holdToken = extractHoldToken(req);

    if (!holdToken) {
      throw AppError.unauthorized('Hold authorization token is required in x-hold-token header');
    }

    const booking = await bookingRepository.getHeldBooking(resolvedParams.ref, holdToken);
    return jsonResponse(successResponse(booking));
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ref: string }> | { ref: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const holdToken = extractHoldToken(req, body);

    if (!holdToken) {
      throw AppError.unauthorized('Hold authorization token is required in x-hold-token header or body');
    }

    const parsed = replaceHoldInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.validationError(issue?.message || 'Invalid seats selection', parsed.error.flatten());
    }

    const updated = await bookingRepository.replaceHold(resolvedParams.ref, holdToken, parsed.data.seats);
    return jsonResponse(successResponse(updated));
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ ref: string }> | { ref: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const holdToken = extractHoldToken(req, body);

    if (!holdToken) {
      throw AppError.unauthorized('Hold authorization token is required');
    }

    const released = await bookingRepository.releaseHold(resolvedParams.ref, holdToken);
    return jsonResponse(successResponse({ released }));
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    return jsonResponse(errorResponse(err), 500);
  }
}
