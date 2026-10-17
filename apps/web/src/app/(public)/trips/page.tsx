'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SearchForm } from '../../../components/booking/SearchForm.tsx';
import { SEOHead } from '../../../components/seo/SEOHead.tsx';
import {
  TimeText,
  MoneyText,
  StatusBadge,
  SectionBanner,
} from '../../../components/atm/AtmBlocks.tsx';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import {
  tripRepository,
  type TripSearchResult,
} from '../../../server/repositories/trips.ts';
import {
  getLagosDate,
  getServedDestinations,
  isServedPair,
  sortTrips,
  type ServedCity,
  searchParamsSchema,
  formatNaira,
} from '@atm/shared';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  Info,
  Sun,
  Sunset,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export type TimeWindowFilter = 'all' | 'morning' | 'afternoon';

function useSafeSearchParams(): URLSearchParams {
  const [params, setParams] = useState<URLSearchParams>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handlePopState = () => {
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return params;
}

function matchesTimeWindow(utcIso: string, filter: TimeWindowFilter): boolean {
  if (filter === 'all') return true;
  try {
    const d = new Date(utcIso);
    // WAT is UTC+1
    const hourWat = (d.getUTCHours() + 1) % 24;
    if (filter === 'morning') {
      return hourWat >= 6 && hourWat < 12;
    }
    if (filter === 'afternoon') {
      return hourWat >= 12 && hourWat < 18;
    }
    return true;
  } catch {
    return true;
  }
}

export default function TripsSearchPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const searchParams = useSafeSearchParams();

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const todayLagos = getLagosDate();

  // Read search parameters with defaults
  const fromParam = searchParams.get('from') || 'Enugu';
  const toParam = searchParams.get('to') || 'Abuja';
  const dateParam = searchParams.get('date') || todayLagos;
  const passengersParam = Math.min(5, Math.max(1, Number(searchParams.get('passengers') || 1)));
  const sortParam = (searchParams.get('sort') as 'earliest' | 'cheapest') || 'earliest';
  const terminalFilter = searchParams.get('terminal') || 'all';

  // Client side time window filter state
  const [timeFilter, setTimeFilter] = useState<TimeWindowFilter>('all');

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isCorridorServed = isServedPair(fromParam, toParam);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    if (!isCorridorServed) {
      setTrips([]);
      setLoading(false);
      return;
    }

    tripRepository
      .searchTrips({
        from: fromParam,
        to: toParam,
        date: dateParam,
        passengers: passengersParam,
      })
      .then((results) => {
        if (!isMounted) return;
        setTrips(results);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to search departures');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromParam, toParam, dateParam, passengersParam, isCorridorServed]);

  // Terminal & Time Window filtering
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // 1. Terminal filter
      if (terminalFilter !== 'all') {
        const matchesOrigin = t.originTerminal.id.toLowerCase().includes(terminalFilter.toLowerCase());
        const matchesDest = t.destinationTerminal.id.toLowerCase().includes(terminalFilter.toLowerCase());
        if (!matchesOrigin && !matchesDest) return false;
      }
      // 2. Time Window filter
      if (!matchesTimeWindow(t.departureTimeUtc, timeFilter)) {
        return false;
      }
      return true;
    });
  }, [trips, terminalFilter, timeFilter]);

  // Sorting
  const sortedTrips = useMemo(() => {
    return sortTrips(filteredTrips, sortParam);
  }, [filteredTrips, sortParam]);

  // Generate 7-day quick pick list
  const dateQuickPick = useMemo(() => {
    const list: Array<{ dateStr: string; dayLabel: string; dayNum: string; isToday: boolean }> = [];
    const baseDate = new Date(dateParam);
    if (Number.isNaN(baseDate.getTime())) return list;

    // Center selected date in window
    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      const dStr = getLagosDate(d);
      if (dStr >= todayLagos) {
        list.push({
          dateStr: dStr,
          dayLabel: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Lagos' }).format(d),
          dayNum: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }).format(d),
          isToday: dStr === todayLagos,
        });
      }
    }
    return list;
  }, [dateParam, todayLagos]);

  const handleDateChange = (newDate: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('date', newDate);
    navigate(`/trips?${query.toString()}`);
  };

  const handleSortChange = (newSort: 'earliest' | 'cheapest') => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('sort', newSort);
    navigate(`/trips?${query.toString()}`);
  };

  const handleTerminalFilterChange = (newTerminal: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('terminal', newTerminal);
    navigate(`/trips?${query.toString()}`);
  };

  const handleDayOffset = (offset: number) => {
    const current = new Date(dateParam);
    current.setDate(current.getDate() + offset);
    const newDateStr = getLagosDate(current);
    if (newDateStr >= todayLagos) {
      handleDateChange(newDateStr);
    }
  };

  const canGoPrev = dateParam > todayLagos;

  return (
    <PageShell width="compact" density="compact" className="pb-16 space-y-6 sm:space-y-8">
      <SEOHead
        title={`${fromParam} to ${toParam} Scheduled Sienna Trips | Ascent Transport`}
        description={`Daily executive 5-passenger Toyota Sienna departures from ${fromParam} to ${toParam}. Real-time seat availability, departure times, and fixed kobo fares.`}
        canonicalPath={`/trips?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}`}
      />

      {/* 1. Header with Search Summary & Modification Bar */}
      <div className="space-y-4">
        <div>
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">
            Available Departures
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            {fromParam} to {toParam}
          </h1>
          <div className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
            <span>Date: <strong className="text-slate-900">{dateParam}</strong></span>
            <span>&bull;</span>
            <span>Travelers: <strong className="text-slate-900">{passengersParam} {passengersParam === 1 ? 'Seat' : 'Seats'}</strong></span>
            <span>&bull;</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct Toyota Sienna Fleet
            </span>
          </div>
        </div>

        {/* Compact Search Modification Form */}
        <SearchForm
          compact
          initialFrom={fromParam}
          initialTo={toParam}
          initialDate={dateParam}
          initialPassengers={passengersParam}
        />
      </div>

      {/* 2. Unserved Corridor Fallback Warning */}
      {!isCorridorServed ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white p-8 text-center space-y-4 shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            {fromParam} to {toParam} is not an active corridor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Ascent Transport Management currently operates fixed daily Sienna departures along three primary Nigerian intercity corridors:
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Abuja')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-colors shadow-xs"
            >
              Enugu ↔ Abuja
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Lagos')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-colors shadow-xs"
            >
              Enugu ↔ Lagos
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Lagos&to=Owerri')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-colors shadow-xs"
            >
              Lagos ↔ Owerri
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Elevated 7-Day Calendar Navigation Strip */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => handleDayOffset(-1)}
                className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors text-slate-700"
                aria-label="Previous day departures"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex gap-2 overflow-x-auto py-1">
                {dateQuickPick.map((item) => {
                  const isSelected = item.dateStr === dateParam;
                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => handleDateChange(item.dateStr)}
                      className={`flex-1 min-w-[85px] sm:min-w-[100px] px-3 py-2 rounded-xl text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <span className={`block text-[10px] uppercase tracking-wider ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                        {item.isToday ? 'Today' : item.dayLabel}
                      </span>
                      <span className="block text-xs font-extrabold leading-tight mt-0.5">
                        {item.dayNum}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleDayOffset(1)}
                className="p-2.5 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors text-slate-700"
                aria-label="Next day departures"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Today Jump Shortcut */}
            {dateParam !== todayLagos && (
              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end px-2">
                <button
                  type="button"
                  onClick={() => handleDateChange(todayLagos)}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Jump to today's earliest departures ({todayLagos})</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Interactive Filters & Sorting Toolbar */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Time Window Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Departure Time:
              </span>
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                All Day
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('morning')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  timeFilter === 'morning'
                    ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Morning (6am - 12pm)</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('afternoon')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  timeFilter === 'afternoon'
                    ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Sunset className="w-3.5 h-3.5" />
                <span>Afternoon (12pm - 5pm)</span>
              </button>
            </div>

            {/* Sort & Terminal Controls */}
            <div className="flex items-center gap-3 flex-wrap self-end md:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Sort:</span>
                <button
                  type="button"
                  onClick={() => handleSortChange('earliest')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sortParam === 'earliest'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  Earliest
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange('cheapest')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sortParam === 'cheapest'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  Lowest Fare
                </button>
              </div>

              {/* Lagos Terminal Dropdown Filter (when either from or to is Lagos) */}
              {(fromParam === 'Lagos' || toParam === 'Lagos') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Station:</span>
                  <select
                    value={terminalFilter}
                    onChange={(e) => handleTerminalFilterChange(e.target.value)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  >
                    <option value="all">All Lagos Stations</option>
                    <option value="jibowu">Jibowu (Yaba)</option>
                    <option value="ajah">Ajah (Lekki)</option>
                    <option value="festac">Festac Town</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 5. Trip Results List */}
          {loading ? (
            /* Static modern skeleton surfaces (Zero animate-pulse per design guidelines) */
            <div className="space-y-4">
              <div className="h-44 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="w-48 h-5 bg-slate-200/80 rounded mb-4" />
                <div className="w-full h-8 bg-slate-100 rounded mb-3" />
                <div className="w-32 h-4 bg-slate-100 rounded" />
              </div>
              <div className="h-44 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="w-48 h-5 bg-slate-200/80 rounded mb-4" />
                <div className="w-full h-8 bg-slate-100 rounded mb-3" />
                <div className="w-32 h-4 bg-slate-100 rounded" />
              </div>
            </div>
          ) : error ? (
            <div className="p-8 border border-rose-200 rounded-2xl bg-rose-50 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm text-rose-800 font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry Search
              </Button>
            </div>
          ) : sortedTrips.length === 0 ? (
            <div className="p-12 border border-slate-200/80 rounded-2xl bg-white text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  No departures match your criteria for {dateParam}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {timeFilter !== 'all'
                    ? 'No trips found in this specific time window. Try toggling "All Day" or checking the next day.'
                    : 'All vehicles on this date may be fully booked or departed. Try checking the next day.'}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-1">
                {timeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    View All Departure Times
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDayOffset(1)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Check Next Day Departures
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTrips.map((trip) => {
                const totalFare = trip.fareKobo * passengersParam;
                const isFewSeats = trip.seatsLeft <= 2 && trip.seatsLeft > 0;
                const isSoldOut = trip.seatsLeft === 0;

                return (
                  <div
                    key={trip.id}
                    className={`relative overflow-hidden rounded-2xl border bg-white p-6 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] ${
                      trip.bookable
                        ? 'border-slate-200/80 hover:border-slate-300'
                        : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Specular Top Sheen */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      {/* Left: Departure Details, Corridor Timeline & Terminals */}
                      <div className="space-y-4 flex-1">
                        {/* Top Metadata Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-brand-600" />
                              <TimeText utcDateString={trip.departureTimeUtc} format="short" />
                            </div>

                            {/* Urgency Status Pill */}
                            {trip.bookable && isFewSeats && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-1">
                                <span>Only {trip.seatsLeft} {trip.seatsLeft === 1 ? 'seat' : 'seats'} remaining!</span>
                              </span>
                            )}

                            {trip.bookable && !isFewSeats && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{trip.seatsLeft} seats available</span>
                              </span>
                            )}

                            {!trip.bookable && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200">
                                {trip.unavailableReason ?? 'Departed / Sold Out'}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <span>Service: </span>
                            <strong className="text-slate-800">Executive Sienna</strong>
                          </div>
                        </div>

                        {/* Visual Corridor Line Connector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs relative pt-1">
                          <div className="space-y-1 relative pl-5 before:absolute before:left-0 before:top-1.5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-brand-600 before:ring-4 before:ring-brand-50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Boarding Station
                            </span>
                            <span className="font-extrabold text-slate-900 block text-sm">
                              {trip.originTerminal.name}
                            </span>
                            <span className="text-slate-500 block text-[11px] line-clamp-1">
                              {trip.originTerminal.address}
                            </span>
                          </div>

                          <div className="space-y-1 relative pl-5 before:absolute before:left-0 before:top-1.5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-emerald-600 before:ring-4 before:ring-emerald-50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Destination Terminal
                            </span>
                            <span className="font-extrabold text-slate-900 block text-sm">
                              {trip.destinationTerminal.name}
                            </span>
                            <span className="text-slate-500 block text-[11px] line-clamp-1">
                              {trip.destinationTerminal.address}
                            </span>
                          </div>
                        </div>

                        {/* Vehicle highlights */}
                        <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-slate-700">{trip.vehicle.model}</span>
                          <span>&bull;</span>
                          <span>5 Passenger Max</span>
                          <span>&bull;</span>
                          <span>Air Conditioned</span>
                          <span>&bull;</span>
                          <span>Luggage Boot Included</span>
                        </div>
                      </div>

                      {/* Right: Fare Column & Tactile Seat Selection CTA */}
                      <div className="flex lg:flex-col justify-between lg:justify-center items-end lg:items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-8 min-w-[200px]">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Fare per seat
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                            <MoneyText
                              kobo={trip.fareKobo}
                              isPlaceholder={trip.isPlaceholder}
                            />
                          </div>
                          {passengersParam > 1 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Total: <strong className="text-slate-900"><MoneyText kobo={totalFare} isPlaceholder={trip.isPlaceholder} /></strong> ({passengersParam} pass.)
                            </div>
                          )}
                        </div>

                        <div className="mt-4 w-full sm:w-auto">
                          {trip.bookable ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${trip.id}?passengers=${passengersParam}`)}
                              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                              <span>Select Seats</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                            >
                              {trip.unavailableReason ?? 'Not Bookable'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Guidelines Footer Notice */}
      <SectionBanner title="Ascent Transport Fixed Departure Guarantee">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          All Sienna departures leave strictly on schedule. Please report to your boarding terminal 30 minutes prior to scheduled departure with your booking reference.
        </p>
      </SectionBanner>
    </PageShell>
  );
}
