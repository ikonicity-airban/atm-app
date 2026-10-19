'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  BRAND,
  type ServedCity,
} from '@atm/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverTrigger, PopoverPopup, PopoverClose, PopoverTitle } from '@/components/ui/Popover';

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
  const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | 'passengers' | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);

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
    <div className="relative w-full overflow-hidden bg-background text-foreground transition-colors pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-border/40">
      {/* Ambient background glows matching theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle radial ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-500/10 via-[#ca2484]/15 to-indigo-500/10 dark:from-purple-900/30 dark:via-[#ca2484]/20 dark:to-indigo-900/30 rounded-full blur-[100px]" />

        {/* Background visual image in dark mode */}
        <div className="hidden dark:block absolute inset-0 opacity-20 mix-blend-screen">
          <img
            src="/images/hero/highway-sunset.jpg"
            alt="Interstate Highway Corridor"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07030f] via-transparent to-[#07030f]" />
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto z-10 space-y-6 sm:space-y-8">
        {/* 1. Centered Top Pill Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 dark:bg-[#1b1030]/80 border border-border text-foreground/80 dark:text-purple-200 text-xs font-normal backdrop-blur-md shadow-xs">
            <Star className="w-3.5 h-3.5 text-primary" />
            <span>Nigeria Executive Interstate Fleet 2026</span>
          </div>
        </div>

        {/* 2. Main Typographic Headline */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-[1vw] md:text-6xl font-heading font-black tracking-tight leading-[1.1] text-balance">
            <span className="block text-foreground">Your Journey Begins in</span>
            <span className="block bg-linear-to-br from-purple-300 via-pink-700 to-[#9a2484] dark:from-[#e9d5ff] dark:via-[#c084fc] dark:to-[#ca2484] bg-clip-text text-transparent">
              One Click
            </span>
          </h1>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty font-normal">
            Experience comfortable 5 passenger Toyota Sienna interstate travel across Lagos, Abuja, Enugu, and Owerri with instant seat reservation.
          </p>
        </div>

        {/* 3. Floating Glassmorphism Search Island */}
        <div
          ref={containerRef}
          className="w-full max-w-4xl mx-auto rounded-3xl glass-card-spatial p-4 sm:p-6 relative"
        >
          {/* Top Bar: Mode Tabs (Left) + Utility Options (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            {/* Trip Mode Segmented Pills */}
            <div className="inline-flex items-center p-1 rounded-full bg-muted/50 dark:bg-white/10 border border-border">
              <button
                type="button"
                onClick={() => setTripMode('one-way')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer min-h-[36px] ${tripMode === 'one-way'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setTripMode('round-trip')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer min-h-[36px] ${tripMode === 'round-trip'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setTripMode('charter')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer min-h-[36px] ${tripMode === 'charter'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Private Charter
              </button>
            </div>

            {/* Utility Actions (Promo Code + Terminal Directory) */}
            <div className="flex items-center gap-2">
              <Popover open={isPromoOpen} onOpenChange={setIsPromoOpen}>
                <PopoverTrigger
                  className="px-3 py-1 rounded-full bg-muted/40 hover:bg-muted/70 border border-border text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                >
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{appliedPromo ? `Promo: ${appliedPromo}` : 'Add Promo Code'}</span>
                </PopoverTrigger>
                <PopoverPopup className="w-72 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <PopoverTitle>Enter Promo Voucher</PopoverTitle>
                    <PopoverClose />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      placeholder="e.g. ASCENT2026"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (promoCode.trim()) {
                          setAppliedPromo(promoCode.trim());
                          setIsPromoOpen(false);
                        }
                      }}
                      className="font-normal"
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverPopup>
              </Popover>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/terminals') : (window.location.href = '/terminals')}
                className="px-3 py-1 rounded-full bg-muted/40 hover:bg-muted/70 border border-border text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Terminals</span>
              </button>
            </div>
          </div>

          {/* Search Inputs Row with Distinct Labels Above Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4 items-end">
            {/* 1. FROM City */}
            <div className="lg:col-span-3 space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                From
              </label>
              <div
                onClick={() => setOpenDropdown(openDropdown === 'from' ? null : 'from')}
                className="bg-background/80 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-border transition-colors cursor-pointer min-h-13 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="overflow-hidden">
                    <span className="text-xs font-normal text-foreground truncate block">
                      {fromCity} ({CITY_DETAILS[fromCity]?.code})
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {CITY_DETAILS[fromCity]?.terminal}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>

              {/* FROM Dropdown Modal */}
              {openDropdown === 'from' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 w-64 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-popover-foreground"
                >
                  <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Select Departure Hub
                  </div>
                  {SERVED_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleFromSelect(city)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-normal flex items-center justify-between cursor-pointer ${fromCity === city ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                        }`}
                    >
                      <div>
                        <div>{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button (Cleanly integrated between FROM and TO) */}
            <div className="hidden lg:flex lg:col-span-1 justify-center pb-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className="w-9 h-9 rounded-full"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* 2. TO City */}
            <div className="lg:col-span-3 space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                To
              </label>
              <div
                onClick={() => setOpenDropdown(openDropdown === 'to' ? null : 'to')}
                className="bg-background/80 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-border transition-colors cursor-pointer min-h-[58px] flex items-center justify-between"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="overflow-hidden">
                    <span className="text-xs font-normal text-foreground truncate block">
                      {toCity} ({CITY_DETAILS[toCity]?.code})
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {CITY_DETAILS[toCity]?.terminal}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>

              {/* TO Dropdown Modal */}
              {openDropdown === 'to' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 w-64 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-popover-foreground"
                >
                  <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Select Destination Hub
                  </div>
                  {availableDestinations.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleToSelect(city)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-normal flex items-center justify-between cursor-pointer ${toCity === city ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                        }`}
                    >
                      <div>
                        <div>{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DATE */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                Date
              </label>
              <div className="bg-background/80 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-border transition-colors min-h-[58px] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-normal text-foreground focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 4. PASSENGERS & CLASS */}
            <div className="lg:col-span-2 space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                Passengers
              </label>
              <div
                onClick={() => setOpenDropdown(openDropdown === 'passengers' ? null : 'passengers')}
                className="bg-background/80 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-border transition-colors cursor-pointer min-h-[58px] flex items-center justify-between"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-normal text-foreground truncate">
                    {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}, 5 Seat
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>

              {/* Passengers Stepper Modal */}
              {openDropdown === 'passengers' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-56 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl z-50 space-y-3 text-popover-foreground"
                >
                  <div className="text-xs font-normal text-foreground">5 Seat Sienna Cabin</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Seats</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 text-foreground font-normal flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-normal text-foreground">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.min(5, passengers + 1))}
                        disabled={passengers >= 5}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 text-foreground font-normal flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Strictly 5 passenger seats per vehicle.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <div className="pt-4 flex justify-end">
            <Button
              variant="default"
              size="default"
              onClick={handleSearch}
              className="w-full sm:w-auto px-8 font-normal text-xs sm:text-sm min-h-[48px] shadow-md"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search Now
            </Button>
          </div>
        </div>

        {/* 4. Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="font-medium text-foreground">4.9/5</span>
            <span>on Trustpilot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Secure Checkout</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" />
            <span>15,000+ Completed Trips</span>
          </div>
        </div>
      </div>

      {/* Floating Dispatch Assistance Bubble */}
      <a
        href={`https://wa.me/${BRAND.contactPhones[0].replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Dispatch Support"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-normal flex items-center justify-center">
          1
        </span>
      </a>
    </div>
  );
}
