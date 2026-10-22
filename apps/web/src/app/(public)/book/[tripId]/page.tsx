'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import {
  calculateBookingTotal,
  holdSecondsRemaining,
  SIENNA_5_SEAT_LAYOUT,
  bookingHoldInputSchema,
  type BookingHoldInput,
} from '@atm/shared';
import { Stepper, MoneyText, TimeText, PhoneInput } from '@/components/atm/AtmBlocks.tsx';
import { SeatMap } from '@/components/booking/SeatMap.tsx';
import { PassengerCheckoutForm } from '@/components/forms/booking/PassengerCheckoutForm';
import type { PassengerCheckoutFormValues } from '@/components/forms/booking/booking.schema';
import { Dialog } from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { PageShell } from '@/components/layout/Templates.tsx';
import {
  tripRepository,
  type TripSearchResult,
} from '@/server/repositories/trips.ts';
import {
  bookingRepository,
  type HeldBooking,
  type CreateHoldResult,
} from '@/server/repositories/bookings.ts';
import { settingsRepository } from '@/server/repositories/settings.ts';
import { AppError } from '@/lib/errors.ts';
import {
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  CreditCard,
} from 'lucide-react';

export interface BookTripPageProps {
  params?: { tripId?: string } | Promise<{ tripId?: string }>;
  onNavigate?: (path: string) => void;
}

const STEP_NAMES = ['Seats', 'Passengers', 'Review'];

