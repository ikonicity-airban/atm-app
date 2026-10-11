'use client';

import React, { useState, useEffect } from 'react';
import { SearchForm } from '../../../components/booking/SearchForm.tsx';
import {
  TimeText,
  MoneyText,
  StatusBadge,
  SectionBanner,
} from '../../../components/atm/AtmBlocks.tsx';
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
} from 'lucide-react';

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

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Validate search params
  const validationResult = searchParamsSchema.safeParse({
    from: fromParam,
    to: toParam,
    date: dateParam,
    passengers: passengersParam,
  });

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
        originCity: fromParam,
        destinationCity: toParam,
        date: dateParam,
        passengers: passengersParam,
      })
      .then((data) => {
        if (!isMounted) return;
        setTrips(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Unable to retrieve departures.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromParam, toParam, dateParam, passengersParam, isCorridorServed]);

  // Terminal filter (e.g. for Lagos: Jibowu, Ajah, Festac)
  const filteredTrips = trips.filter((trip) => {
    if (terminalFilter === 'all') return true;
    const destName = trip.destinationTerminal.name.toLowerCase();
    const origName = trip.originTerminal.name.toLowerCase();
    const filterKey = terminalFilter.toLowerCase();
    return destName.includes(filterKey) || origName.includes(filterKey);
  });

  // Sort trips
  const sortedTrips = sortTrips(filteredTrips, sortParam);

  // Generate 7-day quick-pick date list starting from today
  const dateQuickPick = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getLagosDate(d);
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Lagos' }).format(d);
    const dayNum = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }).format(d);
    return { dateStr, dayLabel, dayNum };
  });

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

  // Helper for prev/next day
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header with Search Summary and Compact SearchForm */}
      <div className="space-y-4">
        <div>
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">
            Trip Results
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {fromParam} to {toParam}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-2">
            <span>Date: <strong>{dateParam}</strong></span>
            <span>&bull;</span>
            <span>Passengers: <strong>{passengersParam}</strong></span>
          </p>
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
        <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            {fromParam} to {toParam} is not an active corridor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            We currently operate fixed daily services along three primary travel corridors:
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Abuja')}
              className="px-3.5 py-2 text-xs font-semibold rounded bg-white border border-slate-300 hover:border-[#ca2484] hover:text-[#ca2484] min-h-[44px]"
            >
              Enugu ↔ Abuja
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Enugu&to=Lagos')}
              className="px-3.5 py-2 text-xs font-semibold rounded bg-white border border-slate-300 hover:border-[#ca2484] hover:text-[#ca2484] min-h-[44px]"
            >
              Enugu ↔ Lagos
            </button>
            <button
              type="button"
              onClick={() => navigate('/trips?from=Lagos&to=Owerri')}
              className="px-3.5 py-2 text-xs font-semibold rounded bg-white border border-slate-300 hover:border-[#ca2484] hover:text-[#ca2484] min-h-[44px]"
            >
              Lagos ↔ Owerri
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. 7-Day Date Navigation Strip */}
          <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => handleDayOffset(-1)}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <div className="flex-1 flex gap-1.5 min-w-max">
              {dateQuickPick.map((item) => {
                const isSelected = item.dateStr === dateParam;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleDateChange(item.dateStr)}
                    className={`flex-1 px-3 py-2 rounded text-center transition-colors min-h-[44px] cursor-pointer ${
                      isSelected
                        ? 'bg-[#ca2484] text-white font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block text-[10px] uppercase">{item.dayLabel}</span>
                    <span className="block text-xs font-bold leading-tight">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleDayOffset(1)}
              className="p-2 rounded hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* 4. Filters & Sorting Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Sort by:</span>
              <button
                type="button"
                onClick={() => handleSortChange('earliest')}
                className={`px-3 py-1.5 rounded border min-h-[36px] cursor-pointer ${
                  sortParam === 'earliest'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Earliest Departure
              </button>
              <button
                type="button"
                onClick={() => handleSortChange('cheapest')}
                className={`px-3 py-1.5 rounded border min-h-[36px] cursor-pointer ${
                  sortParam === 'cheapest'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Lowest Fare
              </button>
            </div>

            {/* Lagos Terminal Dropdown Filter (when either from or to is Lagos) */}
            {(fromParam === 'Lagos' || toParam === 'Lagos') && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Terminal:</span>
                <select
                  value={terminalFilter}
                  onChange={(e) => handleTerminalFilterChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-800 text-xs font-medium focus:ring-1 focus:ring-[#ca2484] min-h-[36px]"
                >
                  <option value="all">All Lagos Stations</option>
                  <option value="jibowu">Jibowu (Yaba)</option>
                  <option value="ajah">Ajah (Lekki)</option>
                  <option value="festac">Festac Town</option>
                </select>
              </div>
            )}
          </div>

          {/* 5. Trip Results List */}
          {loading ? (
            /* Static skeleton blocks with zero pulse */
            <div className="space-y-4">
              <div className="h-40 bg-slate-100 border border-slate-200 rounded-xl" />
              <div className="h-40 bg-slate-100 border border-slate-200 rounded-xl" />
              <div className="h-40 bg-slate-100 border border-slate-200 rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-8 border border-red-200 rounded-xl bg-red-50 text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry Search
              </Button>
            </div>
          ) : sortedTrips.length === 0 ? (
            <div className="p-10 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-3">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                No departures available for {dateParam}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All vehicles on this date may be fully booked or departed. Try checking the next day.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDayOffset(1)}
              >
                Check Next Day
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTrips.map((trip) => {
                const totalFare = trip.fareKobo * passengersParam;
                const isFewSeats = trip.seatsLeft <= 2 && trip.seatsLeft > 0;

                return (
                  <div
                    key={trip.id}
                    className={`p-5 sm:p-6 rounded-xl border bg-white shadow-xs transition-colors ${
                      trip.bookable
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-slate-200 opacity-70 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      {/* Left Side: Departure Time, Route, and Terminals */}
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#ca2484]" />
                            <TimeText utcDateString={trip.departureTimeUtc} format="short" />
                          </div>

                          {!trip.bookable && (
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              {trip.unavailableReason ?? 'Unavailable'}
                            </span>
                          )}

                          {trip.bookable && isFewSeats && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Only {trip.seatsLeft} {trip.seatsLeft === 1 ? 'seat' : 'seats'} left!
                            </span>
                          )}

                          {trip.bookable && !isFewSeats && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {trip.seatsLeft} seats available
                            </span>
                          )}
                        </div>

                        {/* Terminals Route Line */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Boarding Terminal (Origin)
                            </span>
                            <span className="font-bold text-slate-900 block text-sm">
                              {trip.originTerminal.name}
                            </span>
                            <span className="text-slate-500 block text-[11px]">
                              {trip.originTerminal.address}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Arrival Terminal (Destination)
                            </span>
                            <span className="font-bold text-slate-900 block text-sm">
                              {trip.destinationTerminal.name}
                            </span>
                            <span className="text-slate-500 block text-[11px]">
                              {trip.destinationTerminal.address}
                            </span>
                          </div>
                        </div>

                        {/* Vehicle details */}
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex flex-wrap gap-3">
                          <span>{trip.vehicle.model}</span>
                          <span>&bull;</span>
                          <span>5 Passenger Seats</span>
                          <span>&bull;</span>
                          <span>A/C &amp; Extra Legroom</span>
                        </div>
                      </div>

                      {/* Right Side: Fare and Booking CTA */}
                      <div className="flex md:flex-col justify-between md:justify-end items-end md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Fare per seat
                          </span>
                          <div className="text-lg font-bold text-slate-900">
                            <MoneyText
                              kobo={trip.fareKobo}
                              isPlaceholder={trip.isPlaceholder}
                            />
                          </div>
                          {passengersParam > 1 && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Total: <MoneyText kobo={totalFare} isPlaceholder={trip.isPlaceholder} /> ({passengersParam} pass.)
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          {trip.bookable ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${trip.id}?passengers=${passengersParam}`)}
                              className="px-5 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded shadow-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Select Seats</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded min-h-[44px] cursor-not-allowed"
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

      {/* Guidelines footer notice */}
      <SectionBanner title="Ascent Transport Fixed Departure Guarantee">
        <p>
          All Sienna departures leave strictly on schedule. Please report to your departure terminal 30 minutes prior to your trip time with your booking reference.
        </p>
      </SectionBanner>
    </div>
  );
}
