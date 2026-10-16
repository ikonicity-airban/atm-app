import { parcelRepository } from '@/server/repositories/parcels.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '@/lib/errors.ts';
import type { ParcelStatus } from '@atm/shared';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const terminalId = url.searchParams.get('terminalId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const query = url.searchParams.get('q') || undefined;

    let parcels = await parcelRepository.getAllParcels();

    if (terminalId && terminalId !== 'all') {
      parcels = parcels.filter(
        (p) => p.originTerminalId === terminalId || p.destinationTerminalId === terminalId
      );
    }

    if (status && status !== 'all') {
      parcels = parcels.filter((p) => p.status === status);
    }

    if (query) {
      const q = query.trim().toUpperCase();
      parcels = parcels.filter(
        (p) =>
          p.trackingCode.includes(q) ||
          p.senderPhone.includes(q) ||
          p.receiverPhone.includes(q) ||
          p.senderName.toUpperCase().includes(q) ||
          p.receiverName.toUpperCase().includes(q)
      );
    }

    // Calculate stage counters
    const all = await parcelRepository.getAllParcels();
    const stageCounts = {
      booked: all.filter((p) => p.status === 'booked').length,
      received_at_origin: all.filter((p) => p.status === 'received_at_origin').length,
      in_transit: all.filter((p) => p.status === 'in_transit').length,
      arrived_at_destination: all.filter((p) => p.status === 'arrived_at_destination').length,
      ready_for_pickup: all.filter((p) => p.status === 'ready_for_pickup').length,
      delivered: all.filter((p) => p.status === 'delivered').length,
      total: all.length,
    };

    return jsonResponse(
      successResponse({
        parcels,
        stageCounts,
      }),
      200
    );
  } catch (err) {
    console.error('Admin parcels retrieval error:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const action = body?.action as 'advance_status' | 'verify_pickup';

    if (action === 'verify_pickup') {
      const { trackingCode, pickupCode, staffId } = body;
      if (!trackingCode || !pickupCode) {
        throw AppError.badRequest('trackingCode and pickupCode are required for pickup verification');
      }

      const result = await parcelRepository.verifyPickupAndDeliver(
        trackingCode,
        pickupCode,
        staffId || 'staff-terminal-counter'
      );
      return jsonResponse(successResponse(result), 200);
    }

    if (action === 'advance_status') {
      const { trackingCode, nextStatus, locationTerminalId, description, staffId } = body;
      if (!trackingCode || !nextStatus) {
        throw AppError.badRequest('trackingCode and nextStatus are required to advance status');
      }

      const result = await parcelRepository.updateParcelStatus(
        trackingCode,
        nextStatus as ParcelStatus,
        locationTerminalId,
        description,
        staffId || 'staff-terminal-counter'
      );

      if (!result) {
        throw new AppError(`Waybill ${trackingCode} was not found.`, 404);
      }

      return jsonResponse(successResponse(result), 200);
    }

    throw AppError.badRequest('Valid action (advance_status or verify_pickup) is required');
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    const message = err instanceof Error ? err.message : 'Parcel operation error';
    return jsonResponse(errorResponse(new AppError(message, 400)), 400);
  }
}
