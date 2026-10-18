'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SearchForm } from '../../../components/booking/SearchForm.tsx';
import { SEOHead } from '../../../components/seo/SEOHead.tsx';
import {
  TimeText,
  MoneyText,
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
  Car,
  Luggage,
  Fan,
  Heart,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Compass,
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

/**
 * Calculates approximate arrival time based on departure and route duration
 */
function getArrivalTimeWat(departureUtc: string, durationHours: number = 7.5): string {
  try {
    const dep = new Date(departureUtc);
    const arr = new Date(dep.getTime() + durationHours * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(arr);
  } catch {
    return '02:30 PM';
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

  // Client side state
  const [timeFilter, setTimeFilter] = useState<TimeWindowFilter>('all');
  const [isEditingSearch, setIsEditingSearch] = useState<boolean>(true);
  const [savedTrips, setSavedTrips] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isCorridorServed = isServedPair(fromParam, toParam);

  const toggleSaveTrip = (tripId: string) => {
    setSavedTrips((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  };

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
        originCity: fromParam,
        destinationCity: toParam,
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

  // Find lowest fare for currently active corridor
  const lowestFareKobo = useMemo(() => {
    if (trips.length === 0) return 3200000;
    return Math.min(...trips.map((t) => t.fareKobo));
  }, [trips]);

  // Generate 7-day quick pick list with fare hint
  const dateQuickPick = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayLabel: string;
      dayNum: string;
      fareHintKobo: number;
      isToday: boolean;
    }> = [];
    const baseDate = new Date(dateParam);
    if (Number.isNaN(baseDate.getTime())) return list;

    // Center selected date in window (-2 to +4)
    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      const dStr = getLagosDate(d);
      if (dStr >= todayLagos) {
        list.push({
          dateStr: dStr,
          dayLabel: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Lagos' }).format(d),
          dayNum: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }).format(d),
          fareHintKobo: lowestFareKobo,
          isToday: dStr === todayLagos,
        });
      }
    }
    return list;
  }, [dateParam, todayLagos, lowestFareKobo]);

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
    <PageShell width="compact" density="comfortable" className="pb-32 flex flex-col gap-10 sm:gap-12">
      <SEOHead
        title={`${fromParam} to ${toParam} Scheduled Sienna Trips | Ascent Transport`}
        description={`Daily executive 5-passenger Toyota Sienna departures from ${fromParam} to ${toParam}. Real-time seat availability, departure times, and fixed kobo fares.`}
        canonicalPath={`/trips?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}`}
      />

      {/* 1. Airline-Grade Clean Corridor Header (Skyloop reference layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-b border-slate-100 pb-6">
        <div>
          {/* Main Title rests directly on page background per ATM rules */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance flex items-center gap-2.5">
            <span>{fromParam}</span>
            <span className="text-slate-400 font-normal">→</span>
            <span>{toParam}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
            <span className="text-slate-700 font-semibold">{dateParam}</span>
            <span className="text-slate-300">•</span>
            <span>
              {passengersParam} {passengersParam === 1 ? 'Adult' : 'Adults'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-semibold">Executive Sienna</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Air Conditioned
            </span>
          </div>
        </div>

        {/* Edit Search Toggle Button with tactile feedback */}
        <div>
          <button
            type="button"
            onClick={() => setIsEditingSearch(!isEditingSearch)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.97]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditingSearch ? 'Close Search' : 'Edit Search'}</span>
            {isEditingSearch ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Search Modification Card (Coss Frame / Particle Pattern) */}
      {isEditingSearch && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] overflow-hidden transition-all animate-fluid-drawer">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Update Route &amp; Travel Date
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select your preferred corridor, travel day, and passenger headcount
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingSearch(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 min-h-[36px] px-3.5 py-1.5 rounded-xl active:scale-[0.97] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Search Form Body */}
          <div className="p-6">
            <SearchForm
              compact
              initialFrom={fromParam}
              initialTo={toParam}
              initialDate={dateParam}
              initialPassengers={passengersParam}
            />
          </div>
        </div>
      )}

      {/* 2. Unserved Corridor Fallback Warning */}
      {!isCorridorServed ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white p-8 text-center space-y-4 shadow-sm animate-fluid-fade">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            {fromParam} to {toParam} is not an active corridor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed text-pretty">
            Ascent Transport Management operates fixed daily executive Sienna departures along three primary Nigerian intercity corridors:
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Abuja')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-all shadow-xs active:scale-[0.97]"
            >
              Enugu ↔ Abuja
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Lagos')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-all shadow-xs active:scale-[0.97]"
            >
              Enugu ↔ Lagos
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Lagos&to=Owerri')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:text-brand-700 min-h-[44px] transition-all shadow-xs active:scale-[0.97]"
            >
              Lagos ↔ Owerri
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
          {/* 3. Elevated 7-Day Calendar Navigation Strip (Skyloop Reference Pattern) */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            {/* Subtle Specular Top Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/70 to-transparent" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => handleDayOffset(-1)}
                className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center transition-all text-slate-700 active:scale-[0.95]"
                aria-label="Previous day departures"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex gap-2.5 overflow-x-auto py-1 scrollbar-none">
                {dateQuickPick.map((item) => {
                  const isSelected = item.dateStr === dateParam;
                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => handleDateChange(item.dateStr)}
                      className={`flex-1 min-w-[90px] sm:min-w-[110px] px-3.5 py-2.5 rounded-xl text-center transition-all min-h-[48px] flex flex-col items-center justify-center cursor-pointer active:scale-[0.97] ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <span className={`block text-[11px] font-semibold ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                        {item.isToday ? 'Today' : `${item.dayLabel} ${item.dayNum.split(' ')[0]}`}
                      </span>
                      <span className={`block text-xs font-mono font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {formatNaira(item.fareHintKobo)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleDayOffset(1)}
                className="p-2.5 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all text-slate-700 active:scale-[0.95]"
                aria-label="Next day departures"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4. Coss-Inspired Segmented Filter & Sort Toolbar */}
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Filter Pills with Segmented Control styling */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Departure:
              </span>
              <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 gap-1">
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.97] ${
                    timeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Day
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('morning')}
                  className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
                    timeFilter === 'morning'
                      ? 'bg-brand-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Morning</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('afternoon')}
                  className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
                    timeFilter === 'afternoon'
                      ? 'bg-brand-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Afternoon</span>
                </button>
              </div>
            </div>

            {/* Sort & Station Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
              {/* Lagos Terminal Dropdown Filter (when corridor touches Lagos) */}
              {(fromParam === 'Lagos' || toParam === 'Lagos') && (
                <div className="relative">
                  <select
                    value={terminalFilter}
                    onChange={(e) => handleTerminalFilterChange(e.target.value)}
                    className="min-h-[40px] pl-3 pr-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer transition-colors"
                  >
                    <option value="all">All Lagos Terminals</option>
                    <option value="jibowu">Jibowu (Yaba)</option>
                    <option value="ajah">Ajah (Lekki)</option>
                    <option value="festac">Festac Town</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value as 'earliest' | 'cheapest')}
                  className="min-h-[40px] pl-3 pr-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="earliest">Sort by: Earliest Departure</option>
                  <option value="cheapest">Sort by: Lowest Fare</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* AC Comfort Guarantee Banner (Skyloop greener choices reference pattern) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-4 text-xs text-emerald-950 shadow-xs animate-fluid-fade">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-emerald-950 font-bold text-sm">Guaranteed 5-Passenger Executive Cabin</strong>
                <span className="text-emerald-800 text-xs">
                  Zero overcrowding. Clean air conditioning, extra legroom, and rear luggage boot on every departure.
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold shrink-0">
              Standard On All Trips
            </span>
          </div>

          {/* 5. Trip Results List (Horizontal High-Craft Cards based on Skyloop Reference) */}
          {loading ? (
            /* Static modern skeleton surfaces (Zero animate-pulse per design guidelines) */
            <div className="flex flex-col gap-8 sm:gap-10">
              <div className="h-48 bg-white border border-slate-200/70 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="w-48 h-5 bg-slate-100 rounded mb-4" />
                <div className="w-full h-8 bg-slate-100 rounded mb-3" />
                <div className="w-32 h-4 bg-slate-100 rounded" />
              </div>
              <div className="h-48 bg-white border border-slate-200/70 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="w-48 h-5 bg-slate-100 rounded mb-4" />
                <div className="w-full h-8 bg-slate-100 rounded mb-3" />
                <div className="w-32 h-4 bg-slate-100 rounded" />
              </div>
            </div>
          ) : error ? (
            <div className="p-8 border border-rose-200 rounded-2xl bg-rose-50 text-center space-y-3 animate-fluid-fade">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm text-rose-800 font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="active:scale-[0.97]"
              >
                Retry Search
              </Button>
            </div>
          ) : sortedTrips.length === 0 ? (
            <div className="p-12 border border-slate-200/80 rounded-2xl bg-white text-center space-y-4 shadow-sm animate-fluid-fade">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  No departures match your criteria for {dateParam}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed text-pretty">
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
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-[0.97]"
                  >
                    View All Departure Times
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDayOffset(1)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.97]"
                >
                  Check Next Day Departures
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 sm:gap-10">
              {sortedTrips.map((trip, idx) => {
                const totalFare = trip.fareKobo * passengersParam;
                const isFewSeats = trip.seatsLeft <= 2 && trip.seatsLeft > 0;
                const isBestValue = idx === 0 && trip.bookable;
                const arrivalTimeWat = getArrivalTimeWat(trip.departureTimeUtc, trip.durationHours || 7.5);
                const isSaved = savedTrips.has(trip.id);

                return (
                  <div
                    key={trip.id}
                    className={`relative overflow-hidden rounded-2xl border bg-white p-6 sm:p-8 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.09)] animate-fluid-fade ${
                      trip.bookable
                        ? 'border-slate-200/80 hover:border-slate-300'
                        : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Specular Top Sheen */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

                    {/* Best Value Tag Pill (Skyloop Reference) */}
                    {isBestValue && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          Best value
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                      {/* Left: Airline-Style Timeline & Corridor */}
                      <div className="flex-1 space-y-4">
                        {/* Corridor Timeline Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Departure Point */}
                          <div className="sm:col-span-4 space-y-0.5">
                            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                              <TimeText utcDateString={trip.departureTimeUtc} format="short" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 block truncate">
                              {trip.originTerminal.city} ({trip.originTerminal.code})
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {trip.originTerminal.name}
                            </span>
                          </div>

                          {/* Transit Connector & Duration */}
                          <div className="sm:col-span-4 text-center py-1 sm:py-0 space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 block">
                              {trip.durationHours || 7.5}h Direct
                            </span>
                            <div className="relative flex items-center justify-center">
                              <div className="w-full h-0.5 bg-slate-200" />
                              <div className="absolute w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-brand-600 shadow-xs">
                                <Car className="w-3 h-3" />
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {trip.distanceKm || 420} km Highway
                            </span>
                          </div>

                          {/* Arrival Point */}
                          <div className="sm:col-span-4 text-left sm:text-right space-y-0.5">
                            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                              {arrivalTimeWat}
                            </div>
                            <span className="text-xs font-bold text-slate-700 block truncate">
                              {trip.destinationTerminal.city} ({trip.destinationTerminal.code})
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {trip.destinationTerminal.name}
                            </span>
                          </div>
                        </div>

                        {/* Amenity & Baggage Chips (Skyloop reference layout) */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Luggage className="w-3.5 h-3.5 text-slate-400" />
                            <span>1x Luggage boot (20kg)</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Fan className="w-3.5 h-3.5 text-slate-400" />
                            <span>Full A/C</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">
                            <span>5 Passenger Toyota Sienna</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          {trip.bookable && isFewSeats ? (
                            <span className="font-bold text-amber-700">
                              Only {trip.seatsLeft} {trip.seatsLeft === 1 ? 'seat' : 'seats'} left!
                            </span>
                          ) : trip.bookable ? (
                            <span className="font-semibold text-emerald-700">
                              {trip.seatsLeft} seats available
                            </span>
                          ) : (
                            <span className="font-bold text-rose-700">
                              {trip.unavailableReason ?? 'Sold out'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Fare Column & Tactile CTA Block (Skyloop reference) */}
                      <div className="flex sm:flex-row lg:flex-col justify-between lg:justify-center items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[210px]">
                        <div className="text-left lg:text-right space-y-0.5">
                          <div className="flex items-center lg:justify-end gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Total fare (all fees)
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSaveTrip(trip.id)}
                              className="text-slate-400 hover:text-brand-600 p-1 rounded-full transition-all active:scale-[0.90]"
                              title="Save trip"
                              aria-label="Save this trip"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isSaved ? 'fill-brand-600 text-brand-600' : ''
                                }`}
                              />
                            </button>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                            <MoneyText
                              kobo={trip.fareKobo}
                              isPlaceholder={trip.isPlaceholder}
                            />
                          </div>
                          {passengersParam > 1 && (
                            <div className="text-xs text-slate-500 font-medium">
                              Total: <strong className="text-slate-900 font-mono"><MoneyText kobo={totalFare} isPlaceholder={trip.isPlaceholder} /></strong> ({passengersParam} pass.)
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 w-full sm:w-auto">
                          {trip.bookable ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${trip.id}?passengers=${passengersParam}`)}
                              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
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
        </div>
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

