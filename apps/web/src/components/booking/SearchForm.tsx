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
import { NativeSelect } from '../ui/Select.tsx';
import { Icon } from '../ui/Icon.tsx';
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

  // Sync state when props change (from URL or 7-day strip)
  useEffect(() => {
    if (initialFrom) setFromCity(initialFrom);
  }, [initialFrom]);

  useEffect(() => {
    if (initialTo) setToCity(initialTo);
  }, [initialTo]);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    if (initialPassengers) setPassengers(initialPassengers);
  }, [initialPassengers]);

  // When From city changes, ensure To city is one of the served destinations
  const servedDestinations = getServedDestinations(fromCity);

  const triggerAutoNavigate = (
    nextFrom: string,
    nextTo: string,
    nextDate: string,
    nextPassengers: number
  ) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ from: nextFrom, to: nextTo, passengers: nextPassengers })
        );
      } catch {
        // Ignore storage write failure
      }
    }
    if (onNavigate) {
      onNavigate(
        `/trips?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(
          nextTo
        )}&date=${encodeURIComponent(nextDate)}&passengers=${nextPassengers}`
      );
    }
  };

  const handleFromChange = (newFrom: string) => {
    setFromCity(newFrom);
    const validDests = getServedDestinations(newFrom);
    const nextTo = validDests.includes(toCity as ServedCity)
      ? toCity
      : (validDests[0] || 'Lagos');
    if (nextTo !== toCity) {
      setToCity(nextTo);
    }
    if (compact && onNavigate) {
      triggerAutoNavigate(newFrom, nextTo, date, passengers);
    }
  };

  const handleSwap = () => {
    const prevFrom = fromCity;
    const prevTo = toCity;

    // Only swap if the reverse route is served
    const reverseServed = getServedDestinations(prevTo);
    const nextTo = reverseServed.includes(prevFrom as ServedCity)
      ? prevFrom
      : (reverseServed[0] || 'Lagos');
    setFromCity(prevTo);
    setToCity(nextTo);

    if (compact && onNavigate) {
      triggerAutoNavigate(prevTo, nextTo, date, passengers);
    }
  };

  const handleToChange = (newTo: string) => {
    setToCity(newTo);
    if (compact && onNavigate) {
      triggerAutoNavigate(fromCity, newTo, date, passengers);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (compact && onNavigate) {
      triggerAutoNavigate(fromCity, toCity, newDate, passengers);
    }
  };

  const handlePassengerChange = (delta: number) => {
    const nextCount = Math.min(5, Math.max(1, passengers + delta));
    setPassengers(nextCount);
    if (compact && onNavigate) {
      triggerAutoNavigate(fromCity, toCity, date, nextCount);
    }
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
          : 'bg-card rounded-2xl border border-border shadow-md p-5 sm:p-6 transition-all',
        className
      )}
    >
      <div
        className={cn(
          compact
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-4 items-end'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 items-end'
        )}
      >
        {/* Origin City Select */}
        <div className={compact ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <label
            htmlFor="from-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Travelling From
          </label>
          <div className="relative">
            <NativeSelect
              id="from-select"
              name="from"
              value={fromCity}
              onChange={(e) => handleFromChange(e.target.value)}
              startIcon={MapPin}
            >
              {SERVED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </NativeSelect>

            {/* Inline floating swap button on desktop when compact */}
            {compact && (
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination cities"
                title="Swap cities"
                className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-card border border-border shadow-xs hover:border-primary hover:text-primary text-muted-foreground items-center justify-center cursor-pointer transition-all active:scale-[0.92]"
              >
                <Icon icon={ArrowLeftRight} size="sm" />
              </button>
            )}
          </div>
          {errors.from && <p className="text-xs text-destructive mt-1">{errors.from}</p>}
        </div>

        {/* Swap Button (mobile / full layout) */}
        {!compact ? (
          <div className="flex items-center justify-center lg:col-span-1">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination cities"
              className="p-2 rounded-full border border-border bg-muted/40 hover:bg-muted text-foreground hover:text-primary transition-all min-h-[36px] min-w-[36px] w-9 h-9 flex items-center justify-center cursor-pointer focus:ring-2 focus:ring-primary active:scale-[0.95]"
            >
              <Icon icon={ArrowLeftRight} />
            </button>
          </div>
        ) : (
          <div className="flex sm:hidden justify-center my-0.5">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination cities"
              className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.95]"
            >
              <Icon icon={ArrowLeftRight} size="sm" />
              <span>Swap Cities</span>
            </button>
          </div>
        )}

        {/* Destination City Select (filtered by origin) */}
        <div className={compact ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <label
            htmlFor="to-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Travelling To
          </label>
          <div className="relative">
            <NativeSelect
              id="to-select"
              name="to"
              value={toCity}
              onChange={(e) => handleToChange(e.target.value)}
              startIcon={MapPin}
            >
              {servedDestinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </NativeSelect>
          </div>
          {errors.to && <p className="text-xs text-destructive mt-1">{errors.to}</p>}
        </div>

        {/* Travel Date Field */}
        <div className={compact ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <DateField
            label="Departure Date"
            name="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            hasError={Boolean(errors.date)}
            errorMessage={errors.date}
          />
        </div>

        {/* Passengers Stepper (1 to 5) */}
        <div className={compact ? 'lg:col-span-2' : 'lg:col-span-2'}>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Passengers
          </label>
          <div className="flex items-center border border-input rounded-xl bg-background min-h-[44px] overflow-hidden">
            <input type="hidden" name="passengers" value={passengers} />
            <button
              type="button"
              disabled={passengers <= 1}
              onClick={() => handlePassengerChange(-1)}
              className="px-2.5 py-2 text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[44px] min-w-[36px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
              aria-label="Decrease passenger count"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-sm text-foreground flex items-center justify-center gap-1.5">
              <Icon icon={Users} size="sm" />
              <span>{passengers}</span>
            </div>
            <button
              type="button"
              disabled={passengers >= 5}
              onClick={() => handlePassengerChange(1)}
              className="px-2.5 py-2 text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base min-h-[44px] min-w-[36px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
              aria-label="Increase passenger count"
            >
              +
            </button>
          </div>
          {errors.passengers && (
            <p className="text-xs text-destructive mt-1">{errors.passengers}</p>
          )}
        </div>

        {/* Submit Search Button (icon only on desktop when compact, icon + text on mobile) */}
        <div className={compact ? 'sm:col-span-2 lg:col-span-1' : 'lg:col-span-12 lg:mt-2'}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            aria-label="Find Trips"
            title="Find Trips"
            className="w-full min-h-[46px] rounded-xl text-sm font-bold shadow-md shadow-brand-600/20 active:scale-[0.97] flex items-center justify-center p-0 lg:px-0"
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4 shrink-0" />
              <span className={compact ? 'lg:hidden' : ''}>Find Trips</span>
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}