export default function BookTripPage(props?: any) {
  const params = props?.params;
  const onNavigate = props?.onNavigate;
  const [resolvedTripId, setResolvedTripId] = useState<string>('trip-enugu-abuja-01');
  const [trip, setTrip] = useState<TripSearchResult | null>(null);
  const [loadingTrip, setLoadingTrip] = useState<boolean>(true);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);

  // Stepper state (0: Seats, 1: Passengers, 2: Review)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Booking selections
  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerNames, setPassengerNames] = useState<Record<number, string>>({});

  // Contact info
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState<string>('');
  const [smsConsent, setSmsConsent] = useState<boolean>(true);

  // Hold session
  const [holdResult, setHoldResult] = useState<CreateHoldResult | null>(null);
  const [heldBooking, setHeldBooking] = useState<HeldBooking | null>(null);
  const [holdSeconds, setHoldSeconds] = useState<number>(900);
  const [holdExpiredDialogOpen, setHoldExpiredDialogOpen] = useState<boolean>(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState<boolean>(false);

  // Customer Account & Store Credit State (Feature 11)
  const [savedCompanions, setSavedCompanions] = useState<Array<{ id: string; fullName: string; phone: string }>>([]);
  const [customerCreditsKobo, setCustomerCreditsKobo] = useState<number>(0);
  const [applyStoreCredit, setApplyStoreCredit] = useState<boolean>(true);
  const [isCheckingOutCredit, setIsCheckingOutCredit] = useState<boolean>(false);

  // Load customer companions and wallet credits
  useEffect(() => {
    async function loadAccountData() {
      try {
        const [compRes, credRes] = await Promise.all([
          fetch('/api/account/companions?customerId=cust-dev-01'),
          fetch('/api/account/credits?customerId=cust-dev-01'),
        ]);
        const compData = await compRes.json();
        const credData = await credRes.json();
        if (compData.companions) setSavedCompanions(compData.companions);
        if (typeof credData.balanceKobo === 'number') setCustomerCreditsKobo(credData.balanceKobo);
      } catch {
        // Fallback / guest mode
      }
    }
    loadAccountData();
  }, []);

  // Errors & UI states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingHold, setIsSubmittingHold] = useState<boolean>(false);

  // Screen reader polite announcement
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const announcementRef = useRef<string>('');

  // Idempotency token ref
  const idempotencyKeyRef = useRef<string>('');

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  // 1. Resolve Trip ID and URL search parameters
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      const id = resolved?.tripId || 'trip-enugu-abuja-01';
      setResolvedTripId(id);

      // Check URL search parameters for initial step and passenger count
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const pCount = parseInt(searchParams.get('passengers') || '1', 10);
        if (pCount >= 1 && pCount <= 5) {
          setPassengersCount(pCount);
        }

        const stepParam = searchParams.get('step');
        if (stepParam === '2' || stepParam === 'passengers') setCurrentStep(1);
        else if (stepParam === '3' || stepParam === 'review') setCurrentStep(2);
        else setCurrentStep(0);
      }
    });
  }, [params]);

  // 2. Load Trip Details & Occupied Seats
  useEffect(() => {
    let isMounted = true;
    setLoadingTrip(true);

    async function loadData() {
      try {
        const [tripData, seats] = await Promise.all([
          tripRepository.getTripById(resolvedTripId),
          bookingRepository.getOccupiedSeats(resolvedTripId),
        ]);

        if (!isMounted) return;

        if (tripData) {
          setTrip(tripData);
          setOccupiedSeats(seats);
        } else {
          setTrip(null);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage('Failed to load trip details.');
        }
      } finally {
        if (isMounted) setLoadingTrip(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [resolvedTripId]);

  // 3. Draft Persistence & Idempotency Key in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionKey = `atm_draft_${resolvedTripId}`;

    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.contactName) setContactName(data.contactName);
        if (data.contactPhone) setContactPhone(data.contactPhone);
        if (data.contactEmail) setContactEmail(data.contactEmail);
        if (data.nextOfKinPhone) setNextOfKinPhone(data.nextOfKinPhone);
        if (data.passengerNames) setPassengerNames(data.passengerNames);
        if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
          setSelectedSeats(data.selectedSeats);
        }
      }

      // Ensure stable idempotency key for this checkout attempt
      let idemKey = sessionStorage.getItem(`atm_idem_${resolvedTripId}`);
      if (!idemKey) {
        idemKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem(`atm_idem_${resolvedTripId}`, idemKey);
      }
      idempotencyKeyRef.current = idemKey;
    } catch {
      // Ignore sessionStorage errors
    }
  }, [resolvedTripId]);

  // Save drafts when details change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionKey = `atm_draft_${resolvedTripId}`;
    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          contactName,
          contactPhone,
          contactEmail,
          nextOfKinPhone,
          passengerNames,
          selectedSeats,
        })
      );
    } catch {
      // Ignore storage write errors
    }
  }, [resolvedTripId, contactName, contactPhone, contactEmail, nextOfKinPhone, passengerNames, selectedSeats]);

  // 4. Hold Expiry Timer Countdown (Step 3: Review)
  useEffect(() => {
    if (currentStep !== 2 || !holdResult) return;

    const interval = setInterval(() => {
      const remaining = holdSecondsRemaining(holdResult.expiresAt);
      setHoldSeconds(remaining);

      // Screen reader announcements at 2:00 and 0:00 (polite, non-intrusive)
      if (remaining === 120 && announcementRef.current !== '2min') {
        announcementRef.current = '2min';
        setLiveAnnouncement('Notice: 2 minutes remaining on your seat hold.');
      } else if (remaining <= 0) {
        clearInterval(interval);
        setHoldExpiredDialogOpen(true);
        setLiveAnnouncement('Your seat hold has expired. The seats have been released.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep, holdResult]);

  // Handle Stepper synchronization with browser history / URL
  const updateStepInUrl = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setErrorMessage(null);
    setFormErrors({});
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const stepParam = stepIndex === 0 ? 'seats' : stepIndex === 1 ? 'passengers' : 'review';
      url.searchParams.set('step', stepParam);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Seat toggle handler
  const handleSeatToggle = (seatNo: number) => {
    setErrorMessage(null);
    if (selectedSeats.includes(seatNo)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNo));
      // Remove passenger name
      const copy = { ...passengerNames };
      delete copy[seatNo];
      setPassengerNames(copy);
    } else {
      if (selectedSeats.length >= passengersCount) {
        // Replace or keep capped
        return;
      }
      setSelectedSeats([...selectedSeats, seatNo].sort((a, b) => a - b));
    }
  };

  // Passenger count adjustment
  const handlePassengerCountChange = (delta: number) => {
    const nextCount = Math.min(5, Math.max(1, passengersCount + delta));
    setPassengersCount(nextCount);
    // If fewer seats now needed, trim extra selected seats
    if (selectedSeats.length > nextCount) {
      setSelectedSeats(selectedSeats.slice(0, nextCount));
    }
  };

  // Step 1 -> Step 2 validation
  const handleContinueToPassengers = () => {
    if (selectedSeats.length !== passengersCount) {
      setErrorMessage(
        `Please select exactly ${passengersCount} seat${
          passengersCount > 1 ? 's' : ''
        } on the vehicle map to continue.`
      );
      return;
    }

    // Auto-fill lead passenger if empty
    if (selectedSeats[0] && contactName && !passengerNames[selectedSeats[0]]) {
      setPassengerNames((prev) => ({ ...prev, [selectedSeats[0]!]: contactName }));
    }

    updateStepInUrl(1);
  };

  // Step 2 -> Step 3: Create or replace seat hold
  const handleCheckoutSubmit = async (values: PassengerCheckoutFormValues) => {
    setErrorMessage(null);
    setFormErrors({});

    const pMap: Record<number, string> = {};
    values.passengers.forEach((p) => {
      pMap[p.seatNo] = p.fullName;
    });
    setPassengerNames(pMap);
    setContactName(values.contact.fullName);
    setContactPhone(values.contact.phone);
    if (values.contact.email) setContactEmail(values.contact.email);
    if (values.contact.nextOfKinPhone) setNextOfKinPhone(values.contact.nextOfKinPhone);
    setSmsConsent(values.smsConsent);
    setApplyStoreCredit(values.applyStoreCredit);

    const holdPayload: BookingHoldInput = {
      tripId: resolvedTripId,
      seats: values.seats,
      passengers: values.passengers,
      contact: {
        fullName: values.contact.fullName.trim(),
        phone: values.contact.phone.trim(),
        email: values.contact.email?.trim() || undefined,
        nextOfKinPhone: values.contact.nextOfKinPhone?.trim() || undefined,
      },
      consent: true,
      idempotencyKey: idempotencyKeyRef.current || `idem-${Date.now()}`,
    };

    setIsSubmittingHold(true);

    try {
      // In preview/static mode: call bookingRepository.createHold
      const result = await bookingRepository.createHold(holdPayload);
      setHoldResult(result);

      // Fetch held booking for review display
      const booking = await bookingRepository.getHeldBooking(result.ref, result.holdToken);
      setHeldBooking(booking);

      // Store hold token in sessionStorage (NEVER in URL)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`atm_hold_ref_${resolvedTripId}`, result.ref);
        sessionStorage.setItem(`atm_hold_token_${resolvedTripId}`, result.holdToken);
      }

      updateStepInUrl(2);
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.code === 'SEAT_UNAVAILABLE') {
          setErrorMessage(err.message);
          // Refresh occupied seats map
          const freshOccupied = await bookingRepository.getOccupiedSeats(resolvedTripId);
          setOccupiedSeats(freshOccupied);
        } else if (err.code === 'FARE_NOT_CONFIGURED') {
          setErrorMessage('Live online bookings are not enabled for placeholder fares. Please book at the terminal.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to reserve seats. Please try again or refresh the page.');
      }
    } finally {
      setIsSubmittingHold(false);
    }
  };

  // Best-effort release hold when exiting
  const handleReleaseAndExit = async () => {
    if (holdResult) {
      try {
        await bookingRepository.releaseHold(holdResult.ref, holdResult.holdToken);
      } catch {
        // Ignore release failures
      }
    }
    navigate('/trips');
  };

  // Reset after expiration
  const handlePickSeatsAgain = async () => {
    setHoldExpiredDialogOpen(false);
    setHoldResult(null);
    setHeldBooking(null);
    setSelectedSeats([]);
    // Refresh seat map
    const freshOccupied = await bookingRepository.getOccupiedSeats(resolvedTripId);
    setOccupiedSeats(freshOccupied);
    updateStepInUrl(0);
  };

  // Format seconds to mm:ss
  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculation for current selections
  const currentPerSeatFare = trip?.fareKobo ?? 0;
  const currentTotalKobo = calculateBookingTotal(currentPerSeatFare, selectedSeats.length || passengersCount);

  // Guards
  if (loadingTrip) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center space-y-4">
        {/* Hard ban compliant: static spinner without animate-pulse */}
        <div className="w-8 h-8 border-4 border-slate-300 border-t-[#ca2484] rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading trip details and available seats...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center space-y-6">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          {/* Hard ban: plain typography, no pill or card */}
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-balance">Trip Not Found</h1>
          <p className="text-xs text-slate-600 leading-relaxed text-pretty">
            The trip you requested does not exist or has been removed from our dispatch schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl min-h-[44px] cursor-pointer"
        >
          Back to Search Results
        </button>
      </div>
    );
  }

  if (!trip.bookable) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center space-y-6">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-balance">
            Booking Unavailable ({trip.unavailableReason || 'Closed'})
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed text-pretty">
            This scheduled departure is no longer open for online reservations. Bookings close 60 minutes prior to departure.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl min-h-[44px] cursor-pointer"
        >
          View Later Departures
        </button>
      </div>
    );
  }

  return (
    <PageShell width="compact" density="compact" className="pb-32 lg:pb-16 space-y-6 sm:space-y-8">
      {/* Screen reader live notification */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Navigation Header & Stepper */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 0) updateStepInUrl(currentStep - 1);
              else handleReleaseAndExit();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStep === 0 ? 'Back to Trips' : 'Previous Step'}</span>
          </button>

          <span className="text-xs font-mono text-slate-500">
            Toyota Sienna &bull; 5 Seats
          </span>
        </div>

        {/* Hard ban: Plain bold typography, NO pill or card wrapping title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-balance">
            {currentStep === 0
              ? 'Select Your Seats'
              : currentStep === 1
              ? 'Passenger Details'
              : 'Review & Confirm Hold'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {trip.routeTitle} &bull; <TimeText utcDateString={trip.departureTimeUtc} />
          </p>
        </div>

        {/* Linear Stepper */}
        <Stepper steps={STEP_NAMES} currentStep={currentStep} className="pt-2" />
      </div>

      {/* Main Grid: Content + Persistent Trip Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Step Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* Global Alert for Errors */}
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Attention</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* ================= STEP 1: SEATS ================= */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Passenger count control */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Passengers
                  </label>
                  <span className="text-xs text-slate-500">
                    Maximum 5 passengers per Toyota Sienna
                  </span>
                </div>

                <div className="flex items-center border border-slate-300 rounded bg-white min-h-[44px]">
                  <button
                    type="button"
                    disabled={passengersCount <= 1}
                    onClick={() => handlePassengerCountChange(-1)}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[44px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Decrease passenger count"
                  >
                    -
                  </button>
                  <div className="px-4 text-center font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{passengersCount}</span>
                  </div>
                  <button
                    type="button"
                    disabled={passengersCount >= 5}
                    onClick={() => handlePassengerCountChange(1)}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[44px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Increase passenger count"
                  >
                    +
                  </button>
                </div>
              </div>

              {passengersCount === 5 && (
                <p className="text-xs text-slate-500">
                  Travelling with a group of more than 5?{' '}
                  <a
                    href="/corporate"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/corporate');
                    }}
                    className="text-[#ca2484] hover:underline font-semibold"
                  >
                    Request a corporate group booking
                  </a>
                  .
                </p>
              )}

              {/* Instructions */}
              <div className="bg-pink-50/50 border border-pink-100 rounded-lg p-3.5 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">
                    Select {passengersCount} seat{passengersCount > 1 ? 's' : ''}:
                  </span>{' '}
                  <span>Currently selected {selectedSeats.length} of {passengersCount}</span>
                </div>
                {selectedSeats.length === passengersCount && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Complete
                  </span>
                )}
              </div>

              {/* Interactive SeatMap */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
                <SeatMap
                  layout={SIENNA_5_SEAT_LAYOUT}
                  selectedSeats={selectedSeats}
                  occupiedSeats={occupiedSeats}
                  maxSelectable={passengersCount}
                  onSeatToggle={handleSeatToggle}
                />
              </div>

              {/* Desktop Continue Button */}
              <div className="pt-2 hidden lg:block">
                <Button
                  type="button"
                  onClick={handleContinueToPassengers}
                  disabled={selectedSeats.length !== passengersCount}
                  className="w-full min-h-[48px] text-sm font-bold bg-[#ca2484] hover:bg-[#aa1769] text-white"
                >
                  <span>Continue to Passenger Details</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PASSENGERS ================= */}
          {currentStep === 1 && (
            <PassengerCheckoutForm
              tripId={resolvedTripId}
              selectedSeats={selectedSeats}
              initialValues={{
                passengers: selectedSeats.map((seatNo) => ({
                  seatNo,
                  fullName: passengerNames[seatNo] || '',
                })),
                contact: {
                  fullName: contactName,
                  phone: contactPhone,
                  email: contactEmail,
                  nextOfKinPhone: nextOfKinPhone,
                },
                smsConsent: smsConsent,
                applyStoreCredit: applyStoreCredit,
              }}
              savedCompanions={savedCompanions}
              customerCreditsKobo={customerCreditsKobo}
              isSubmitting={isSubmittingHold}
              onBack={() => setCurrentStep(0)}
              onSubmit={handleCheckoutSubmit}
            />
          )}

          {/* ================= STEP 3: REVIEW ================= */}
          {currentStep === 2 && heldBooking && (
            <div className="space-y-6">
              {/* Hold Expiry Countdown Banner (Hard ban: NO animate-pulse, static plain text) */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-pink-400" />
                    <span className="font-bold text-sm tracking-tight">Active Seat Hold</span>
                  </div>
                  <span className="text-xs font-mono bg-slate-800 text-pink-300 px-2.5 py-1 rounded border border-slate-700 font-bold">
                    Ref: {heldBooking.ref}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your seats are temporarily reserved. Complete payment before the countdown expires to prevent release:
                </p>
                <div className="pt-1">
                  <span className="text-2xl font-black font-mono text-white tracking-wider">
                    {formatCountdown(holdSeconds)}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">remaining</span>
                </div>
              </div>

              {/* Trip & Passenger Review Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Departure &amp; Passenger Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Please verify your boarding details before proceeding to payment.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Corridor</span>
                    <span className="font-bold text-slate-900">{heldBooking.trip.routeTitle}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Departure Station</span>
                    <span className="font-medium text-slate-900">{heldBooking.trip.originTerminal.name}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Arrival Station</span>
                    <span className="font-medium text-slate-900">{heldBooking.trip.destinationTerminal.name}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Departure Time</span>
                    <span className="font-medium text-slate-900">
                      <TimeText utcDateString={heldBooking.trip.departureTimeUtc} />
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-medium text-slate-900">Toyota Sienna (5 seats, A/C, refreshments)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Contact Lead</span>
                    <span className="font-medium text-slate-900">
                      {heldBooking.contact.fullName} ({heldBooking.contact.phone})
                    </span>
                  </div>
                </div>

                {/* Seat Assignment List */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Seat Assignments ({heldBooking.seats.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {heldBooking.passengers.map((p) => (
                      <div
                        key={p.seatNo}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-[#ca2484]">Seat {p.seatNo}</span>
                        <span className="font-medium text-slate-800 truncate ml-2">{p.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy Note */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900 block">Carriage &amp; Cancellation Policy</span>
                  <p>
                    Cancellations more than 24 hours prior to departure incur a 10% processing fee. Cancellations between 6 and 24 hours incur 25%. No refunds within 2 hours of departure. // TODO(client): confirm policy with terminal management
                  </p>
                </div>
              </div>

              {/* Desktop Payment Button */}
              <div className="pt-2 hidden lg:block">
                <Button
                  type="button"
                  onClick={() => setPaymentDialogOpen(true)}
                  className="w-full min-h-[48px] text-sm font-bold bg-[#ca2484] hover:bg-[#aa1769] text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Continue to Payment ({formatCountdown(holdSeconds)})</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Persistent Desktop Trip Summary Sidebar */}
        <div className="lg:col-span-5 hidden lg:block sticky top-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Trip Summary
            </h2>

            <div className="space-y-4">
              <div>
                <span className="text-base font-black text-slate-900 block">
                  {trip.routeTitle}
                </span>
                <span className="text-xs text-slate-500">Toyota Sienna &bull; 5 Seats</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#ca2484] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{trip.originTerminal.name}</span>
                    <span className="text-slate-500">{trip.originTerminal.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{trip.destinationTerminal.name}</span>
                    <span className="text-slate-500">{trip.destinationTerminal.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    <TimeText utcDateString={trip.departureTimeUtc} />
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Per-Seat Fare:</span>
                <MoneyText kobo={currentPerSeatFare} isPlaceholder={trip.isPlaceholder} />
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Selected Seats:</span>
                <span className="font-bold text-slate-900">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : `${passengersCount} pending`}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Fare:</span>
                <div className="text-xl font-black text-slate-900">
                  <MoneyText kobo={currentTotalKobo} isPlaceholder={trip.isPlaceholder} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <ul className="text-[11px] text-slate-500 space-y-1">
                <li>&bull; Instant 10-minute hold upon passenger completion</li>
                <li>&bull; Safe Paystack checkout (Cards, Transfers, USSD)</li>
                <li>&bull; Direct departures without roadside pickups</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (min-height 44px, total + primary action) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Fare</span>
          <div className="text-lg font-black text-slate-900">
            <MoneyText kobo={currentTotalKobo} isPlaceholder={trip.isPlaceholder} />
          </div>
          <span className="text-[10px] text-slate-500 block">
            {selectedSeats.length || passengersCount} passenger seat{passengersCount > 1 ? 's' : ''}
          </span>
        </div>

        <div>
          {currentStep === 0 && (
            <Button
              type="button"
              onClick={handleContinueToPassengers}
              disabled={selectedSeats.length !== passengersCount}
              className="px-5 py-2.5 text-xs font-bold bg-[#ca2484] text-white min-h-[44px]"
            >
              <span>Passenger Details</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}

          {currentStep === 1 && (
            <Button
              type="button"
              onClick={() => {
                const formEl = document.querySelector('form');
                formEl?.requestSubmit();
              }}
              disabled={isSubmittingHold}
              className="px-5 py-2.5 text-xs font-bold bg-[#ca2484] text-white min-h-[44px]"
            >
              <span>{isSubmittingHold ? 'Holding...' : 'Review Hold'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="button"
              onClick={() => setPaymentDialogOpen(true)}
              className="px-5 py-2.5 text-xs font-bold bg-[#ca2484] text-white min-h-[44px]"
            >
              <span>Pay Now ({formatCountdown(holdSeconds)})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hold Expiry Dialog */}
      <Dialog
        isOpen={holdExpiredDialogOpen}
        onClose={handlePickSeatsAgain}
        title="Your Seats Were Released"
        description="Your 10-minute temporary seat hold has expired. The reserved seats have been returned to open inventory."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent vehicles leaving with unfilled capacity, unpaid seat holds expire automatically after 10 minutes. Please select your seats again to continue booking.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={handlePickSeatsAgain}
              className="flex-1 min-h-[44px] text-xs font-bold bg-[#ca2484] text-white"
            >
              Pick Seats Again
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/trips')}
              className="flex-1 min-h-[44px] text-xs font-bold"
            >
              Back to Search Results
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Phase 4 Paystack Checkout Modal */}
      <Dialog
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        title="Paystack Secure Checkout"
        description="Choose your preferred payment method to confirm your reservation"
      >
        <div className="space-y-5 pt-2">
          {/* Reservation Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Booking Reference</span>
              <strong className="font-mono text-slate-900 text-sm">{heldBooking?.ref}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Reserved Seats</span>
              <strong className="text-slate-900">Seat(s): {heldBooking?.seats.join(', ')}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-700">Trip Fare Total</span>
              <span className="text-base font-bold text-slate-900">
                <MoneyText kobo={heldBooking?.totalFareKobo} />
              </span>
            </div>

            {/* ATM Store Credit Deduction Section (AC-8) */}
            {customerCreditsKobo > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="flex items-center justify-between p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyStoreCredit}
                      onChange={(e) => setApplyStoreCredit(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-indigo-950">
                      Apply ATM Store Credit
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    Avail: ₦{(customerCreditsKobo / 100).toLocaleString()}
                  </span>
                </label>

                {applyStoreCredit && (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-indigo-700 font-medium">
                      <span>Store Credit Deduction:</span>
                      <span className="font-mono">
                        -₦{(Math.min(heldBooking?.totalFareKobo || 0, customerCreditsKobo) / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                      <span>Net Payable:</span>
                      <span className="font-mono text-base text-[#ca2484]">
                        ₦{(Math.max(0, (heldBooking?.totalFareKobo || 0) - customerCreditsKobo) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Channels Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {applyStoreCredit && customerCreditsKobo >= (heldBooking?.totalFareKobo || 0)
                ? 'Payment Method'
                : 'Supported Payment Channels'}
            </span>

            {applyStoreCredit && customerCreditsKobo >= (heldBooking?.totalFareKobo || 0) ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>100% Covered by Store Credit!</strong> No debit card or bank transfer required. Booking will be confirmed immediately.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#ca2484]" />
                  <span className="font-medium text-slate-800">Cards (Verve, Visa, MC)</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Bank Transfer &amp; USSD</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Assurance */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>256-bit SSL encrypted &bull; Instant HMAC-signed QR ticket generation</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              className="min-h-[44px] text-xs font-bold"
            >
              Back to Review
            </Button>

            {applyStoreCredit && customerCreditsKobo >= (heldBooking?.totalFareKobo || 0) ? (
              <Button
                type="button"
                disabled={isCheckingOutCredit}
                onClick={async () => {
                  setIsCheckingOutCredit(true);
                  try {
                    const ref = heldBooking?.ref || 'ATM-7K9W2P';
                    const appliedKobo = heldBooking?.totalFareKobo || 0;
                    const res = await fetch('/api/bookings/checkout-credit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerId: 'cust-dev-01',
                        bookingRef: ref,
                        holdToken: holdResult?.holdToken || heldBooking?.holdTokenHash || 'dev-token',
                        applyCreditKobo: appliedKobo,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to apply credit');
                    navigate(`/book/success/${ref}?channel=store_credit`);
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Credit checkout failed';
                    alert(`Credit Checkout Error: ${msg}`);
                  } finally {
                    setIsCheckingOutCredit(false);
                  }
                }}
                className="min-h-[44px] text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>{isCheckingOutCredit ? 'Confirming...' : 'Confirm with Store Credit (₦0 Gateway)'}</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  const ref = heldBooking?.ref || 'ATM-7K9W2P';
                  navigate(`/book/success/${ref}?reference=pay-${ref}&mock_payment=true`);
                }}
                className="min-h-[44px] text-xs font-bold bg-[#ca2484] hover:bg-[#aa1769] text-white shadow-xs cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                <span>
                  {applyStoreCredit && customerCreditsKobo > 0
                    ? 'Pay Remaining Balance via Paystack &rarr;'
                    : 'Complete Payment via Paystack &rarr;'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
