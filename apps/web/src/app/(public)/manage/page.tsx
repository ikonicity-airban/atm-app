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
} from 'lucide-react';

export default function ManageBookingPage({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
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
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            {/* Specular top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent-500/30 to-transparent" />

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance">
                Find Your Reservation
              </h2>
              <p className="mt-1 text-sm text-slate-600 text-pretty">
                Enter your private booking reference code and the contact phone number registered during checkout.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Lookup Notification</p>
                  <p className="mt-0.5 text-pretty">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-5">
              <div>
                <label htmlFor="booking-ref" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
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
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-4 pr-10 text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Provided in your booking confirmation SMS and on your payment receipt.
                </p>
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Booked Phone Number
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0803 123 4567 or +234..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="min-h-[44px] px-3 text-xs font-semibold text-accent-700 hover:text-accent-800 text-left transition-colors"
                >
                  ⚡ Autofill Demo Booking (ATM-7K9W2P)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] px-7 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  {loading ? 'Verifying...' : 'Retrieve Booking'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* Policy Information Surface */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-6 text-sm text-slate-600 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Info className="h-4 w-4 text-accent-600 shrink-0" />
              Ascent Cancellation &amp; Refund Policy Rules
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed list-disc list-inside">
              <li><strong>Beyond 24 hours:</strong> 90% refund (10% standard processing deduction).</li>
              <li><strong>6 to 24 hours:</strong> 75% refund (25% cancellation deduction).</li>
              <li><strong>2 to 6 hours:</strong> 50% refund (50% late notice deduction).</li>
              <li><strong>Within 2 hours:</strong> Non refundable due to vehicle departure dispatch.</li>
            </ul>
            <p className="text-xs text-slate-500 pt-1">
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-base text-emerald-950">
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
                  <p className="text-xs font-semibold text-emerald-800 pt-1">
                    Your current wallet balance is {formatNaira(cancellationResult.walletBalanceAfterKobo)}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Booking Reference
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {bookingDetails.booking.ref}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetSearch}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Change Booking
              </button>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="min-h-[44px] px-5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Passes
              </button>
            </div>
          </div>

          {/* Premium Trip Schedule Card with Specular Top Sheen */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
            {/* 3D Specular Top Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Corridor Route */}
              <div className="md:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-xs font-bold uppercase tracking-wider text-accent-300">
                  <Car className="h-3.5 w-3.5" />
                  Scheduled Intercity Service
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance text-white">
                  {bookingDetails.booking.trip.originTerminal.city} ({bookingDetails.booking.trip.originTerminal.code}) → {bookingDetails.booking.trip.destinationTerminal.city} ({bookingDetails.booking.trip.destinationTerminal.code})
                </h3>
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent-400" />
                    Boarding at {bookingDetails.booking.trip.originTerminal.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-accent-400" />
                    {formatWatDateTime(bookingDetails.booking.trip.departureTimeUtc).dateStr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent-400" />
                    {formatWatDateTime(bookingDetails.booking.trip.departureTimeUtc).timeStr}
                  </span>
                </div>
              </div>

              {/* Status and Summary */}
              <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 space-y-2 text-right md:text-right">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Reservation Status
                </div>
                <div className="text-lg font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                  <CheckCircle2 className="h-5 w-5" />
                  {bookingDetails.booking.status === 'confirmed' ? 'Confirmed & Ticketed' : bookingDetails.booking.status.toUpperCase()}
                </div>
                <div className="text-xs text-slate-400">
                  {activeTickets.length} active seat(s) • Total {formatNaira(bookingDetails.booking.totalFareKobo)}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger & Ticket Overview Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passenger Manifest */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Passenger Manifest &amp; Toyota Sienna Seat Assignments
                  </h4>
                  <p className="text-xs text-slate-500">
                    Dedicated 5 passenger configuration with air conditioning and extra legroom
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {bookingDetails.tickets.length} total seats
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {bookingDetails.tickets.map((ticket) => {
                  const isCancelled = ticket.status === 'cancelled';
                  return (
                    <div key={ticket.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isCancelled
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-accent-100 text-accent-700'
                          }`}
                        >
                          {ticket.seatNo}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {ticket.passengerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Seat {ticket.seatNo} • Ticket ID: {ticket.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCancelled ? 'Cancelled' : 'Valid Boarding Pass'}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">
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
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <Wallet className="h-4 w-4 text-accent-600" />
                  Traveler Credit Wallet
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {formatNaira(bookingDetails.walletBalanceKobo)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Linked to {bookingDetails.booking.contact.phone}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-pretty">
                  Available credit applies automatically toward your next intercity journey.
                </p>
              </div>

              {/* Cancellation Trigger */}
              {activeTickets.length > 0 && (
                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Need to Change Plans?
                  </h4>
                  <p className="text-xs text-slate-600 text-pretty">
                    Cancel individual seats or your entire reservation. Seats return to live inventory immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full min-h-[44px] rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Official Digital Boarding Passes
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 text-pretty">
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
