import type { ParcelStatus, BookingStatus, TicketStatus, TripStatus } from '../types/index.ts';

export const PARCEL_STATUS_FLOW: Record<ParcelStatus, readonly ParcelStatus[]> = {
  booked: ['received_at_origin', 'cancelled'],
  received_at_origin: ['in_transit', 'cancelled'],
  in_transit: ['arrived_at_destination', 'returned'],
  arrived_at_destination: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'arrived_at_destination', 'returned'],
  delivered: [],
  cancelled: [],
  returned: [],
} as const;

export function canTransitionParcelStatus(
  current: ParcelStatus,
  target: ParcelStatus
): boolean {
  if (current === target) return true;
  const allowed = PARCEL_STATUS_FLOW[current];
  return allowed.includes(target);
}

export const BOOKING_STATUS_FLOW: Record<BookingStatus, readonly BookingStatus[]> = {
  held: ['pending', 'confirmed', 'cancelled', 'expired'],
  pending: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['checked_in', 'cancelled', 'completed'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: [],
} as const;

export function canTransitionBookingStatus(
  current: BookingStatus,
  target: BookingStatus
): boolean {
  if (current === target) return true;
  const allowed = BOOKING_STATUS_FLOW[current];
  return allowed.includes(target);
}

export const TICKET_STATUS_FLOW: Record<TicketStatus, readonly TicketStatus[]> = {
  held: ['paid', 'expired', 'cancelled'],
  paid: ['checked_in', 'cancelled', 'refunded'],
  checked_in: ['completed' as any, 'cancelled'],
  cancelled: ['refunded'],
  refunded: [],
  expired: [],
} as const;

export const TRIP_STATUS_FLOW: Record<TripStatus, readonly TripStatus[]> = {
  scheduled: ['boarding', 'delayed', 'cancelled'],
  boarding: ['in_transit', 'delayed', 'cancelled'],
  delayed: ['boarding', 'in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
} as const;
