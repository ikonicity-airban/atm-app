'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Shield,
  Car,
  MapPin,
  ArrowRight,
  Sparkles,
  Camera,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  SEED_TERMINALS,
  BRAND,
  type CheckInBookingResult,
  type CheckInPassenger,
} from '@atm/shared';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/Select';
import { dispatchRepository } from '@/server/repositories/dispatch.ts';

export default function AdminCheckInPage() {
  const [selectedTerminal, setSelectedTerminal] = useState<string>('term-enugu-ogui');
  const [searchInput, setSearchInput] = useState<string>('ATM-7K9W2P');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeBooking, setActiveBooking] = useState<CheckInBookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Perform search
  const handleLookup = async (queryValue?: string) => {
    const term = (queryValue || searchInput).trim();
    if (!term) {
      setErrorMessage('Please enter a booking reference (ATM-XXXXXX) or passenger phone number.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const isPhone = term.startsWith('+') || /^0\d{9,10}$/.test(term.replace(/\s+/g, ''));
      const isRef = term.toUpperCase().startsWith('ATM-');

      const payload = isPhone
        ? { phone: term }
        : isRef
        ? { ref: term.toUpperCase() }
        : { qrPayload: term };

      let data: CheckInBookingResult | null = null;
      try {
        const res = await fetch('/api/admin/check-in/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          data = json.data;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!data) {
        data = await dispatchRepository.lookupForCheckIn(payload);
      }

      if (!data) {
        throw new Error('No booking found matching your criteria.');
      }

      setActiveBooking(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lookup failed.';
      setErrorMessage(message);
      setActiveBooking(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Initial load lookup
  useEffect(() => {
    handleLookup('ATM-7K9W2P');
  }, []);

  // Board individual seat or full group
  const handleBoardSeats = async (seatNumbers: number[]) => {
    if (!activeBooking) return;
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      let updatedBooking: CheckInBookingResult | null = null;
      try {
        const res = await fetch('/api/admin/check-in/board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: activeBooking.tripId,
            bookingRef: activeBooking.ref,
            seatNumbers,
            staffId: 'staff-terminal-enugu-01',
            staffName: 'Obiora Nwachukwu',
          }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          updatedBooking = json.data.updatedBooking;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!updatedBooking) {
        const result = await dispatchRepository.checkInSeats({
          tripId: activeBooking.tripId,
          bookingRef: activeBooking.ref,
          seatNumbers,
          staffId: 'staff-terminal-enugu-01',
          staffName: 'Obiora Nwachukwu',
        });
        updatedBooking = result.updatedBooking;
      }

      setActiveBooking(updatedBooking);
      setSuccessNotice(`Successfully checked in seat(s): ${seatNumbers.join(', ')}.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Boarding action failed.';
      setErrorMessage(message);
    }
  };

  // Standby release action (15-min departure cutoff)
  const handleStandbyRelease = async (seatNumbers: number[]) => {
    if (!activeBooking) return;
    const confirmed = window.confirm(
      `Confirm standby release for seat(s) ${seatNumbers.join(', ')}? This returns the seat to live inventory for terminal walk-in passengers.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      let updatedBooking: CheckInBookingResult | null = null;
      try {
        const res = await fetch('/api/admin/check-in/standby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: activeBooking.tripId,
            bookingRef: activeBooking.ref,
            seatNumbers,
            reason: 'Passenger no-show at 15-minute departure cutoff',
            staffId: 'staff-supervisor-01',
          }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          updatedBooking = json.data.updatedBooking;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!updatedBooking) {
        const result = await dispatchRepository.releaseStandbySeats({
          tripId: activeBooking.tripId,
          bookingRef: activeBooking.ref,
          seatNumbers,
          reason: 'Passenger no-show at 15-minute departure cutoff',
          staffId: 'staff-supervisor-01',
        });
        updatedBooking = result.updatedBooking;
      }

      setActiveBooking(updatedBooking);
      setSuccessNotice(`Seat(s) ${seatNumbers.join(', ')} successfully returned to walk-in standby inventory.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Standby release failed.';
      setErrorMessage(message);
    }
  };

  // Camera QR scanner handlers
  const startCamera = async () => {
    setScannerOpen(true);
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (e) {
      console.warn('Camera permission denied or camera not found:', e);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setScannerOpen(false);
    setCameraActive(false);
  };

  const simulateQrScan = (refCode: string) => {
    stopCamera();
    setSearchInput(refCode);
    handleLookup(refCode);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title rests directly on background */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gate Boarding &amp; Passenger Check-In
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phone-first passenger verification and Toyota Sienna seat boarding for terminal marshals.
          </p>
        </div>

        {/* Terminal Station Selector */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <Select
            value={selectedTerminal}
            onValueChange={(val) => {
              if (typeof val === 'string') setSelectedTerminal(val);
            }}
          >
            <SelectTrigger startIcon={MapPin} className="text-xs font-medium min-h-[38px]">
              <SelectValue placeholder="Terminal Bay" />
            </SelectTrigger>
            <SelectPopup>
              {SEED_TERMINALS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Fast Search & QR Scanning Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Booking Ref (ATM-XXXXXX) or Phone (+234 / 080...)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSearching ? 'Verifying...' : 'Find Reservation'}
          </button>

          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Scan QR Pass</span>
          </button>
        </form>

        {/* Demo Fast Fill Buttons for Quick Testing */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Quick Test Records:</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('ATM-7K9W2P');
              handleLookup('ATM-7K9W2P');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition-colors"
          >
            ATM-7K9W2P (Party of 2)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('ATM-8M3X1Q');
              handleLookup('ATM-8M3X1Q');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition-colors"
          >
            ATM-8M3X1Q (Boarded Single)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('ATM-9P2Z4V');
              handleLookup('ATM-9P2Z4V');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition-colors"
          >
            ATM-9P2Z4V (Standby Candidate)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('08031234567');
              handleLookup('08031234567');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition-colors"
          >
            08031234567 (Phone Search)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successNotice}</div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Boarding Details Card */}
      {activeBooking && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Corridor Banner */}
          <div className="bg-slate-900 text-white p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
                  <span>REFERENCE: {activeBooking.ref}</span>
                  <span>•</span>
                  <span>BOOKING ID: {activeBooking.bookingId}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
                  <span>{activeBooking.originTerminal.name}</span>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span>{activeBooking.destinationTerminal.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Departs: {activeBooking.departureTimeWat} (WAT)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-orange-400" />
                    Vehicle: {activeBooking.vehicle?.registrationNumber || 'Assigned at Bay'} ({activeBooking.vehicle?.model || 'Toyota Sienna'})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-400" />
                    Driver: {activeBooking.driver?.fullName || 'Station Dispatcher'}
                  </span>
                </div>
              </div>

              {/* Status and Master Action */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    activeBooking.bookingStatus === 'checked_in'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}
                >
                  {activeBooking.bookingStatus === 'checked_in' ? 'All Seats Boarded' : 'Boarding in Progress'}
                </span>

                {/* Bulk Board Button */}
                {activeBooking.passengers.some((p) => p.status === 'paid') && (
                  <button
                    type="button"
                    onClick={() => {
                      const unboarded = activeBooking.passengers
                        .filter((p) => p.status === 'paid')
                        .map((p) => p.seatNo);
                      handleBoardSeats(unboarded);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Board Entire Party ({activeBooking.passengers.filter((p) => p.status === 'paid').length} Remaining)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sienna 5-Passenger Cabin Boarding Map (AC-2) */}
          <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-orange-600" />
                  Toyota Sienna 5-Passenger Cabin Boarding Map
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify passengers into their assigned Sienna seats. Partial parties can board independently.
                </p>
              </div>

              {/* Standby Alert Banner */}
              {activeBooking.isDepartureCutoffPassed && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>15-Min Cutoff Active (Standby Release Eligible)</span>
                </div>
              )}
            </div>

            {/* Visual Sienna Cabin Layout */}
            <div className="max-w-xl mx-auto bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              {/* Windshield / Driver Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-400">Front Windshield</span>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="font-medium text-slate-700">Driver: {activeBooking.driver?.fullName || 'Assigned'}</span>
                </div>
              </div>

              {/* Row 1: Front Passenger (Seat 1) */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                  Steering &amp; Dashboard
                </div>
                {renderSeatCard(1, activeBooking, handleBoardSeats, handleStandbyRelease)}
              </div>

              {/* Row 2: Middle Captain Chairs (Seat 2 & Seat 3) */}
              <div className="grid grid-cols-2 gap-3">
                {renderSeatCard(2, activeBooking, handleBoardSeats, handleStandbyRelease)}
                {renderSeatCard(3, activeBooking, handleBoardSeats, handleStandbyRelease)}
              </div>

              {/* Row 3: Rear Seats (Seat 4 & Seat 5) */}
              <div className="grid grid-cols-2 gap-3">
                {renderSeatCard(4, activeBooking, handleBoardSeats, handleStandbyRelease)}
                {renderSeatCard(5, activeBooking, handleBoardSeats, handleStandbyRelease)}
              </div>

              {/* Trunk Cargo Space */}
              <div className="pt-2 text-center text-xs text-slate-400 font-medium uppercase tracking-widest border-t border-slate-100">
                Luggage &amp; Courier Freight Bay
              </div>
            </div>
          </div>

          {/* Passenger Emergency Roster Table */}
          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Verified Passenger Manifest &amp; Emergency Next-of-Kin
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Seat</th>
                    <th className="p-3">Passenger Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Emergency Contact</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeBooking.passengers.map((passenger) => (
                    <tr key={passenger.seatNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Seat {passenger.seatNo}</td>
                      <td className="p-3 font-semibold text-slate-800">{passenger.passengerName}</td>
                      <td className="p-3 font-mono text-slate-600">{passenger.phone}</td>
                      <td className="p-3 text-slate-600">
                        <div>{passenger.emergencyContactName || 'N/A'}</div>
                        <div className="font-mono text-slate-400">{passenger.emergencyContactPhone || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
                            passenger.status === 'checked_in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : passenger.isStandbyReleased
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {passenger.status === 'checked_in'
                            ? 'Boarded ✓'
                            : passenger.isStandbyReleased
                            ? 'Standby Released'
                            : 'Ready to Board'}
                        </span>
                        {passenger.checkInAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Boarded at: {new Date(passenger.checkInAt).toLocaleTimeString('en-GB')}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {passenger.status === 'paid' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleBoardSeats([passenger.seatNo])}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-sm transition-colors min-h-[36px]"
                            >
                              Board
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStandbyRelease([passenger.seatNo])}
                              className="px-2 py-1 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded font-medium text-xs transition-colors min-h-[36px]"
                              title="Release seat to standby queue if passenger is absent 15m before departure"
                            >
                              Release Standby
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanning Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">Boarding Pass Camera Scanner</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-center space-y-4">
              <div className="relative aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-orange-500/50">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-slate-400 text-xs space-y-2">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                    <p>Camera feed initializing or not supported on this browser context.</p>
                  </div>
                )}

                {/* Viewfinder Overlay Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-orange-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="text-[11px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                    Align QR Boarding Code
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  Point tablet camera at traveler&apos;s digital PDF ticket or printed boarding pass QR.
                </p>

                {/* Quick Simulator Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Instant Simulator (Simulate Scanner Detect):</span>
                  <button
                    type="button"
                    onClick={() => simulateQrScan('ATM-7K9W2P')}
                    className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded font-semibold transition-colors"
                  >
                    Simulate Scanned Pass: ATM-7K9W2P
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateQrScan('ATM-8M3X1Q')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
                  >
                    Simulate Scanned Pass: ATM-8M3X1Q
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Seat Card Renderer for Toyota Sienna Cabin layout
function renderSeatCard(
  seatNo: number,
  booking: CheckInBookingResult,
  onBoard: (seats: number[]) => void,
  onStandby: (seats: number[]) => void
) {
  const passenger = booking.passengers.find((p) => p.seatNo === seatNo);
  const isThisBookingSeat = Boolean(passenger);

  if (!isThisBookingSeat) {
    return (
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>Seat {seatNo}</span>
          <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-600">Other Passenger</span>
        </div>
        <div className="text-xs text-slate-400 italic">Booked on alternate reservation</div>
      </div>
    );
  }

  const isBoarded = passenger?.status === 'checked_in';
  const isReleased = passenger?.isStandbyReleased || passenger?.status === 'cancelled';

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[105px] ${
        isBoarded
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-sm'
          : isReleased
          ? 'bg-red-50/80 border-red-200 text-red-900 opacity-80'
          : 'bg-white border-orange-300 text-slate-900 shadow-sm ring-1 ring-orange-200'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold">Seat {seatNo}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isBoarded
              ? 'bg-emerald-200 text-emerald-800'
              : isReleased
              ? 'bg-red-200 text-red-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {isBoarded ? 'Boarded ✓' : isReleased ? 'Standby Released' : 'Ready'}
        </span>
      </div>

      <div className="my-1.5">
        <div className="text-xs font-bold truncate">{passenger?.passengerName}</div>
        <div className="text-[11px] font-mono text-slate-500 truncate">{passenger?.phone}</div>
      </div>

      <div className="pt-1">
        {isBoarded ? (
          <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified &amp; Boarded
          </div>
        ) : isReleased ? (
          <div className="text-[10px] font-medium text-red-600">Released to Walk-ins</div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBoard([seatNo])}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded text-xs font-bold transition-colors min-h-[36px]"
            >
              Board Seat
            </button>
            <button
              type="button"
              onClick={() => onStandby([seatNo])}
              className="px-2 py-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded text-[11px] font-semibold transition-colors min-h-[36px]"
              title="Release seat to walk-in standby"
            >
              Standby
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
