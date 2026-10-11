-- Migration 0001: Booking holds, idempotency, trip unique schedule date, and hold status
-- Ascent Transport Management (ATM Nigeria)

-- 1. Add 'held' to booking_status_enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    INNER JOIN pg_enum en ON typ.oid = en.enumtypid
    WHERE typ.typname = 'booking_status_enum' AND en.enumlabel = 'held'
  ) THEN
    ALTER TYPE booking_status_enum ADD VALUE 'held';
  END IF;
END $$;

-- 2. Add columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hold_token_hash VARCHAR(64);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

-- Unique constraint on idempotency_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_bookings_idempotency_key'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT uq_bookings_idempotency_key UNIQUE (idempotency_key);
  END IF;
END $$;

-- 3. Add trip_date to trips and unique index (schedule_id, trip_date)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_date DATE;

-- Populate existing trip_date from departure_time_utc if empty
UPDATE trips SET trip_date = departure_time_utc::date WHERE trip_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_trip_schedule_date 
  ON trips(schedule_id, trip_date) 
  WHERE schedule_id IS NOT NULL AND trip_date IS NOT NULL;

-- 4. Ensure Ticket has fare_kobo and proper statuses
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fare_kobo BIGINT NOT NULL DEFAULT 0;

-- Ensure partial unique index on Ticket(trip_id, seat_no) for active statuses
CREATE UNIQUE INDEX IF NOT EXISTS ticket_active_seat_idx 
  ON tickets(trip_id, seat_no) 
  WHERE status IN ('held', 'paid', 'checked_in');
