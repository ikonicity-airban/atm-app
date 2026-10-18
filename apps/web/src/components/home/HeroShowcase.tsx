'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Tag,
  SlidersHorizontal,
  Star,
  ShieldCheck,
  Globe,
  MessageCircle,
  ArrowRightLeft,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  BRAND,
  type ServedCity,
} from '@atm/shared';

interface HeroShowcaseProps {
  onNavigate?: (path: string) => void;
}

const CITY_DETAILS: Record<string, { code: string; terminal: string }> = {
  Enugu: { code: 'ENU', terminal: 'Ogui Road Terminal' },
  Abuja: { code: 'ABV', terminal: 'Utako District Terminal' },
  Lagos: { code: 'LOS', terminal: 'Jibowu & Ajah Hubs' },
  Owerri: { code: 'QOW', terminal: 'Control Post Terminal' },
};

export function HeroShowcase({ onNavigate }: HeroShowcaseProps) {
  const [tripMode, setTripMode] = useState<'one-way' | 'round-trip' | 'charter'>('one-way');
  const [fromCity, setFromCity] = useState<ServedCity>('Enugu');
  const [toCity, setToCity] = useState<ServedCity>('Abuja');
  const [date, setDate] = useState<string>(() => getLagosDate());
  const [passengers, setPassengers] = useState<number>(1);
  const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | 'passengers' | 'promo' | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const validDests = getServedDestinations(toCity);
    if (validDests.includes(fromCity)) {
      const prevFrom = fromCity;
      setFromCity(toCity);
      setToCity(prevFrom);
    } else {
      const fallback = validDests[0] || 'Abuja';
      setFromCity(toCity);
      setToCity(fallback);
    }
  };

  const handleFromSelect = (city: ServedCity) => {
    setFromCity(city);
    const validDests = getServedDestinations(city);
    if (!validDests.includes(toCity)) {
      setToCity(validDests[0] || 'Abuja');
    }
    setOpenDropdown(null);
  };

  const handleToSelect = (city: ServedCity) => {
    setToCity(city);
    setOpenDropdown(null);
  };

  const handleSearch = () => {
    if (tripMode === 'charter') {
      const url = `/charter?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`;
      if (onNavigate) {
        onNavigate(url);
      } else {
        window.location.href = url;
      }
      return;
    }

    const params = new URLSearchParams({
      from: fromCity,
      to: toCity,
      date,
      passengers: String(passengers),
    });

    if (appliedPromo) {
      params.set('promo', appliedPromo);
    }

    const url = `/trips?${params.toString()}`;
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const availableDestinations = getServedDestinations(fromCity);

  return (
    <div className="relative w-full overflow-hidden bg-[#07030f] text-white pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
      {/* Cinematic Cosmic Background with Streaks of Violet Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep ambient radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-900/30 via-[#ca2484]/20 to-indigo-900/30 rounded-full blur-[120px]" />
        
        {/* Subtle vehicle highway silhouette in the dusk distance */}
        <div className="absolute inset-0 opacity-25 mix-blend-screen">
          <img
            src="/images/hero/highway-sunset.jpg"
            alt="Interstate Highway Corridor"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07030f] via-transparent to-[#07030f]" />
        </div>

        {/* Diagonal violet speed streaks matching reference graphic */}
        <div className="absolute top-1/3 -left-20 w-[140%] h-[2px] bg-gradient-to-r from-transparent via-[#b77bfb]/50 to-transparent transform -rotate-12 blur-[1px]" />
        <div className="absolute top-1/2 -left-20 w-[140%] h-[3px] bg-gradient-to-r from-transparent via-[#ca2484]/40 to-transparent transform -rotate-6 blur-[1.5px]" />
      </div>

      <div className="relative max-w-6xl mx-auto z-10 space-y-6 sm:space-y-8">
        {/* 1. Centered Top Pill Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b1030]/80 border border-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#ca2484]" />
            <span>Nigeria Executive Interstate Fleet 2026</span>
          </div>
        </div>

        {/* 2. Centered Main Typographic Headline */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-balance">
            <span className="block text-white">Your Journey Begins in</span>
            <span className="block bg-gradient-to-r from-[#e9d5ff] via-[#c084fc] to-[#ca2484] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]">
              One Click
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-purple-200/80 max-w-2xl mx-auto leading-relaxed text-pretty font-normal">
            Experience the future of interstate travel. Book air conditioned 5 passenger Toyota Siennas across Lagos, Abuja, Enugu, and Owerri from a single, unified interface.
          </p>
        </div>

        {/* 3. Floating Translucent Glass Search Card */}
        <div
          ref={containerRef}
          className="w-full max-w-5xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] bg-[#120a22]/80 backdrop-blur-2xl border border-white/10 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_50px_rgba(168,85,247,0.15)] relative"
        >
          {/* Top Bar inside Card: Mode Tabs (Left) + Secondary Options (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            {/* Trip Mode Segmented Pills */}
            <div className="inline-flex items-center p-1 rounded-full bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setTripMode('one-way')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  tripMode === 'one-way'
                    ? 'bg-[#2b1c47] text-white shadow-inner border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setTripMode('round-trip')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  tripMode === 'round-trip'
                    ? 'bg-[#2b1c47] text-white shadow-inner border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setTripMode('charter')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  tripMode === 'charter'
                    ? 'bg-[#2b1c47] text-white shadow-inner border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Private Charter
              </button>
            </div>

            {/* Utility Actions (Promo Code + Terminal Directory) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'promo' ? null : 'promo')}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>{appliedPromo ? `Promo: ${appliedPromo}` : 'Add Promo Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/terminals') : (window.location.href = '/terminals')}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Terminal Directory</span>
              </button>
            </div>
          </div>

          {/* Promo Code Popover */}
          {openDropdown === 'promo' && (
            <div className="absolute top-16 right-6 z-50 w-72 p-4 rounded-2xl bg-[#1b1030] border border-purple-500/40 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Enter Discount Voucher</span>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ASCENT2026"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white uppercase placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (promoCode.trim()) {
                      setAppliedPromo(promoCode.trim());
                      setOpenDropdown(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#ca2484] hover:bg-[#aa1769] text-white text-xs font-bold min-h-[36px]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Search Inputs Row: 5 Recessed Dark Capsules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-4">
            {/* 1. FROM City Capsule */}
            <div
              onClick={() => setOpenDropdown(openDropdown === 'from' ? null : 'from')}
              className="lg:col-span-3 bg-[#0a0414]/90 rounded-2xl p-3 border border-white/5 hover:border-purple-500/40 transition-colors relative cursor-pointer min-h-[66px] flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                FROM
              </span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#c084fc] flex-shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-sm font-bold text-white truncate block">
                    {fromCity} ({CITY_DETAILS[fromCity]?.code})
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {CITY_DETAILS[fromCity]?.terminal}
                  </span>
                </div>
              </div>

              {/* FROM Dropdown Modal */}
              {openDropdown === 'from' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#180d2e] border border-purple-500/30 rounded-2xl p-2 shadow-2xl z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Departure Hub
                  </div>
                  {SERVED_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleFromSelect(city)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        fromCity === city ? 'bg-[#ca2484] text-white' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button (Desktop Center Floating Icon) */}
            <div className="hidden lg:flex absolute left-[24.2%] top-[60%] -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className="w-8 h-8 rounded-full bg-[#201338] border border-purple-500/40 text-purple-300 hover:text-white hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. TO City Capsule */}
            <div
              onClick={() => setOpenDropdown(openDropdown === 'to' ? null : 'to')}
              className="lg:col-span-3 bg-[#0a0414]/90 rounded-2xl p-3 border border-white/5 hover:border-purple-500/40 transition-colors relative cursor-pointer min-h-[66px] flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TO
              </span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ca2484] flex-shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-sm font-bold text-white truncate block">
                    {toCity} ({CITY_DETAILS[toCity]?.code})
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {CITY_DETAILS[toCity]?.terminal}
                  </span>
                </div>
              </div>

              {/* TO Dropdown Modal */}
              {openDropdown === 'to' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#180d2e] border border-purple-500/30 rounded-2xl p-2 shadow-2xl z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Destination Hub
                  </div>
                  {availableDestinations.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleToSelect(city)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        toCity === city ? 'bg-[#ca2484] text-white' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DATE Capsule */}
            <div className="lg:col-span-2 bg-[#0a0414]/90 rounded-2xl p-3 border border-white/5 hover:border-purple-500/40 transition-colors relative min-h-[66px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DATE
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 4. PASSENGERS & CLASS Capsule */}
            <div
              onClick={() => setOpenDropdown(openDropdown === 'passengers' ? null : 'passengers')}
              className="lg:col-span-2 bg-[#0a0414]/90 rounded-2xl p-3 border border-white/5 hover:border-purple-500/40 transition-colors relative cursor-pointer min-h-[66px] flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PASSENGERS &amp; CLASS
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {passengers} {passengers === 1 ? 'Adult' : 'Adults'}, 5 Seat
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </div>

              {/* Passengers Stepper Modal */}
              {openDropdown === 'passengers' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#180d2e] border border-purple-500/30 rounded-2xl p-4 shadow-2xl z-50 space-y-3"
                >
                  <div className="text-xs font-bold text-white">5 Passenger Sienna Cabin</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Seats</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-white">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.min(5, passengers + 1))}
                        disabled={passengers >= 5}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-purple-300">
                    Maximum 5 seats per vehicle. Zero middle row congestion.
                  </div>
                </div>
              )}
            </div>

            {/* 5. Glowing Search Now Button */}
            <div className="lg:col-span-2 flex items-stretch">
              <button
                type="button"
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-[#9d4edd] via-[#c084fc] to-[#ca2484] hover:opacity-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 p-3 min-h-[66px] shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(202,36,132,0.6)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Search className="w-4 h-4 text-white" />
                <span className="text-sm font-bold">Search Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Centered Bottom Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-white">4.9/5</span>
            <span className="text-slate-400">on Trustpilot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">100% Secure Checkout</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">15,000+ Completed Trips</span>
          </div>
        </div>
      </div>

      {/* Floating Dispatch Assistance Bubble (Bottom Right) */}
      <a
        href={`https://wa.me/${BRAND.contactPhones[0].replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Dispatch Support"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#9d4edd] to-[#ca2484] shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center text-white hover:scale-105 transition-transform cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#07030f]">
          01
        </span>
      </a>
    </div>
  );
}
