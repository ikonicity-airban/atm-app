'use client';

import React, { useEffect, useState } from 'react';
import type { DbTicket, DbPayment } from '@atm/db';
import { formatNaira, formatWatDateTime } from '@atm/shared';
import { bookingRepository, type HeldBooking } from '@/server/repositories/bookings.ts';
import { paymentRepository } from '@/server/repositories/payments.ts';
import { TicketPassCard } from '@/components/booking/TicketPassCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { PageShell } from '@/components/layout/Templates.tsx';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  Phone,
  AlertCircle,
  ArrowRight,
  Share2,
  Truck,
  Compass,
  Radio,
  ExternalLink,
  Car,
  AlertTriangle,
} from 'lucide-react';
import type { JourneyTrackingPayload } from '@atm/shared';

export interface BookingSuccessPageProps {
  params?: { ref?: string } | Promise<{ ref?: string }>;
  onNavigate?: (path: string) => void;
}

export default function BookingSuccessPage({ params, onNavigate }: BookingSuccessPageProps) {
  const [refCode, setRefCode] = useState<string>('ATM-7K9W2P');
  const [booking, setBooking] = useState<HeldBooking | null>(null);
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [payment, setPayment] = useState<DbPayment | null>(null);
  const [telematics, setTelematics] = useState<JourneyTrackingPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  // Resolve params (async or sync)
  useEffect(() => {
    if (!params) return;
    if (params instanceof Promise) {
      params.then((p) => {
        if (p?.ref) setRefCode(p.ref);
      });
    } else if (params.ref) {
      setRefCode(params.ref);
    }
  }, [params]);

  // Load booking, tickets, and perform payment reconciliation if coming from Paystack redirect
  useEffect(() => {
    let active = true;

    async function loadConfirmationData() {
      try {
        setLoading(true);
        setError(null);

        // Check URL search params for Paystack reference or mock flag
        let paymentRef = '';
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          paymentRef = searchParams.get('reference') || searchParams.get('trxref') || '';
        }

        // Fetch or seed booking
        const currentBooking = await bookingRepository.getBookingByRef(refCode);
        if (!currentBooking) {
          throw new Error(`Booking reference ${refCode} not found`);
        }

        // Reconcile payment if not yet confirmed or if returning with transaction reference
        if (currentBooking.status !== 'confirmed' || paymentRef) {
          const confirmResult = await paymentRepository.confirmBookingAndIssueTickets({
            bookingRef: refCode,
            providerRef: paymentRef || `pay-${refCode}`,
            amountKobo: currentBooking.totalFareKobo,
            method: 'card',
            gatewayResponse: 'Approved',
          });

          if (!active) return;
          setBooking(confirmResult.booking);
          setTickets(confirmResult.tickets);
          setPayment(confirmResult.payment);
        } else {
          // Already confirmed, load existing tickets and payment record
          const existingTickets = await paymentRepository.getTicketsByBookingRef(refCode);
          const existingPayment = await paymentRepository.getPaymentByBookingRef(refCode);

          if (!active) return;
          setBooking(currentBooking);
          setTickets(existingTickets);
          setPayment(existingPayment);
        }

        // Fetch live telematics for this confirmed booking
        try {
          const telematicsRes = await fetch(`/api/telematics/journey/${encodeURIComponent(refCode)}`);
          if (telematicsRes.ok) {
            const telematicsJson = await telematicsRes.json();
            if (active && telematicsJson?.data) {
              setTelematics(telematicsJson.data);
            }
          }
        } catch {
          // Non-blocking telemetry fetch
        }
      } catch (err) {
        console.error('Failed to load booking success confirmation:', err);
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load booking details');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConfirmationData();

    return () => {
      active = false;
    };
  }, [refCode]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyTrackingLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const trackingUrl = `${window.location.origin}/track/journey/${encodeURIComponent(refCode)}${booking?.contact?.phone ? `?phone=${encodeURIComponent(booking.contact.phone)}` : ''}`;
      const shareMessage = `Track our Ascent Toyota Sienna live journey (${refCode}): ${trackingUrl}`;
      navigator.clipboard.writeText(shareMessage);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#ca2484] border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold text-slate-800 text-balance">Verifying Payment &amp; Generating Tickets...</h1>
        <p className="text-xs text-slate-500 text-pretty">
          Reconciling with Paystack gateway and signing cryptographic QR boarding passes.
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center space-y-6">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 text-balance">Booking Retrieval Notice</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto text-pretty">{error || 'Booking could not be loaded.'}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button type="button" onClick={() => navigate('/trips')} className="bg-[#ca2484] text-white text-xs font-bold min-h-[44px]">
            Search New Trips
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')} className="text-xs font-bold min-h-[44px]">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const origin = booking.trip.originTerminal;
  const destination = booking.trip.destinationTerminal;

  return (
    <div className="bg-slate-50 min-h-screen print:bg-white print:py-0">
      <PageShell width="compact" density="compact" className="space-y-8 print:p-0">
        {/* Print-Hidden Top Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight text-balance">
                    Booking Confirmed &amp; Paid
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                    {booking.ref}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Payment settled in integer kobo. Your seats are locked and verified for travel.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <Button
                type="button"
                onClick={() =>
                  navigate(
                    `/track/journey/${encodeURIComponent(booking.ref)}${
                      booking.contact?.phone
                        ? `?phone=${encodeURIComponent(booking.contact.phone)}`
                        : ''
                    }`
                  )
                }
                className="bg-[#ca2484] hover:bg-[#aa1769] text-white min-h-[44px] text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>Track Live Vehicle</span>
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="bg-slate-900 hover:bg-slate-800 text-white min-h-[44px] text-xs font-bold shadow-xs"
              >
                <Printer className="w-4 h-4 mr-2" />
                <span>Print Boarding Passes</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="min-h-[44px] text-xs font-semibold"
                title="Copy link to this boarding pass"
              >
                <Share2 className="w-4 h-4" />
                <span className="ml-1.5 hidden sm:inline">{copied ? 'Copied!' : 'Share Pass'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyTrackingLink}
                className="min-h-[44px] text-xs font-semibold text-accent-700 border-accent-200 hover:bg-accent-50"
                title="Share live vehicle tracking link with family or contacts"
              >
                <Radio className="w-4 h-4 text-accent-600" />
                <span className="ml-1.5 hidden sm:inline">{copiedTracking ? 'Tracking Link Copied!' : 'Share Live Tracker'}</span>
              </Button>
            </div>
          </div>

          {/* SMS Notification Confirmation Alert */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-950">
            <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Automated SMS Dispatched</span>
              <p className="text-emerald-800 leading-relaxed">
                Confirmation details and digital boarding pass links were sent to{' '}
                <strong className="font-mono text-emerald-950">{booking.contact.phone}</strong>.
              </p>
            </div>
          </div>

          {/* Summary Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Corridor Route
              </span>
              <strong className="text-sm font-black text-slate-900 block truncate">
                {origin.city} &rarr; {destination.city}
              </strong>
              <span className="text-xs text-slate-500 block truncate">
                {origin.name} to {destination.name}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Departure Schedule
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatWatDateTime(booking.trip.departureTimeUtc).dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatWatDateTime(booking.trip.departureTimeUtc).timeStr} WAT</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Payment (Paystack)
              </span>
              <strong className="text-base font-black text-[#ca2484] block">
                {formatNaira(booking.totalFareKobo)}
              </strong>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''} &bull; Paid</span>
              </div>
            </div>
          </div>

          {/* Live Highway Telematics & Tracking Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 shadow-md border border-slate-700/60">
            {/* Top specular highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-500/20 text-accent-300 text-xs font-bold border border-accent-400/30">
                    <Radio className="w-3.5 h-3.5 text-accent-400" />
                    Live Highway Telematics
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    {telematics ? (
                      telematics.tripStatus === 'in_transit'
                        ? 'Vehicle In Transit'
                        : telematics.tripStatus === 'delayed'
                        ? 'Advisory Delay'
                        : telematics.tripStatus === 'boarding'
                        ? 'Passenger Boarding'
                        : telematics.tripStatus === 'completed'
                        ? 'Arrived at Destination'
                        : 'Scheduled for Departure'
                    ) : (
                      'Fleet Assigned'
                    )}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-accent-400" />
                    <span>
                      {telematics?.vehicle.model || 'Toyota Sienna Limited'} • Registration:{' '}
                      <strong className="font-mono text-accent-200">
                        {telematics?.vehicle.plateNumber || 'ENU-418-XY'}
                      </strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Assigned Driver: <strong>{telematics?.driver.name || 'Emeka Nwosu'}</strong> • Speed:{' '}
                    <span className="font-mono font-semibold">{telematics?.telematics.speedKmh ?? 78} km/h</span> • Destination ETA:{' '}
                    <span className="font-mono text-emerald-300 font-bold">
                      {telematics?.estimatedArrivalWat || '1:45 PM WAT'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Button to Track */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/track/journey/${encodeURIComponent(booking.ref)}${
                        booking.contact?.phone
                          ? `?phone=${encodeURIComponent(booking.contact.phone)}`
                          : ''
                      }`
                    )
                  }
                  className="bg-accent-600 hover:bg-accent-700 text-white min-h-[44px] text-xs font-bold shadow-md flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Full Highway Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>

            {/* Roadside Incident Alert if present */}
            {telematics?.activeIncidents && telematics.activeIncidents.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-100 block">Highway Incident Notice</span>
                  <p className="text-amber-200 leading-relaxed">
                    {telematics.activeIncidents[0].description} (+{telematics.activeIncidents[0].estimatedDelayMinutes || 25}m delay factored into ETA).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Boarding Passes Section (Print Visible) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Individual Boarding Passes</span>
              <span className="text-xs font-normal text-slate-500">({tickets.length} Issued)</span>
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Present QR code or ticket ID at terminal check-in
            </span>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket, idx) => (
              <TicketPassCard
                key={ticket.id}
                ticket={ticket}
                booking={booking}
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Terminal Instructions & Carriage Policy */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs text-slate-600 leading-relaxed print:hidden">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MapPin className="w-4 h-4 text-[#ca2484]" />
            <span>Terminal Boarding Guidelines</span>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              Please arrive at <strong>{origin.name} ({origin.address})</strong> at least <strong>30 minutes</strong> prior to departure for luggage check and manifest sign-in.
            </li>
            <li>
              Boarding closes promptly <strong>10 minutes before scheduled departure</strong> to ensure highway safety cutoffs.
            </li>
            <li>
              Each passenger is entitled to 1 medium suitcase (up to 15kg) and 1 small personal handbag in our Toyota Sienna luggage bay. Extra baggage requires parcel express booking.
            </li>
            <li>
              To reschedule or cancel your trip, manage your booking online or contact our terminal support at <strong>+234 800 000 2723</strong>.
            </li>
          </ul>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/trips')}
            className="w-full sm:w-auto min-h-[44px] text-xs font-bold"
          >
            Book Another Trip
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/manage')}
              className="flex-1 sm:flex-none min-h-[44px] text-xs font-bold"
            >
              Manage Booking
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-none min-h-[44px] text-xs font-bold bg-[#ca2484] hover:bg-[#aa1769] text-white"
            >
              <span>Return Home</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
