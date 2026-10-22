'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SEOHead } from '../../../components/seo/SEOHead.tsx';
import {
  TimeText,
  MoneyText,
  SectionBanner,
} from '../../../components/atm/AtmBlocks.tsx';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Sheet } from '../../../components/ui/Sheet.tsx';
import { SearchTripForm } from '@/components/forms/booking/SearchTripForm';
import {
  tripRepository,
  type TripSearchResult,
} from '../../../server/repositories/trips.ts';
import {
  SERVED_CITIES,
  getLagosDate,
  getServedDestinations,
  isServedPair,
  sortTrips,
  type ServedCity,
  formatNaira,
} from '@atm/shared';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  AlertTriangle,
  Info,
  Sun,
  Sunset,
  ShieldCheck,
  Car,
  Luggage,
  Fan,
  Heart,
  SlidersHorizontal,
  X,
  RotateCcw,
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

function parseDateParam(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TripsSearchPage(rawProps?: any) {
  const onNavigate = (rawProps as { onNavigate?: (path: string) => void } | undefined)?.onNavigate;
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
  const [savedTrips, setSavedTrips] = useState<Set<string>>(new Set());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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
      if (terminalFilter !== 'all') {
        const matchesOrigin = t.originTerminal.id.toLowerCase().includes(terminalFilter.toLowerCase());
        const matchesDest = t.destinationTerminal.id.toLowerCase().includes(terminalFilter.toLowerCase());
        if (!matchesOrigin && !matchesDest) return false;
      }
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

  // Lowest fare hint for current corridor
  const lowestFareKobo = useMemo(() => {
    if (trips.length === 0) return 3200000;
    return Math.min(...trips.map((t) => t.fareKobo));
  }, [trips]);

  // 7-day quick pick list
  const dateQuickPick = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayLabel: string;
      dayNum: string;
      fareHintKobo: number;
      isToday: boolean;
    }> = [];
    const baseDate = parseDateParam(dateParam);
    if (Number.isNaN(baseDate.getTime())) return list;

    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      const dStr = toDateString(d);
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
    const current = parseDateParam(dateParam);
    current.setDate(current.getDate() + offset);
    const newDateStr = toDateString(current);
    if (newDateStr >= todayLagos) {
      handleDateChange(newDateStr);
    }
  };

  const handleApplySearch = (options: {
    from: string;
    to: string;
    date: string;
    passengers: number;
    terminal?: string;
    sort?: string;
    time?: TimeWindowFilter;
  }) => {
    if (options.time) {
      setTimeFilter(options.time);
    }

    const query = new URLSearchParams();
    query.set('from', options.from);
    query.set('to', options.to);
    query.set('date', options.date);
    query.set('passengers', String(options.passengers));
    if (options.terminal && options.terminal !== 'all') query.set('terminal', options.terminal);
    if (options.sort && options.sort !== 'earliest') query.set('sort', options.sort);

    navigate(`/trips?${query.toString()}`);
    setIsMobileSheetOpen(false);
  };
  const canGoPrev = dateParam > todayLagos;

  // Active filters count for mobile indicator
  const activeFiltersCount =
    (timeFilter !== 'all' ? 1 : 0) +
    (terminalFilter !== 'all' ? 1 : 0) +
    (sortParam !== 'earliest' ? 1 : 0);



  return (
    <PageShell width="standard" density="comfortable" className="pb-32 flex flex-col gap-8 sm:gap-10 ">
      <SEOHead
        title={`${fromParam} to ${toParam} Scheduled Sienna Trips | Ascent Transport`}
        description={`Daily executive 5-passenger Toyota Sienna departures from ${fromParam} to ${toParam}. Real-time seat availability, departure times, and fixed kobo fares.`}
        canonicalPath={`/trips?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}`}
      />

      {/* 1. Header Bar resting cleanly on page background per ATM rules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight text-balance flex items-center gap-2.5">
            <span>{fromParam}</span>
            <span className="text-muted-foreground font-normal">→</span>
            <span>{toParam}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">{dateParam}</span>
            <span className="text-muted-foreground/40">•</span>
            <span>
              {passengersParam} {passengersParam === 1 ? 'Passenger' : 'Passengers'}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-foreground font-semibold">5-Passenger Sienna</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Air Conditioned
            </span>
          </div>
        </div>

        {/* Mobile filter button trigger */}
        <div className="block lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSheetOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Search &amp; Filter</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Two Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative my-10">
        {/* LEFT COLUMN (Desktop only): Search Filter & Calendar */}
        <aside className="hidden lg:block lg:col-span-4 self-start sticky top-20 lg:top-24 z-20">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Search &amp; Filter Trips
              </h2>
            </div>

            <SearchTripForm
              key={`desktop-${fromParam}-${toParam}-${dateParam}-${passengersParam}`}
              initialValues={{
                from: fromParam as ServedCity,
                to: toParam as ServedCity,
                date: dateParam,
                passengers: passengersParam,
                timeWindow: timeFilter,
                sortBy: sortParam,
                terminal: terminalFilter,
              }}
              variant="sidebar"
              onSearchSubmit={(data) => {
                handleApplySearch({
                  from: data.from,
                  to: data.to,
                  date: data.date,
                  passengers: data.passengers,
                  time: data.timeWindow as TimeWindowFilter,
                  sort: data.sortBy,
                  terminal: data.terminal,
                });
              }}
              onReset={() => {
                handleApplySearch({
                  from: 'Enugu',
                  to: 'Abuja',
                  date: todayLagos,
                  passengers: 1,
                  time: 'all',
                  sort: 'earliest',
                  terminal: 'all',
                });
              }}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Search Departures Results */}
        <main className="lg:col-span-8 space-y-6">
          {/* Unserved Corridor Warning */}
          {!isCorridorServed ? (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center space-y-4 shadow-sm animate-fluid-fade">
              <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">
                {fromParam} to {toParam} is not an active corridor
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty">
                Ascent Transport Management operates daily executive Sienna departures along three primary Nigerian intercity corridors:
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/trips?from=Enugu&to=Abuja')}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-card border border-border hover:border-primary hover:text-primary min-h-[44px] transition-all shadow-xs active:scale-95"
                >
                  Enugu ↔ Abuja
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/trips?from=Enugu&to=Lagos')}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-card border border-border hover:border-primary hover:text-primary min-h-[44px] transition-all shadow-xs active:scale-95"
                >
                  Enugu ↔ Lagos
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/trips?from=Lagos&to=Owerri')}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-card border border-border hover:border-primary hover:text-primary min-h-[44px] transition-all shadow-xs active:scale-95"
                >
                  Lagos ↔ Owerri
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 7-Day Quick Pick Calendar Strip */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => handleDayOffset(-1)}
                    className="p-2.5 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center transition-all text-foreground active:scale-95"
                    aria-label="Previous day departures"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex gap-2 overflow-x-auto py-1 scrollbar-none">
                    {dateQuickPick.map((item) => {
                      const isSelected = item.dateStr === dateParam;
                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          onClick={() => handleDateChange(item.dateStr)}
                          className={`flex-1 min-w-[85px] sm:min-w-[100px] px-3 py-2 rounded-xl text-center transition-all min-h-[46px] flex flex-col items-center justify-center cursor-pointer active:scale-95 ${isSelected
                            ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20'
                            : 'bg-muted/50 hover:bg-muted text-foreground border border-border/60'
                            }`}
                        >
                          <span
                            className={`block text-[11px] font-semibold ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}
                          >
                            {item.isToday ? 'Today' : `${item.dayLabel} ${item.dayNum.split(' ')[0]}`}
                          </span>
                          <span
                            className={`block text-xs font-mono font-black mt-0.5 ${isSelected ? 'text-primary-foreground' : 'text-foreground'
                              }`}
                          >
                            {formatNaira(item.fareHintKobo)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDayOffset(1)}
                    className="p-2.5 rounded-xl hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center transition-all text-foreground active:scale-95"
                    aria-label="Next day departures"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Header: Results Count & Active Filters Indicator */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-foreground">
                  {loading
                    ? 'Checking departures...'
                    : `${sortedTrips.length} ${sortedTrips.length === 1 ? 'departure available' : 'departures available'
                    }`}
                </span>

                {timeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Clear {timeFilter} filter</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Executive Sienna Quality Guarantee */}


              {/* Trip Departures List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-44 bg-card border border-border rounded-2xl p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="w-48 h-5 bg-muted rounded mb-4" />
                      <div className="w-full h-8 bg-muted rounded mb-3" />
                      <div className="w-32 h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 border border-destructive/25 rounded-2xl bg-destructive/10 text-center space-y-3 animate-fluid-fade">
                  <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                  <p className="text-sm text-destructive font-semibold">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="active:scale-95"
                  >
                    Retry Search
                  </Button>
                </div>
              ) : sortedTrips.length === 0 ? (
                <div className="p-10 border border-border rounded-2xl bg-card text-center space-y-4 shadow-sm animate-fluid-fade">
                  <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      No departures match your criteria for {dateParam}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed text-pretty">
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
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        View All Departure Times
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDayOffset(1)}
                      className="min-h-[42px] px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      Check Next Day Departures
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedTrips.map((trip, idx) => {
                    const totalFare = trip.fareKobo * passengersParam;
                    const isFewSeats = trip.seatsLeft <= 2 && trip.seatsLeft > 0;
                    const isBestValue = idx === 0 && trip.bookable;
                    const arrivalTimeWat = getArrivalTimeWat(trip.departureTimeUtc, trip.durationHours || 7.5);
                    const isSaved = savedTrips.has(trip.id);

                    return (
                      <div
                        key={trip.id}
                        className={`relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-fluid-fade @container/card motion-reduce:transform-none ${trip.bookable
                          ? 'border-border hover:border-primary/40'
                          : 'border-border/60 opacity-60 bg-muted/30'
                          }`}
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                        {isBestValue && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/25">
                              Best value
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col @lg/card:flex-row items-stretch @lg/card:items-center justify-between gap-6">
                          {/* Timeline & Corridor */}
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 @sm/card:grid-cols-12 gap-3 items-center">
                              {/* Departure */}
                              <div className="@sm/card:col-span-4 space-y-0.5">
                                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                                  <TimeText utcDateString={trip.departureTimeUtc} format="short" />
                                </div>
                                <span className="text-xs font-bold text-foreground block truncate">
                                  {trip.originTerminal.city} ({trip.originTerminal.code})
                                </span>
                                <span className="text-[11px] text-muted-foreground block truncate">
                                  {trip.originTerminal.name}
                                </span>
                              </div>

                              {/* Duration connector */}
                              <div className="@sm/card:col-span-4 text-center py-1 sm:py-0 space-y-1">
                                <span className="text-[11px] font-bold text-muted-foreground block">
                                  {trip.durationHours || 7.5}h Direct
                                </span>
                                <div className="relative flex items-center justify-center">
                                  <div className="w-full h-0.5 bg-border" />
                                  <div className="absolute w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-primary shadow-xs">
                                    <Car className="w-3 h-3" />
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold block">
                                  {trip.distanceKm || 420} km Highway
                                </span>
                              </div>

                              {/* Arrival */}
                              <div className="@sm/card:col-span-4 text-left sm:text-right space-y-0.5">
                                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                                  {arrivalTimeWat}
                                </div>
                                <span className="text-xs font-bold text-foreground block truncate">
                                  {trip.destinationTerminal.city} ({trip.destinationTerminal.code})
                                </span>
                                <span className="text-[11px] text-muted-foreground block truncate">
                                  {trip.destinationTerminal.name}
                                </span>
                              </div>
                            </div>

                            {/* Amenity chips */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1 font-semibold text-foreground">
                                <Luggage className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>1x Luggage boot (20kg)</span>
                              </span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Fan className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Full A/C</span>
                              </span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-muted-foreground">
                                <span>5 Passenger Toyota Sienna</span>
                              </span>
                              <span className="text-muted-foreground/40">•</span>
                              {trip.bookable && isFewSeats ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  Only {trip.seatsLeft} {trip.seatsLeft === 1 ? 'seat' : 'seats'} left!
                                </span>
                              ) : trip.bookable ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {trip.seatsLeft} seats available
                                </span>
                              ) : (
                                <span className="font-bold text-destructive">
                                  {trip.unavailableReason ?? 'Sold out'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fare & CTA */}
                          <div className="flex flex-col @sm/card:flex-row @lg/card:flex-col justify-between @lg/card:justify-center items-end border-t @lg/card:border-t-0 @lg/card:border-l border-border pt-4 @lg/card:pt-0 @lg/card:pl-6 min-w-[200px]">
                            <div className="text-left lg:text-right space-y-0.5">
                              <div className="flex items-center lg:justify-end gap-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  Total fare
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleSaveTrip(trip.id)}
                                  className="text-muted-foreground hover:text-primary p-1 rounded-full transition-all active:scale-90"
                                  title="Save trip"
                                  aria-label="Save this trip"
                                >
                                  <Heart
                                    className={`w-4 h-4 ${isSaved ? 'fill-primary text-primary' : ''
                                      }`}
                                  />
                                </button>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
                                <MoneyText
                                  kobo={trip.fareKobo}
                                  isPlaceholder={trip.isPlaceholder}
                                />
                              </div>
                              {passengersParam > 1 && (
                                <div className="text-xs text-muted-foreground font-medium">
                                  Total: <strong className="text-foreground font-mono"><MoneyText kobo={totalFare} isPlaceholder={trip.isPlaceholder} /></strong> ({passengersParam} pass.)
                                </div>
                              )}
                            </div>

                            <div className="mt-3.5 w-full sm:w-auto">
                              {trip.bookable ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/book/${trip.id}?passengers=${passengersParam}`)}
                                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 motion-reduce:transform-none"
                                >
                                  <span>Select Seats</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground bg-muted border border-border cursor-not-allowed"
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
        </main>
      </div>

      {/* 3. Mobile Floating Filter & Search Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 block lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSheetOpen(true)}
          className="min-h-[48px] px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-2xl flex items-center gap-2.5 active:scale-95 transition-all border border-white/20 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Search &amp; Filter Trips</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Mobile Bottom Sheet for Search & Filters */}
      <Sheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        side="bottom"
        title="Search & Filter Departures"
        className="max-h-[88vh]"
      >
        <div className="pb-8">
          <SearchTripForm
            key={`mobile-${fromParam}-${toParam}-${dateParam}-${passengersParam}`}
            initialValues={{
              from: fromParam as ServedCity,
              to: toParam as ServedCity,
              date: dateParam,
              passengers: passengersParam,
              timeWindow: timeFilter,
              sortBy: sortParam,
              terminal: terminalFilter,
            }}
            variant="sidebar"
            onSearchSubmit={(data) => {
              handleApplySearch({
                from: data.from,
                to: data.to,
                date: data.date,
                passengers: data.passengers,
                time: data.timeWindow as TimeWindowFilter,
                sort: data.sortBy,
                terminal: data.terminal,
              });
            }}
            onReset={() => {
              handleApplySearch({
                from: 'Enugu',
                to: 'Abuja',
                date: todayLagos,
                passengers: 1,
                time: 'all',
                sort: 'earliest',
                terminal: 'all',
              });
            }}
          />
        </div>
      </Sheet>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4 text-xs text-foreground shadow-xs animate-fluid-fade mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-foreground font-bold text-xs sm:text-sm">
              Guaranteed 5-Passenger Executive Cabin
            </strong>
            <span className="text-muted-foreground text-[11px] sm:text-xs">
              Zero overcrowding. Working air conditioning and rear luggage boot on every departure.
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
          Standard On All Trips
        </span>
      </div>

      {/* Guidelines Footer Notice */}
      <SectionBanner title="Ascent Transport Fixed Departure Guarantee">
        <p className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed">
          All Sienna departures leave strictly on schedule. Please report to your boarding terminal 30 minutes prior to scheduled departure with your booking reference.
        </p>
      </SectionBanner>
    </PageShell>
  );
}
