import { bookingRepository } from '../../../../../server/repositories/bookings.ts';
import { tripRepository } from '../../../../../server/repositories/trips.ts';
import { AppError, successResponse, errorResponse, jsonResponse } from '../../../../../lib/errors.ts';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      throw AppError.validationError('Trip ID is required');
    }

    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw AppError.notFound(`Trip with ID ${tripId} not found`);
    }

    const occupiedSeats = await bookingRepository.getOccupiedSeats(tripId);
    const totalSeats = 5; // Dedicated Toyota Sienna 5-passenger configuration
    const availableCount = Math.max(0, totalSeats - occupiedSeats.length);

    return jsonResponse(
      successResponse({
        tripId,
        totalSeats,
        occupiedSeats,
        availableCount,
      })
    );
  } catch (err) {
    if (err instanceof AppError) {
      return jsonResponse(errorResponse(err), err.statusCode);
    }
    console.error('Error fetching seat occupancy:', err);
    return jsonResponse(errorResponse(err), 500);
  }
}
