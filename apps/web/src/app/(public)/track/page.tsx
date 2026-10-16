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
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d) + ' WAT';
  } catch {
    return utcIso;
  }
}

export default function TrackParcelPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active tracking data
  const [trackingResult, setTrackingResult] = useState<{
    parcel: DbParcel;
    timeline: DbParcelEvent[];
  } | null>(null);

  // Auto-search if query param present in window URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q') || urlParams.get('query');
    if (qParam) {
      setQuery(qParam);
      performSearch(qParam);
    }
  }, []);

  const performSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) {
      setErrorMsg('Please enter a tracking code or phone number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (clean.toUpperCase().startsWith('ATM-EXP-')) {
        const res = await parcelRepo.getParcelByTrackingCode(clean);
        if (!res) {
          setErrorMsg(`No consignment found with tracking code "${clean}". Please verify your reference.`);
          setTrackingResult(null);
        } else {
          setTrackingResult(res);
        }
      } else {
        // Search by phone
        const parcels = await parcelRepo.getParcelsByPhone(clean);
        if (!parcels || parcels.length === 0) {
          setErrorMsg(`No consignments found associated with phone "${clean}".`);
          setTrackingResult(null);
        } else {
          const first = parcels[0]!;
          const res = await parcelRepo.getParcelByTrackingCode(first.trackingCode);
          setTrackingResult(res);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to search tracking records.');
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleCopyCode = () => {
    if (!trackingResult) return;
    navigator.clipboard.writeText(trackingResult.parcel.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentParcel = trackingResult?.parcel;
  const currentTimeline = trackingResult?.timeline || [];

  const originTerminal = currentParcel
    ? SEED_TERMINALS.find((t) => t.id === currentParcel.originTerminalId)
    : null;
  const destinationTerminal = currentParcel
    ? SEED_TERMINALS.find((t) => t.id === currentParcel.destinationTerminalId)
    : null;

  // Determine active stage index for stepper
  const currentStatus = (currentParcel?.status || 'booked') as ParcelStatus;
  const currentStatusInfo = PARCEL_STATUS_MAP[currentStatus] || PARCEL_STATUS_MAP.booked;
  const activeStageIndex = currentStatusInfo.stageIndex;

  return (
    <PageShell
      title="Track Courier Parcel"
      description={`Real-time chain of custody tracking for intercity express consignments. Enter your unique waybill tracking code (ATM-EXP-XXXXXX) or booked phone number to inspect real-time highway transit and collection readiness.`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Track Parcel' },
      ]}
      density="spacious"
    >
      {/* Hero Section */}

      {/* Search Input Box */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <label htmlFor="tracking-input" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
            Waybill Tracking Code or Phone Number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="tracking-input"
                type="text"
                placeholder="e.g. ATM-EXP-7K3N9R or 08031234567"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-slate-900 text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              {isLoading ? <span>Searching...</span> : <span>Track Parcel</span>}
            </button>
          </div>
        </form>

        {/* Demo Test Codes */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Sample test codes:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('ATM-EXP-7K3N9R');
              performSearch('ATM-EXP-7K3N9R');
            }}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-brand-800 font-semibold transition-colors"
          >
            ATM-EXP-7K3N9R (In Transit)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('ATM-EXP-2M8W4P');
              performSearch('ATM-EXP-2M8W4P');
            }}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-emerald-800 font-semibold transition-colors"
          >
            ATM-EXP-2M8W4P (Ready for Pickup)
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="text-sm font-medium text-pretty">{errorMsg}</div>
        </div>
      )}

      {/* Tracking Results View */}
      {currentParcel && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Status Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-2xl font-mono font-extrabold text-slate-900">
                  {currentParcel.trackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStatusInfo.badgeClass}`}>
                  {currentStatusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentStatusInfo.description} · Last updated {formatWatDateTime(currentParcel.updatedAt)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Waybill Slip</span>
              </button>
            </div>
          </div>

          {/* Visual Progress Stepper */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-6">
              Chain of Custody Progress
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {TRACKING_STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = activeStageIndex >= idx;
                const isCurrent = activeStageIndex === idx;

                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${isCurrent
                      ? 'bg-brand-50/80 border-brand-500 text-brand-950 ring-1 ring-brand-500 shadow-sm'
                      : isCompleted
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-50/40 border-slate-100 text-slate-400'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-colors ${isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold leading-tight">{stage.label}</div>
                    <div className="text-[10px] mt-1 text-slate-500 font-medium">
                      {isCurrent ? 'Current' : isCompleted ? 'Passed' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid: Consignment Info + Terminal Collection Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Consignment Specification Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Consignment Details
              </h3>

              <div className="divide-y divide-slate-200/80 text-xs text-slate-600">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold text-slate-900 capitalize">{currentParcel.category}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Description:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">
                    {currentParcel.description}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Billed Weight:</span>
                  <span className="font-semibold text-slate-900">{currentParcel.weightKg} kg</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Special Handling:</span>
                  <span className="font-semibold text-slate-900">
                    {currentParcel.fragile ? 'Fragile Priority Care' : 'Standard Cargo'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Declared Value:</span>
                  <span className="font-semibold text-slate-900">
                    {currentParcel.declaredValueKobo ? formatNaira(currentParcel.declaredValueKobo) : 'None'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Freight Total:</span>
                  <span className="font-bold text-emerald-700">
                    {formatNaira(currentParcel.totalFeeKobo || currentParcel.feeKobo)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Status:</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {currentParcel.paid ? 'Paid' : 'Pending Counter Drop-off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Destination Terminal Collection Guide */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Pickup Terminal Guide
                </h3>
              </div>

              {destinationTerminal ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium mb-0.5">Terminal Name</div>
                    <div className="text-sm font-bold text-slate-900">{destinationTerminal.name}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-medium mb-0.5">Physical Address</div>
                    <div className="text-slate-700 leading-relaxed font-medium">{destinationTerminal.address}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-medium mb-0.5">Terminal Phone Lines</div>
                    <div className="text-slate-800 font-mono flex items-center gap-2 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{destinationTerminal.phones.join(' · ')}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Collection Requirement</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      Recipient must present government photo ID and the four digit pickup code delivered via SMS to release parcel.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Destination terminal information unavailable.</p>
              )}
            </div>
          </div>

          {/* Timeline Events Log */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-6">
              Custody Event History
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {currentTimeline.map((ev, index) => {
                const terminal = SEED_TERMINALS.find((t) => t.id === ev.locationTerminalId);

                return (
                  <div key={ev.id || index} className="relative">
                    <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white shadow-sm" />
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 capitalize">
                          {ev.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatWatDateTime(ev.createdAt)}
                        </span>
                        {terminal && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                            {terminal.city} ({terminal.code})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next action banner */}
          <div className="p-6 rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/90 to-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-brand-950 mb-0.5">Need to send another package?</h4>
              <p className="text-xs text-slate-600">
                Book express courier freight with same-day departure across our fleet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/courier')}
              className="min-h-[44px] py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span>Book Parcel Delivery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
