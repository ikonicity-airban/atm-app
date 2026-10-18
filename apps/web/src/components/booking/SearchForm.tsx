'use client';

import React, { useState, useEffect } from 'react';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  searchParamsSchema,
  type ServedCity,
} from '@atm/shared';
import { ArrowLeftRight, Users, Calendar, MapPin, Search, ChevronDown } from 'lucide-react';
import { DateField } from '../ui/DateField.tsx';
import { Button } from '../ui/Button.tsx';
import { cn } from '../../lib/utils.ts';

export interface SearchFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialPassengers?: number;
  className?: string;
  compact?: boolean;
  onNavigate?: (path: string) => void;
}

const STORAGE_KEY = 'atm_last_search';

export function SearchForm({
  initialFrom,
  initialTo,
  initialDate,
  initialPassengers,
  className,
  compact = false,
  onNavigate,
}: SearchFormProps) {
  const todayLagos = getLagosDate();

  // Load from props or defaults
  const [fromCity, setFromCity] = useState<string>(initialFrom || 'Enugu');
  const [toCity, setToCity] = useState<string>(initialTo || 'Abuja');
  const [date, setDate] = useState<string>(initialDate || todayLagos);
  const [passengers, setPassengers] = useState<number>(initialPassengers || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Client-side localStorage memory guard
  useEffect(() => {
    if (!initialFrom && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.from && SERVED_CITIES.includes(parsed.from)) setFromCity(parsed.from);
          if (parsed.to && SERVED_CITIES.includes(parsed.to)) setToCity(parsed.to);
          if (parsed.passengers) setPassengers(Number(parsed.passengers) || 1);
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }, [initialFrom]);

  // When From city changes, ensure To city is one of the served destinations
  const servedDestinations = getServedDestinations(fromCity);

  const handleFromChange = (newFrom: string) => {
    setFromCity(newFrom);
    const validDests = getServedDestinations(newFrom);
    if (!validDests.includes(toCity as ServedCity)) {
      setToCity(validDests[0] || 'Lagos');
    }
  };

  const handleSwap = () => {
    const prevFrom = fromCity;
    const prevTo = toCity;

    // Only swap if the reverse route is served
    const reverseServed = getServedDestinations(prevTo);
    if (reverseServed.includes(prevFrom as ServedCity)) {
      setFromCity(prevTo);
      setToCity(prevFrom);
    } else {
      setFromCity(prevTo);
      setToCity(reverseServed[0] || 'Lagos');
    }
  };

  const handlePassengerChange = (delta: number) => {
    setPassengers((prev) => Math.min(5, Math.max(1, prev + delta)));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validate with shared Zod schema
    const result = searchParamsSchema.safeParse({
      from: fromCity,
      to: toCity,
      date,
      passengers,
    });

    if (!result.success) {
      e.preventDefault();
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field) fieldErrors[String(field)] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ from: fromCity, to: toCity, passengers })
        );
      } catch {
        // Ignore storage write failure
      }
    }

    if (onNavigate) {
      e.preventDefault();
      onNavigate(
        `/trips?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(
          toCity
        )}&date=${encodeURIComponent(date)}&passengers=${passengers}`
      );
    }
  };

  return (
    <form
      action="/trips"
      method="GET"
      onSubmit={handleSubmit}
      className={cn(
        compact
          ? 'bg-transparent border-0 shadow-none p-0'
          : 'bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-6 transition-all',
        className
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 items-end">
        {/* Origin City Select */}
        <div className={compact ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <label
            htmlFor="from-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Travelling From
          </label>
          <div className="relative">
            <select
              id="from-select"
              name="from"
              value={fromCity}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[46px] appearance-none transition-all cursor-pointer"
            >
              {SERVED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Inline floating swap button on desktop when compact */}
            {compact && (
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination cities"
                title="Swap cities"
                className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-xs hover:border-brand-500 hover:text-brand-600 text-slate-500 items-center justify-center cursor-pointer transition-all active:scale-[0.92]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {errors.from && <p className="text-xs text-red-600 mt-1">{errors.from}</p>}
        </div>

        {/* Swap Button (mobile / full layout) */}
        {!compact ? (
          <div className="flex items-center justify-center lg:col-span-1">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination cities"
              className="p-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-brand-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer focus:ring-2 focus:ring-brand-500 active:scale-[0.95]"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex sm:hidden justify-center my-0.5">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination cities"
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.95]"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-brand-600" />
              <span>Swap Cities</span>
            </button>
          </div>
        )}

        {/* Destination City Select (filtered by origin) */}
        <div className={compact ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <label
            htmlFor="to-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Travelling To
          </label>
          <div className="relative">
            <select
              id="to-select"
              name="to"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[46px] appearance-none transition-all cursor-pointer"
            >
              {servedDestinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.to && <p className="text-xs text-red-600 mt-1">{errors.to}</p>}
        </div>

        {/* Travel Date Field */}
        <div className={compact ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <DateField
            label="Departure Date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            hasError={Boolean(errors.date)}
            errorMessage={errors.date}
          />
        </div>

        {/* Passengers Stepper (1 to 5) */}
        <div className={compact ? 'lg:col-span-2' : 'lg:col-span-2'}>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Passengers
          </label>
          <div className="flex items-center border border-slate-200/90 rounded-xl bg-slate-50/70 min-h-[46px] overflow-hidden">
            <input type="hidden" name="passengers" value={passengers} />
            <button
              type="button"
              disabled={passengers <= 1}
              onClick={() => handlePassengerChange(-1)}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[46px] min-w-[38px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
              aria-label="Decrease passenger count"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-sm text-slate-900 flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{passengers}</span>
            </div>
            <button
              type="button"
              disabled={passengers >= 5}
              onClick={() => handlePassengerChange(1)}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[46px] min-w-[38px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
              aria-label="Increase passenger count"
            >
              +
            </button>
          </div>
          {errors.passengers && (
            <p className="text-xs text-red-600 mt-1">{errors.passengers}</p>
          )}
        </div>

        {/* Submit Search Button */}
        <div className={compact ? 'lg:col-span-2 sm:col-span-2' : 'lg:col-span-12 lg:mt-2'}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full min-h-[46px] rounded-xl text-sm font-bold shadow-md shadow-brand-600/20 active:scale-[0.97]"
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find Trips
          </Button>
        </div>
      </div>
    </form>
  );
}
