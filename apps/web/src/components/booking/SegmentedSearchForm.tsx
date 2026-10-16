'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  searchParamsSchema,
  type ServedCity,
} from '@atm/shared';
import { ArrowLeftRight, Users, Calendar, MapPin, Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils.ts';

export interface SegmentedSearchFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialPassengers?: number;
  className?: string;
  onNavigate?: (path: string) => void;
  selectedCity?: { city: string; role?: 'from' | 'to'; timestamp: number } | null;
}

const STORAGE_KEY = 'atm_last_search';

const CITY_TERMINAL_SUBTITLES: Record<string, string> = {
  Enugu: 'Ogui Road Terminal',
  Abuja: 'Utako District Terminal',
  Lagos: 'Jibowu & Ajah Hubs',
  Owerri: 'Control Post Terminal',
};

export function SegmentedSearchForm({
  initialFrom,
  initialTo,
  initialDate,
  initialPassengers,
  className,
  onNavigate,
  selectedCity,
}: SegmentedSearchFormProps) {
  const todayLagos = getLagosDate();

  const [fromCity, setFromCity] = useState<string>(initialFrom || 'Enugu');
  const [toCity, setToCity] = useState<string>(initialTo || 'Abuja');
  const [date, setDate] = useState<string>(initialDate || todayLagos);
  const [passengers, setPassengers] = useState<number>(initialPassengers || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Synchronize when an external city is selected (e.g. clicking underlined city in hero)
  useEffect(() => {
    if (selectedCity && selectedCity.city) {
      const city = selectedCity.city;
      if (selectedCity.role === 'to') {
        const validDests = getServedDestinations(fromCity);
        if (validDests.includes(city as ServedCity)) {
          setToCity(city);
        } else {
          // If not served from current origin, adjust origin
          setFromCity(city === 'Enugu' ? 'Abuja' : 'Enugu');
          setToCity(city);
        }
      } else {
        handleFromChange(city);
      }
    }
  }, [selectedCity]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const servedDestinations = getServedDestinations(fromCity);

  const handleFromChange = (newFrom: string) => {
    setFromCity(newFrom);
    const validDests = getServedDestinations(newFrom);
    if (!validDests.includes(toCity as ServedCity)) {
      setToCity(validDests[0] || 'Lagos');
    }
  };

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 300);

    const prevFrom = fromCity;
    const prevTo = toCity;

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

  // Compute formatted weekday name in Lagos time
  const getWeekdayLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00Z');
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'Africa/Lagos',
      }).format(d);
    } catch {
      return 'WAT';
    }
  };

  return (
    <form
      ref={formRef}
      action="/trips"
      method="GET"
      onSubmit={handleSubmit}
      className={cn('md:w-3/4 mx-auto relative z-30', className)}
    >
      <input type="hidden" name="from" value={fromCity} />
      <input type="hidden" name="to" value={toCity} />

      {/* Floating Segmented Island Tray matching the reference style with card gradients */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-b from-white/95 via-white/90 to-purple-50/40 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl shadow-xl border border-purple-200/50 ring-1 ring-purple-900/5"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-2">
          {/* 1. Origin Card with Animated Height Expansion */}
          <motion.div
            layout
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex-1 bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl p-2 sm:p-2.5 border transition-colors relative cursor-pointer select-none",
              openDropdown === 'from'
                ? "border-[#ca2484] shadow-md ring-2 ring-pink-500/15"
                : "border-purple-100/80 shadow-2xs hover:border-[#ca2484]/40 hover:shadow-xs"
            )}
            onClick={() => setOpenDropdown(prev => prev === 'from' ? null : 'from')}
            role="combobox"
            aria-expanded={openDropdown === 'from'}
            aria-label="Select Departure City"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#ca2484]" />
                <span>Travelling From</span>
              </div>
              <motion.div
                animate={{ rotate: openDropdown === 'from' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </div>

            <div className="relative">
              <div className="text-sm sm:text-base font-bold text-slate-900 font-heading truncate">
                {fromCity}
              </div>
              <div className="text-[10px] font-medium text-slate-500 truncate pointer-events-none">
                {CITY_TERMINAL_SUBTITLES[fromCity] ?? 'Ascent Terminal'}
              </div>
            </div>

            {/* Expandable Dropdown List with AnimatePresence */}
            <AnimatePresence>
              {openDropdown === 'from' && (
                <motion.div
                  key="from-dropdown-tray"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="pt-2 mt-1.5 border-t border-purple-100/80 flex flex-col gap-1 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {SERVED_CITIES.map((city) => {
                    const isSelected = fromCity === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          handleFromChange(city);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs",
                          isSelected
                            ? "bg-purple-100/80 text-purple-950 font-bold"
                            : "text-slate-700 hover:bg-purple-50 hover:text-slate-900"
                        )}
                      >
                        <div className="truncate">
                          <span className="font-heading font-bold">{city}</span>
                          <span className="block text-[9px] font-normal text-slate-500 truncate">
                            {CITY_TERMINAL_SUBTITLES[city]}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ca2484] flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {errors.from && (
              <p className="text-[9px] text-red-600 font-bold absolute left-2 -bottom-3.5">
                {errors.from}
              </p>
            )}
          </motion.div>

          {/* 2. Circular Swap Button */}
          <div className="flex items-center justify-center self-center -my-1 lg:my-0 lg:pt-3">
            <motion.button
              type="button"
              onClick={handleSwap}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92, rotate: 180 }}
              animate={isSwapping ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.25 }}
              aria-label="Swap origin and destination cities"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#ca2484] to-[#9333ea] hover:from-[#aa1769] hover:to-[#7e22ce] text-white flex items-center justify-center shadow-md transition-shadow hover:shadow-pink-500/25 cursor-pointer flex-shrink-0 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* 3. Destination Card with Animated Height Expansion */}
          <motion.div
            layout
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex-1 bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl p-2 sm:p-2.5 border transition-colors relative cursor-pointer select-none",
              openDropdown === 'to'
                ? "border-[#ca2484] shadow-md ring-2 ring-pink-500/15"
                : "border-purple-100/80 shadow-2xs hover:border-[#ca2484]/40 hover:shadow-xs"
            )}
            onClick={() => setOpenDropdown(prev => prev === 'to' ? null : 'to')}
            role="combobox"
            aria-expanded={openDropdown === 'to'}
            aria-label="Select Destination City"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#ca2484]" />
                <span>Travelling To</span>
              </div>
              <motion.div
                animate={{ rotate: openDropdown === 'to' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </div>

            <div className="relative">
              <div className="text-sm sm:text-base font-bold text-slate-900 font-heading truncate">
                {toCity}
              </div>
              <div className="text-[10px] font-medium text-slate-500 truncate pointer-events-none">
                {CITY_TERMINAL_SUBTITLES[toCity] ?? 'Ascent Terminal'}
              </div>
            </div>

            {/* Expandable Dropdown List with AnimatePresence */}
            <AnimatePresence>
              {openDropdown === 'to' && (
                <motion.div
                  key="to-dropdown-tray"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="pt-2 mt-1.5 border-t border-purple-100/80 flex flex-col gap-1 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {servedDestinations.map((dest) => {
                    const isSelected = toCity === dest;
                    return (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => {
                          setToCity(dest);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs",
                          isSelected
                            ? "bg-purple-100/80 text-purple-950 font-bold"
                            : "text-slate-700 hover:bg-purple-50 hover:text-slate-900"
                        )}
                      >
                        <div className="truncate">
                          <span className="font-heading font-bold">{dest}</span>
                          <span className="block text-[9px] font-normal text-slate-500 truncate">
                            {CITY_TERMINAL_SUBTITLES[dest]}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ca2484] flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {errors.to && (
              <p className="text-[9px] text-red-600 font-bold absolute left-2 -bottom-3.5">
                {errors.to}
              </p>
            )}
          </motion.div>

          {/* 4. Travel Date Card */}
          <motion.div
            whileHover={{ y: -1 }}
            className="flex-1 bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl p-2 sm:p-2.5 border border-purple-100/80 shadow-2xs hover:border-[#ca2484]/40 hover:shadow-xs transition-all relative"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <Calendar className="w-3 h-3 text-[#ca2484]" />
              <span>Departure Date</span>
            </div>
            <div className="relative">
              <input
                type="date"
                id="date-segmented"
                name="date"
                value={date}
                min={todayLagos}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm sm:text-base font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer font-heading"
                aria-label="Departure Date"
              />
              <div className="text-[10px] font-medium text-slate-500 truncate pointer-events-none">
                {getWeekdayLabel(date)}
              </div>
            </div>
            {errors.date && (
              <p className="text-[9px] text-red-600 font-bold absolute left-2 -bottom-3.5">
                {errors.date}
              </p>
            )}
          </motion.div>

          {/* 5. Passenger Seats Card */}
          <motion.div
            whileHover={{ y: -1 }}
            className="flex-1 bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl p-2 sm:p-2.5 border border-purple-100/80 shadow-2xs hover:border-[#ca2484]/40 hover:shadow-xs transition-all"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <Users className="w-3 h-3 text-[#ca2484]" />
              <span>Seats (Max 5)</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <input type="hidden" name="passengers" value={passengers} />
                <div className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                  {passengers} {passengers === 1 ? 'Seat' : 'Seats'}
                </div>
                <div className="text-[10px] font-medium text-slate-500 truncate">
                  Toyota Sienna
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePassengerChange(-1)}
                  disabled={passengers <= 1}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center justify-center transition-colors cursor-pointer min-h-[36px] min-w-[36px] shadow-2xs"
                  aria-label="Decrease passenger count"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handlePassengerChange(1)}
                  disabled={passengers >= 5}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center justify-center transition-colors cursor-pointer min-h-[36px] min-w-[36px] shadow-2xs"
                  aria-label="Increase passenger count"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>

          {/* 6. Action Search Button */}
          <div className="flex items-center justify-center self-center lg:pt-3">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Search scheduled departures"
              className="w-full lg:w-14 h-14 rounded-xl bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#ca2484] hover:from-[#3b0764] hover:to-[#aa1769] text-white flex items-center justify-center shadow-lg transition-all cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <Search className="w-5 h-5" />
              <span className="hidden ml-2 font-bold text-xs font-heading">Find Sienna Trips</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </form>
  );
}

