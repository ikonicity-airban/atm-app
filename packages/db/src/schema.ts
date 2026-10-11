/**
 * Ascent Transport Management (ATM Nigeria) - PostgreSQL / Drizzle ORM Schema
 * 
 * Strict specifications:
 * - Integer KOBO for all monetary values
 * - UUID primary keys
 * - created_at and updated_at on all tables
 * - Soft-delete flags (deleted_at) on entities
 * - Partial unique index on Ticket(trip_id, seat_no) where status IN ('held', 'paid', 'checked_in')
 * - Unique Customer.phone, Booking.ref, Parcel.tracking_code, Payment.provider_ref
 * - Vehicle.seat_layout JSON describing 5-passenger Toyota Sienna
 * - Better Auth compliant tables (user, session, account)
 */

import type { VehicleSeatLayout } from '@atm/shared';

export interface DbTerminal {
  id: string; // UUID
  code: string; // ENU, ABJ, etc.
  name: string;
  city: string;
  state: string;
  address: string;
  phones: string[];
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbRoute {
  id: string; // UUID
  originTerminalId: string;
  destinationTerminalId: string;
  distanceKm: number;
  estimatedDurationHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbFare {
  id: string; // UUID
  routeId: string;
  baseFareKobo: number; // Integer kobo
  surgeMultiplier: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbVehicle {
  id: string; // UUID
  registrationNumber: string; // e.g., ENU-342-AA
  make: string; // Toyota
  model: string; // Sienna
  year: number;
  seatCapacity: number; // 5 passenger seats
  seatLayout: VehicleSeatLayout; // 5-seat Sienna layout
  hasAirConditioning: boolean;
  status: 'active' | 'maintenance' | 'retired';
  currentTerminalId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbDriver {
  id: string; // UUID
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  homeTerminalId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbSchedule {
  id: string; // UUID
  routeId: string;
  departureTimeLocal: string; // HH:mm:ss in Africa/Lagos (e.g. 06:30:00)
  daysOfWeek: number[]; // [0,1,2,3,4,5,6]
  baseFareKobo: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbTrip {
  id: string; // UUID
  scheduleId: string | null;
  routeId: string;
  vehicleId: string | null;
  driverId: string | null;
  departureTimeUtc: string; // ISO UTC
  tripDate?: string | null; // YYYY-MM-DD
  status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled' | 'delayed';
  fareKobo: number; // Final locked fare for this trip
  availableSeats: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbCustomer {
  id: string; // UUID
  phone: string; // Unique, normalized E.164
  fullName: string;
  email: string | null;
  creditsKobo: number; // Ledger balance in kobo
  userId: string | null; // Optional link to auth user
  createdAt: string;
  updatedAt: string;
}

export interface DbUser {
  id: string; // UUID
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: 'customer' | 'staff'; // Staff created by admin only
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbAccount {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbStaffUser {
  id: string; // UUID
  userId: string; // FK -> User
  roleTitle: string; // 'management' | 'operations' | 'terminal_operator'
  terminalId: string | null;
  phone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbBooking {
  id: string; // UUID
  ref: string; // Unique, e.g. ATM-7K9W2P
  customerId: string;
  tripId: string;
  bookingType: 'individual' | 'corporate';
  status: 'held' | 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired';
  totalFareKobo: number;
  holdTokenHash?: string | null;
  idempotencyKey?: string | null;
  holdExpiresAt?: string | null;
  expiresAt: string; // Checkout hold expiry
  pickupTerminalId: string;
  dropoffTerminalId: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbTicket {
  id: string; // UUID
  bookingId: string;
  tripId: string;
  seatNo: number; // 1 to 5
  passengerName: string;
  passengerGender: string | null;
  status: 'held' | 'paid' | 'checked_in' | 'cancelled' | 'refunded' | 'expired';
  fareKobo: number;
  checkInAt: string | null;
  checkedInByStaffId: string | null;
  qrPayload: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbPayment {
  id: string; // UUID
  bookingId: string | null;
  parcelId: string | null;
  provider: 'paystack' | 'terminal_pos' | 'credit_balance';
  providerRef: string; // Unique reference from Paystack
  amountKobo: number;
  currency: string; // NGN
  method: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | 'pay_at_terminal';
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbCancellation {
  id: string; // UUID
  bookingId: string;
  customerId: string;
  feeKobo: number;
  refundKobo: number;
  reason: string;
  processedByStaffId: string | null;
  status: 'requested' | 'approved' | 'refunded' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface DbCreditLedger {
  id: string; // UUID
  customerId: string;
  deltaKobo: number; // positive or negative
  balanceAfterKobo: number;
  reason: string;
  referenceBookingId: string | null;
  createdAt: string;
}

export interface DbParcel {
  id: string; // UUID
  trackingCode: string; // Unique, e.g. ATM-EXP-8B4M2Q
  senderName: string;
  senderPhone: string;
  senderEmail: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string | null;
  originTerminalId: string;
  destinationTerminalId: string;
  category: string;
  description: string;
  weightKg: number;
  fragile: boolean;
  declaredValueKobo: number | null;
  feeKobo: number;
  status:
    | 'booked'
    | 'received_at_origin'
    | 'in_transit'
    | 'arrived_at_destination'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  paid: boolean;
  assignedVehicleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbParcelEvent {
  id: string; // UUID
  parcelId: string;
  status: string;
  locationTerminalId: string | null;
  description: string;
  recordedByStaffId: string | null;
  createdAt: string;
}

export interface DbCharterRequest {
  id: string; // UUID
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate: string | null;
  numberOfVehicles: number;
  isRoundTrip: boolean;
  specialRequests: string | null;
  quoteKobo: number | null;
  status: 'pending' | 'reviewed' | 'quoted' | 'accepted' | 'rejected' | 'completed';
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbCorporateRequest {
  id: string; // UUID
  companyName: string;
  contactPerson: string;
  workEmail: string;
  contactPhone: string;
  serviceType: string;
  monthlyTripVolumeEstimate: number | null;
  notes: string | null;
  status: 'pending' | 'reviewed' | 'quoted' | 'accepted' | 'rejected' | 'completed';
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbComplaint {
  id: string; // UUID
  fullName: string;
  phone: string;
  email: string | null;
  category: string;
  bookingRef: string | null;
  parcelTrackingCode: string | null;
  message: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes: string | null;
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbNotification {
  id: string; // UUID
  channel: 'sms' | 'whatsapp' | 'email';
  recipient: string;
  subject: string | null;
  body: string;
  provider: 'termii' | 'resend' | 'stub';
  providerMessageId: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
}

export interface DbAuditLog {
  id: string; // UUID
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  detailsJson: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface DbSetting {
  id: string; // UUID
  key: string; // e.g. 'cancellation_policy', 'credit_rules', 'message_templates'
  valueJson: Record<string, unknown>;
  updatedByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}
