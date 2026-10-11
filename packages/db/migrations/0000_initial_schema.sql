-- Initial migration for Ascent Transport Management (ATM Nigeria)
-- PostgreSQL / Neon compatible with Drizzle ORM

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role_enum AS ENUM ('customer', 'staff');
CREATE TYPE trip_status_enum AS ENUM ('scheduled', 'boarding', 'in_transit', 'completed', 'cancelled', 'delayed');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'expired');
CREATE TYPE ticket_status_enum AS ENUM ('held', 'paid', 'checked_in', 'cancelled', 'refunded', 'expired');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('card', 'bank_transfer', 'ussd', 'mobile_money', 'pay_at_terminal');
CREATE TYPE booking_type_enum AS ENUM ('individual', 'corporate');
CREATE TYPE parcel_status_enum AS ENUM ('booked', 'received_at_origin', 'in_transit', 'arrived_at_destination', 'out_for_delivery', 'delivered', 'cancelled', 'returned');
CREATE TYPE request_status_enum AS ENUM ('pending', 'reviewed', 'quoted', 'accepted', 'rejected', 'completed');
CREATE TYPE complaint_status_enum AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- 1. Terminals
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phones JSONB NOT NULL DEFAULT '[]',
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. Routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_terminal_id UUID NOT NULL REFERENCES terminals(id),
  destination_terminal_id UUID NOT NULL REFERENCES terminals(id),
  distance_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  estimated_duration_hours NUMERIC(4, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_route_pair UNIQUE (origin_terminal_id, destination_terminal_id)
);

-- 3. Fares
CREATE TABLE IF NOT EXISTS fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  base_fare_kobo BIGINT NOT NULL,
  surge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Vehicles (Toyota Sienna, 5 seats, A/C)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(50) NOT NULL DEFAULT 'Toyota',
  model VARCHAR(50) NOT NULL DEFAULT 'Sienna',
  year INT NOT NULL,
  seat_capacity INT NOT NULL DEFAULT 5,
  seat_layout JSONB NOT NULL,
  has_air_conditioning BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  current_terminal_id UUID REFERENCES terminals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  license_number VARCHAR(50) NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  home_terminal_id UUID REFERENCES terminals(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  departure_time_local TIME NOT NULL,
  days_of_week JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  base_fare_kobo BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 7. Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  departure_time_utc TIMESTAMPTZ NOT NULL,
  status trip_status_enum NOT NULL DEFAULT 'scheduled',
  fare_kobo BIGINT NOT NULL,
  available_seats INT NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trips_route_date ON trips(route_id, departure_time_utc);

-- 8. Better Auth Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  role user_role_enum NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Sessions (Better Auth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Accounts (Better Auth)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Staff Profiles
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role_title VARCHAR(100) NOT NULL DEFAULT 'operations',
  terminal_id UUID REFERENCES terminals(id),
  phone VARCHAR(25) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 12. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(25) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  credits_kobo BIGINT NOT NULL DEFAULT 0,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 13. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref VARCHAR(30) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  trip_id UUID NOT NULL REFERENCES trips(id),
  booking_type booking_type_enum NOT NULL DEFAULT 'individual',
  status booking_status_enum NOT NULL DEFAULT 'pending',
  total_fare_kobo BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  pickup_terminal_id UUID NOT NULL REFERENCES terminals(id),
  dropoff_terminal_id UUID NOT NULL REFERENCES terminals(id),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(25),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(ref);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);

-- 14. Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id),
  seat_no INT NOT NULL CHECK (seat_no >= 1 AND seat_no <= 5),
  passenger_name VARCHAR(150) NOT NULL,
  passenger_gender VARCHAR(20),
  status ticket_status_enum NOT NULL DEFAULT 'held',
  fare_kobo BIGINT NOT NULL,
  check_in_at TIMESTAMPTZ,
  checked_in_by_staff_id UUID REFERENCES staff_users(id),
  qr_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL REQUIREMENT: Partial unique index on Ticket(trip_id, seat_no)
-- where status is 'held', 'paid', or 'checked_in'
CREATE UNIQUE INDEX IF NOT EXISTS ticket_active_seat_idx 
  ON tickets(trip_id, seat_no) 
  WHERE status IN ('held', 'paid', 'checked_in');

-- 15. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  parcel_id UUID,
  provider VARCHAR(50) NOT NULL DEFAULT 'paystack',
  provider_ref VARCHAR(100) NOT NULL UNIQUE,
  amount_kobo BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  method payment_method_enum NOT NULL DEFAULT 'card',
  status payment_status_enum NOT NULL DEFAULT 'pending',
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Cancellations
CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  fee_kobo BIGINT NOT NULL,
  refund_kobo BIGINT NOT NULL,
  reason TEXT NOT NULL,
  processed_by_staff_id UUID REFERENCES staff_users(id),
  status VARCHAR(30) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Credit Ledger
CREATE TABLE IF NOT EXISTS credit_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  delta_kobo BIGINT NOT NULL,
  balance_after_kobo BIGINT NOT NULL,
  reason TEXT NOT NULL,
  reference_booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Parcels
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code VARCHAR(50) NOT NULL UNIQUE,
  sender_name VARCHAR(150) NOT NULL,
  sender_phone VARCHAR(25) NOT NULL,
  sender_email VARCHAR(255),
  receiver_name VARCHAR(150) NOT NULL,
  receiver_phone VARCHAR(25) NOT NULL,
  receiver_address TEXT,
  origin_terminal_id UUID NOT NULL REFERENCES terminals(id),
  destination_terminal_id UUID NOT NULL REFERENCES terminals(id),
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
  fragile BOOLEAN NOT NULL DEFAULT false,
  declared_value_kobo BIGINT,
  fee_kobo BIGINT NOT NULL,
  status parcel_status_enum NOT NULL DEFAULT 'booked',
  paid BOOLEAN NOT NULL DEFAULT false,
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_code);

-- 19. Parcel Events
CREATE TABLE IF NOT EXISTS parcel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location_terminal_id UUID REFERENCES terminals(id),
  description TEXT NOT NULL,
  recorded_by_staff_id UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Charter Requests
CREATE TABLE IF NOT EXISTS charter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(25) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  origin_city VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  number_of_vehicles INT NOT NULL DEFAULT 1,
  is_round_trip BOOLEAN NOT NULL DEFAULT false,
  special_requests TEXT,
  quote_kobo BIGINT,
  status request_status_enum NOT NULL DEFAULT 'pending',
  assigned_staff_id UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Corporate Requests
CREATE TABLE IF NOT EXISTS corporate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  work_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(25) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  monthly_trip_volume_estimate INT,
  notes TEXT,
  status request_status_enum NOT NULL DEFAULT 'pending',
  assigned_staff_id UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  email VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  booking_ref VARCHAR(30),
  parcel_tracking_code VARCHAR(50),
  message TEXT NOT NULL,
  status complaint_status_enum NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  assigned_staff_id UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details_json JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value_json JSONB NOT NULL,
  updated_by_staff_id UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
