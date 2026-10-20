'use client';

import React, { useState, useEffect } from 'react';
import {
  SEED_TERMINALS,
  formatNaira,
  PARCEL_STATUS_MAP,
  type ParcelStatus,
} from '@atm/shared';
import type { DbParcel, DbParcelEvent } from '@atm/db';
import { PageShell } from '@/components/layout/Templates.tsx';
import { StaticParcelRepository } from '@/server/repositories/parcels.ts';
import {
  Search,
  Package,
  CheckCircle2,
  MapPin,
  Truck,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Printer,
  ArrowRight,
  Phone,
  Calendar,
  Compass,
  Navigation,
  ExternalLink,
} from 'lucide-react';

const parcelRepo = new StaticParcelRepository();

const TRACKING_STAGES: Array<{
  key: ParcelStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'booked', label: 'Booked', icon: Calendar },
  { key: 'received_at_origin', label: 'At Terminal', icon: Building2 },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'arrived_at_destination', label: 'Arrived', icon: MapPin },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function formatWatDateTime(utcIso: string): string {
  try {
    const d = new Date(utcIso);
    return (
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Lagos',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d) + ' WAT'
    );
  } catch {
    return utcIso;
  }
}

export default function TrackHubPage(props?: any) {
  const onNavigate = (props as { onNavigate?: (path: string) => void } | undefined)?.onNavigate;
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  const [activeTab, setActiveTab] = useState<'journey' | 'parcel'>('journey');

  // Parcel Tracking State
  const [parcelQuery, setParcelQuery] = useState('');
  const [isParcelLoading, setIsParcelLoading] = useState(false);
  const [parcelErrorMsg, setParcelErrorMsg] = useState<string | null>(null);
  const [parcelCopied, setParcelCopied] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{
    parcel: DbParcel;
    timeline: DbParcelEvent[];
  } | null>(null);

  // Passenger Journey State
  const [bookingRef, setBookingRef] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);
  const [journeyErrorMsg, setJourneyErrorMsg] = useState<string | null>(null);
  const [journeyResult, setJourneyResult] = useState<{
    bookingReference: string;
    tripId: string;
    trackingUrl: string;
    status: string;
    corridor: string;
    estimatedArrivalWat: string;
  } | null>(null);

  // Auto-search if query param present in window URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q') || urlParams.get('query');
    const tabParam = urlParams.get('tab');

    if (tabParam === 'parcel') {
      setActiveTab('parcel');
    } else if (tabParam === 'journey') {
      setActiveTab('journey');
    }

    if (qParam) {
      if (qParam.toUpperCase().startsWith('ATM-EXP-')) {
        setActiveTab('parcel');
        setParcelQuery(qParam);
        performParcelSearch(qParam);
      } else if (qParam.toUpperCase().startsWith('ATM-')) {
        setActiveTab('journey');
        setBookingRef(qParam);
      } else {
        setParcelQuery(qParam);
        performParcelSearch(qParam);
      }
    }
  }, []);

  const performParcelSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) {
      setParcelErrorMsg('Please enter a waybill tracking code or sender phone number.');
      return;
    }

    setIsParcelLoading(true);
    setParcelErrorMsg(null);

    try {
      if (clean.toUpperCase().startsWith('ATM-EXP-')) {
        const res = await parcelRepo.getParcelByTrackingCode(clean);
        if (!res) {
          setParcelErrorMsg(`No consignment found with tracking code "${clean}". Please verify your waybill code.`);
          setTrackingResult(null);
        } else {
          setTrackingResult(res);
        }
      } else {
        const parcels = await parcelRepo.getParcelsByPhone(clean);
        if (!parcels || parcels.length === 0) {
          setParcelErrorMsg(`No consignments found associated with phone "${clean}".`);
          setTrackingResult(null);
        } else {
          const first = parcels[0]!;
          const res = await parcelRepo.getParcelByTrackingCode(first.trackingCode);
          setTrackingResult(res);
        }
      }
    } catch (err) {
      setParcelErrorMsg(err instanceof Error ? err.message : 'Failed to search tracking records.');
      setTrackingResult(null);
    } finally {
      setIsParcelLoading(false);
    }
  };

  const handleJourneySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = bookingRef.trim().toUpperCase();
    const cleanPhone = passengerPhone.trim();

    if (!cleanRef) {
      setJourneyErrorMsg('Please enter your ATM booking reference (e.g. ATM-7K9W2P).');
      return;
    }

    if (!cleanPhone) {
      setJourneyErrorMsg('Please enter the passenger contact phone number.');
      return;
    }

    setIsJourneyLoading(true);
    setJourneyErrorMsg(null);

    try {
      const res = await fetch('/api/telematics/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference: cleanRef,
          passengerPhone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJourneyErrorMsg(data?.error || data?.details?.[0] || 'Booking reference not found or phone number does not match.');
        setJourneyResult(null);
      } else {
        setJourneyResult(data);
      }
    } catch (err: any) {
      setJourneyErrorMsg(err?.message || 'Failed to connect to telematics service.');
      setJourneyResult(null);
    } finally {
      setIsJourneyLoading(false);
    }
  };

  const handleCopyParcelCode = () => {
    if (!trackingResult) return;
    navigator.clipboard.writeText(trackingResult.parcel.trackingCode);
    setParcelCopied(true);
    setTimeout(() => setParcelCopied(false), 2000);
  };

  const currentParcel = trackingResult?.parcel;
  const currentTimeline = trackingResult?.timeline || [];
  const currentStatus = (currentParcel?.status || 'booked') as ParcelStatus;
  const currentStatusInfo = PARCEL_STATUS_MAP[currentStatus] || PARCEL_STATUS_MAP.booked;
  const activeStageIndex = currentStatusInfo.stageIndex;

  const originTerminal = currentParcel
    ? SEED_TERMINALS.find((t) => t.id === currentParcel.originTerminalId)
    : null;
  const destinationTerminal = currentParcel
    ? SEED_TERMINALS.find((t) => t.id === currentParcel.destinationTerminalId)
    : null;

  return (
    <PageShell
      title="Live Fleet & Shipment Tracking"
      description="Real-time highway transit tracking for Ascent Transport Management passenger journeys and express courier consignments across Nigeria."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Track' }]}
      density="spacious"
    >
      {/* Mode Switcher Segmented Control */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-muted/60 border border-border shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('journey')}
            className={`min-h-[44px] px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none ${
              activeTab === 'journey'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="w-4 h-4 text-primary" />
            <span>Passenger Journey</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parcel')}
            className={`min-h-[44px] px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none ${
              activeTab === 'parcel'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-4 h-4 text-primary" />
            <span>Courier Freight</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PASSENGER JOURNEY TRACKING */}
      {activeTab === 'journey' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 sm:p-8 shadow-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <form onSubmit={handleJourneySearch} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="journey-ref-input" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Booking Reference Code
                  </label>
                  <div className="relative">
                    <Navigation className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      id="journey-ref-input"
                      type="text"
                      placeholder="e.g. ATM-7K9W2P"
                      value={bookingRef}
                      onChange={(e) => setBookingRef(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-foreground text-sm font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="journey-phone-input" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Passenger Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      id="journey-phone-input"
                      type="text"
                      placeholder="e.g. 08031234567"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-foreground text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isJourneyLoading}
                  className="w-full sm:w-auto min-h-[44px] py-3 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 motion-reduce:transform-none"
                >
                  {isJourneyLoading ? (
                    <span>Verifying Journey...</span>
                  ) : (
                    <>
                      <span>Track Vehicle Telematics</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-xs text-muted-foreground text-center sm:text-right">
                  <span>Demo active reference: </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingRef('ATM-7K9W2P');
                      setPassengerPhone('08031234567');
                    }}
                    className="font-mono text-primary hover:underline font-bold ml-1"
                  >
                    ATM-7K9W2P
                  </button>
                </div>
              </div>
            </form>
          </div>

          {journeyErrorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="text-sm font-medium">{journeyErrorMsg}</div>
            </div>
          )}

          {journeyResult && (
            <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                    {journeyResult.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {journeyResult.bookingReference}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {journeyResult.corridor}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Estimated Terminal Arrival: <span className="font-bold text-slate-900">{journeyResult.estimatedArrivalWat}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(journeyResult.trackingUrl)}
                className="min-h-[44px] py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>Open Live Journey Timeline</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURIER FREIGHT TRACKING */}
      {activeTab === 'parcel' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 sm:p-8 shadow-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performParcelSearch(parcelQuery);
              }}
              className="max-w-2xl"
            >
              <label htmlFor="parcel-input" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                Waybill Tracking Code or Phone Number
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-muted-foreground" />
                  <input
                    id="parcel-input"
                    type="text"
                    placeholder="e.g. ATM-EXP-7K3N9R or 08031234567"
                    value={parcelQuery}
                    onChange={(e) => setParcelQuery(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-input bg-background pl-11 pr-4 py-3 text-foreground text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isParcelLoading}
                  className="min-h-[44px] py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 motion-reduce:transform-none"
                >
                  {isParcelLoading ? <span>Searching...</span> : <span>Track Freight</span>}
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Sample test codes:</span>
              <button
                type="button"
                onClick={() => {
                  setParcelQuery('ATM-EXP-7K3N9R');
                  performParcelSearch('ATM-EXP-7K3N9R');
                }}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border border-border font-mono text-primary font-semibold transition-colors cursor-pointer"
              >
                ATM-EXP-7K3N9R (In Transit)
              </button>
              <button
                type="button"
                onClick={() => {
                  setParcelQuery('ATM-EXP-2M8W4P');
                  performParcelSearch('ATM-EXP-2M8W4P');
                }}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border border-border font-mono text-emerald-600 dark:text-emerald-400 font-semibold transition-colors cursor-pointer"
              >
                ATM-EXP-2M8W4P (Ready for Pickup)
              </button>
            </div>
          </div>

          {parcelErrorMsg && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-destructive" />
              <div className="text-sm font-medium">{parcelErrorMsg}</div>
            </div>
          )}

          {currentParcel && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header card */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-2xl font-mono font-extrabold text-foreground">
                      {currentParcel.trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyParcelCode}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border border-border text-xs font-semibold text-foreground flex items-center gap-1 transition-all active:scale-95 cursor-pointer motion-reduce:transform-none"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{parcelCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {originTerminal?.city} → {destinationTerminal?.city}
                    </span>
                    <span>·</span>
                    <span>Booked {formatWatDateTime(currentParcel.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStatusInfo.badgeClass}`}
                  >
                    <span>{currentStatusInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Progress Stepper with Container Queries */}
              <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 sm:p-8 shadow-sm">
                <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-6">
                  Shipment Progression
                </h3>

                <div className="grid grid-cols-2 @md/page:grid-cols-6 gap-3">
                  {TRACKING_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= activeStageIndex;
                    const isCurrent = idx === activeStageIndex;
                    const IconComp = stage.icon;

                    return (
                      <div
                        key={stage.key}
                        className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                          isCurrent
                            ? 'bg-primary/10 border-primary shadow-xs'
                            : isCompleted
                            ? 'bg-muted/50 border-border'
                            : 'bg-card border-dashed border-border opacity-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : isCompleted
                              ? 'bg-foreground/80 text-background'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-bold mt-1">
                            Current Stage
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custody Event History */}
              <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 sm:p-8 shadow-sm">
                <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-6">
                  Custody Event History
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {currentTimeline.map((ev, index) => {
                    const terminal = SEED_TERMINALS.find((t) => t.id === ev.locationTerminalId);

                    return (
                      <div key={ev.id || index} className="relative">
                        <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background shadow-sm" />
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2 mb-1">
                            <span className="text-xs font-bold text-foreground capitalize">
                              {ev.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60">·</span>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {formatWatDateTime(ev.createdAt)}
                            </span>
                            {terminal && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-medium">
                                {terminal.city} ({terminal.code})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {ev.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Book parcel callout */}
              <div className="p-6 rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-0.5">Need to book another package?</h4>
                  <p className="text-xs text-muted-foreground">
                    Book express courier freight with same-day departure across our fleet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/courier')}
                  className="min-h-[44px] py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer motion-reduce:transform-none"
                >
                  <span>Book Parcel Delivery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
