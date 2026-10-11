/**
 * Structured error handling and standard API response contracts
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  public static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  public static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  public static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  public static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  public static validationError(message: string, details?: unknown) {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  public static seatUnavailable(conflictingSeats: number[]) {
    return new AppError(
      `Seat${conflictingSeats.length > 1 ? 's' : ''} ${conflictingSeats.join(', ')} ${
        conflictingSeats.length > 1 ? 'are' : 'is'
      } no longer available. Please select another seat.`,
      409,
      'SEAT_UNAVAILABLE',
      { conflictingSeats }
    );
  }

  public static tripNotBookable(reason = 'Booking is closed for this trip') {
    return new AppError(reason, 400, 'TRIP_NOT_BOOKABLE');
  }

  public static fareNotConfigured() {
    return new AppError(
      'Live ticket fare has not been configured for this route yet. Please book at the terminal.',
      400,
      'FARE_NOT_CONFIGURED'
    );
  }

  public static holdExpired() {
    return new AppError('Your seat hold has expired. Please select your seats again.', 410, 'HOLD_EXPIRED');
  }

  public static rateLimited(message = 'Too many requests. Please slow down and try again shortly.') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  public static internal(message = 'An unexpected server error occurred') {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        details?: unknown;
      };
    };

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function errorResponse(error: unknown): ApiResponse<never> {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown server error';
  return {
    success: false,
    error: {
      message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
