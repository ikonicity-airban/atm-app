'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/Templates.tsx';
import { TicketPassCard } from '@/components/booking/TicketPassCard.tsx';
import { CancellationModal } from '@/components/booking/CancellationModal.tsx';
import type { HeldBooking } from '@/server/repositories/bookings.ts';
import type { ManageBookingDetails } from '@/server/repositories/manage-booking.ts';
import {
  formatNaira,
  formatWatDateTime,
  calculateIncidentDelayMinutes,
  type CancellationExecutionResult,
} from '@atm/shared';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Printer,
  RotateCcw,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Info,
  Compass,
  Radio,
  Truck,
} from 'lucide-react';

export default function ManageBookingPage(props?: any) {
  const onNavigate = props?.onNavigate;
  const [refInput, setRefInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<ManageBookingDetails | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<CancellationExecutionResult | null>(null);

  // Check URL query params for auto-fill (e.g. from SMS or success page links)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref');
      const urlPhone = params.get('phone');
      if (urlRef) setRefInput(urlRef.toUpperCase());
      if (urlPhone) setPhoneInput(urlPhone);
    }
  }, []);

  const handleLookup = async (e?: React.FormEvent, overrideRef?: string, overridePhone?: string) => {
    if (e) e.preventDefault();
    const queryRef = (overrideRef || refInput).trim().toUpperCase();
    const queryPhone = (overridePhone || phoneInput).trim();

    if (!queryRef) {
      setError('Please enter your 6 character booking reference code (e.g. ATM-7K9W2P)');
      return;
    }
    if (!queryPhone) {
      setError('Please enter the phone number used during reservation');
      return;
    }

    setLoading(true);
    setError(null);
    setCancellationResult(null);

    try {
      let data = null;
      try {
        const res = await fetch('/api/bookings/manage/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: queryRef,
            phone: queryPhone,
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          data = json.data;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && !fetchErr.message.includes('Failed to fetch') && !fetchErr.message.includes('Unexpected token')) {
          throw fetchErr;
        }
      }
      if (!data) {
        throw new Error('Unable to find booking with the provided reference and phone number.');
      }

      setBookingDetails(data);
      // Sync URL without full page reload
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('ref', queryRef);
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Error looking up booking. Please check your reference and phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setRefInput('ATM-7K9W2P');
    setPhoneInput('08031234567');
    handleLookup(undefined, 'ATM-7K9W2P', '08031234567');
  };

  const handleResetSearch = () => {
    setBookingDetails(null);
    setCancellationResult(null);
    setError(null);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  const handleCancellationSuccess = (result: CancellationExecutionResult) => {
    setCancellationResult(result);
    // Refresh booking details to reflect new ticket statuses and updated wallet
    handleLookup(undefined, refInput, phoneInput);
  };

  const activeTickets = bookingDetails?.tickets.filter((t) => t.status !== 'cancelled') || [];
  const cancelledTickets = bookingDetails?.tickets.filter((t) => t.status === 'cancelled') || [];

  return (
    <PageShell
      width="compact"
      density="compact"
      title="Manage Your Booking"
      description="Look up your reservation with your booking reference and phone number to inspect departure terminals, reprint boarding passes, or process cancellations with fair tiered refunds."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Manage Booking' },
      ]}
    >
      {/* 1. Retrieval Form View (State A) */}
      {!bookingDetails && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
            {/* Specular top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-balance">
                Find Your Reservation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Enter your private booking reference code and the contact phone number registered during checkout.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Lookup Notification</p>
                  <p className="mt-0.5 text-pretty">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-5">
              <div>
                <label htmlFor="booking-ref" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Booking Reference Code
                </label>
                <div className="relative">
                  <input
                    id="booking-ref"
                    type="text"
                    required
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ATM-7K9W2P"
                    maxLength={10}
                    className="w-full min-h-[44px] rounded-xl border border-border bg-card pl-4 pr-10 text-sm font-semibold tracking-wider text-foreground placeholder:text-muted-foreground placeholder:font-normal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Provided in your booking confirmation SMS and on your payment receipt.
                </p>
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Booked Phone Number
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0803 123 4567 or +234..."
                  className="w-full min-h-[44px] rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="min-h-[44px] px-3 text-xs font-semibold text-primary hover:opacity-80 text-left transition-colors"
                >
                  ⚡ Autofill Demo Booking (ATM-7K9W2P)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] px-7 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {loading ? 'Verifying...' : 'Retrieve Booking'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* Policy Information Surface */}
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Info className="h-4 w-4 text-primary shrink-0" />
              Ascent Cancellation &amp; Refund Policy Rules
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed list-disc list-inside">
              <li><strong>Beyond 24 hours:</strong> 90% refund (10% standard processing deduction).</li>
              <li><strong>6 to 24 hours:</strong> 75% refund (25% cancellation deduction).</li>
              <li><strong>2 to 6 hours:</strong> 50% refund (50% late notice deduction).</li>
              <li><strong>Within 2 hours:</strong> Non refundable due to vehicle departure dispatch.</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              Choose instant ATM store credit for zero waiting rebooking, or direct Paystack card reversal.
            </p>
          </div>
        </div>
      )}

      {/* 2. Retrieved Booking Dashboard (State B) */}
      {bookingDetails && (
        <div className="space-y-8 animate-fade-in">
          {/* Success Banner when cancellation just occurred */}
          {cancellationResult && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-300 shadow-sm flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-base text-foreground">
                  Ticket Cancellation Processed Successfully
                </p>
                <p className="text-pretty">
                  Cancelled {cancellationResult.cancelledSeatsCount} seat(s). A net refund of{' '}
                  <strong>{formatNaira(cancellationResult.refundAmountKobo)}</strong> has been disbursed via{' '}
                  <strong>
                    {cancellationResult.disbursementMethod === 'atm_credit'
                      ? 'instant ATM wallet store credit'
                      : 'Paystack card reversal'}
                  </strong>.
                  A confirmation SMS has been dispatched to your contact phone.
                </p>
                {cancellationResult.walletBalanceAfterKobo !== null && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
                    Your current wallet balance is {formatNaira(cancellationResult.walletBalanceAfterKobo)}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                Booking Reference
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {bookingDetails.booking.ref}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/track/journey/${encodeURIComponent(bookingDetails.booking.ref)}?phone=${encodeURIComponent(phoneInput || bookingDetails.booking.contact.phone)}`}
                className="min-h-[44px] px-4 rounded-xl bg-primary hover:opacity-90 text-xs font-bold text-primary-foreground transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              >
                <Compass className="h-4 w-4" />
                Track Live Vehicle
              </a>
              <button
                type="button"
                onClick={handleResetSearch}
                className="min-h-[44px] px-4 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Change Booking
              </button>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="min-h-[44px] px-5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Passes
              </button>
            </div>
          </div>

          {/* Trip Schedule Card */}
          <div className="relative overflow-hidden rounded-2xl bg-card text-card-foreground border border-border p-6 sm:p-8 shadow-sm">
            {/* Specular Top Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Corridor Route */}
              <div className="md:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-xs font-bold uppercase tracking-wider text-primary">
                  <Car className="h-3.5 w-3.5" />
                  Scheduled Intercity Service
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance text-foreground">
                  {bookingDetails.booking.trip.originTerminal.city} ({bookingDetails.booking.trip.originTerminal.code}) → {bookingDetails.booking.trip.destinationTerminal.city} ({bookingDetails.booking.trip.destinationTerminal.code})
                </h3>
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    Boarding at {bookingDetails.booking.trip.originTerminal.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatWatDateTime(bookingDetails.booking.trip.departureTimeUtc).dateStr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {formatWatDateTime(bookingDetails.booking.trip.departureTimeUtc).timeStr}
                  </span>
                </div>
              </div>

              {/* Status and Summary */}
              <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 space-y-2 text-right md:text-right">
                <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Reservation Status
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1.5">
                  <CheckCircle2 className="h-5 w-5" />
                  {bookingDetails.booking.status === 'confirmed' ? 'Confirmed & Ticketed' : bookingDetails.booking.status.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeTickets.length} active seat(s) • Total {formatNaira(bookingDetails.booking.totalFareKobo)}
                </div>
              </div>
            </div>
          </div>

          {/* Live Vehicle Telematics & Corridor Tracking Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    <Radio className="w-3.5 h-3.5 text-primary" />
                    Live Vehicle &amp; Highway Telematics
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/25">
                    {bookingDetails.telematics ? (
                      bookingDetails.telematics.tripStatus === 'in_transit'
                        ? 'En Route (In Transit)'
                        : bookingDetails.telematics.tripStatus === 'delayed'
                        ? 'Advisory Delay'
                        : bookingDetails.telematics.tripStatus === 'boarding'
                        ? 'Boarding'
                        : bookingDetails.telematics.tripStatus === 'completed'
                        ? 'Completed'
                        : 'Scheduled'
                    ) : (
                      'Assigned'
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-primary" />
                    <span>
                      {bookingDetails.telematics?.vehicle.model || 'Toyota Sienna Limited'} • Reg:{' '}
                      <strong className="font-mono text-foreground">
                        {bookingDetails.telematics?.vehicle.plateNumber || 'ENU-418-XY'}
                      </strong>
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Driver: <strong className="text-foreground">{bookingDetails.telematics?.driver.name || 'Emeka Nwosu'}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    ETA:{' '}
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                      {bookingDetails.telematics?.estimatedArrivalWat || '1:45 PM WAT'}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <a
                  href={`/track/journey/${encodeURIComponent(bookingDetails.booking.ref)}?phone=${encodeURIComponent(phoneInput || bookingDetails.booking.contact.phone)}`}
                  className="min-h-[44px] px-5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Compass className="w-4 h-4" />
                  <span>Launch Live GPS Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Roadside Incident Notice on Manage Portal if active */}
            {bookingDetails.telematics?.activeIncidents && bookingDetails.telematics.activeIncidents.length > 0 && bookingDetails.telematics.activeIncidents[0] && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block">Active Highway Advisory Notice</span>
                  <p className="text-muted-foreground leading-relaxed text-pretty">
                    {bookingDetails.telematics.activeIncidents[0].description} (Estimated delay of +{calculateIncidentDelayMinutes(bookingDetails.telematics.activeIncidents)} minutes).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Passenger & Ticket Overview Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passenger Manifest */}
            <div className="md:col-span-2 rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Passenger Manifest &amp; Toyota Sienna Seat Assignments
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Dedicated 5 passenger configuration with air conditioning and extra legroom
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {bookingDetails.tickets.length} total seats
                </span>
              </div>

              <div className="divide-y divide-border">
                {bookingDetails.tickets.map((ticket) => {
                  const isCancelled = ticket.status === 'cancelled';
                  return (
                    <div key={ticket.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isCancelled
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {ticket.seatNo}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isCancelled ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {ticket.passengerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Seat {ticket.seatNo} • Ticket ID: {ticket.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {isCancelled ? 'Cancelled' : 'Valid Boarding Pass'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                          {formatNaira(ticket.fareKobo)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Store Credit Panel */}
            <div className="space-y-4">
              {/* Store Credit Card */}
              <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  <Wallet className="h-4 w-4 text-primary" />
                  Traveler Credit Wallet
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground">
                    {formatNaira(bookingDetails.walletBalanceKobo)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Linked to {bookingDetails.booking.contact.phone}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  Available credit applies automatically toward your next intercity journey.
                </p>
              </div>

              {/* Cancellation Trigger */}
              {activeTickets.length > 0 && (
                <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-foreground">
                    Need to Change Plans?
                  </h4>
                  <p className="text-xs text-muted-foreground text-pretty">
                    Cancel individual seats or your entire reservation. Seats return to live inventory immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full min-h-[44px] rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    Request Ticket Cancellation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Boarding Passes Matrix */}
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Official Digital Boarding Passes
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
                Present this cryptographically signed QR matrix at the terminal check-in gate for instant boarding verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookingDetails.tickets.map((ticket, idx) => (
                <TicketPassCard
                  key={ticket.id}
                  ticket={ticket}
                  booking={bookingDetails.booking}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Cancellation Modal */}
          <CancellationModal
            booking={bookingDetails.booking}
            tickets={bookingDetails.tickets}
            phone={phoneInput || bookingDetails.booking.contact.phone}
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onSuccess={handleCancellationSuccess}
          />
        </div>
      )}
    </PageShell>
  );
}
