export type UserRole = 'customer' | 'staff';

export type TripStatus =
  | 'scheduled'
  | 'boarding'
  | 'in_transit'
  | 'completed'
  | 'cancelled'
  | 'delayed';

export type BookingStatus =
  | 'held'
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type TicketStatus =
  | 'held'
  | 'paid'
  | 'checked_in'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type PaymentStatus =
  | 'pending'
  | 'successful'
  | 'failed'
  | 'refunded';

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'ussd'
  | 'mobile_money'
  | 'pay_at_terminal';

export type BookingType = 'individual' | 'corporate';

export type ParcelStatus =
  | 'booked'
  | 'received_at_origin'
  | 'in_transit'
  | 'arrived_at_destination'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type RequestStatus =
  | 'pending'
  | 'reviewed'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'completed';

export type ComplaintStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'dismissed';

export interface SeatLayoutItem {
  seatNo: number;
  label: string;
  row: number;
  column: number;
  isDriver?: boolean;
}

export interface VehicleSeatLayout {
  totalSeats: number;
  driverSeat: string;
  seats: SeatLayoutItem[];
}

export interface CancellationPolicyRule {
  hoursBeforeDeparture: number;
  feePercentage: number; // e.g. 10 = 10%
  flatFeeKobo?: number;
}

export interface CancellationPolicy {
  rules: CancellationPolicyRule[];
  noRefundHoursBefore: number; // e.g. 2 hours before
}

export * from './dispatch.ts';
export * from './fleet.ts';
export * from './pricing.ts';
export * from './inquiries.ts';
export * from './customer.ts';
export * from './charter.ts';
export * from './seo.ts';
export * from './driver.ts';
