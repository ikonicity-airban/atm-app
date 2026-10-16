import { dispatchRepository } from '@/server/repositories/dispatch.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const manifest = await dispatchRepository.getHighwayManifest(tripId);
    return jsonResponse(successResponse(manifest), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Highway manifest retrieval error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
