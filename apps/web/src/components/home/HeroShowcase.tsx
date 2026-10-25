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
  ArrowRight,
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
import { DateField } from '@/components/ui/DateField';
import { Icon } from '@/components/ui/Icon';
import { Popover, PopoverTrigger, PopoverPopup, PopoverClose, PopoverTitle } from '@/components/ui/Popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

interface HeroShowcaseProps {
  onNavigate?: (path: string) => void;
}

const CITY_DETAILS: Record<string, { code: string; terminal: string }> = {
  Enugu: { code: 'ENU', terminal: 'Ogui Road Terminal' },
  Abuja: { code: 'ABJ', terminal: 'Utako District Terminal' },
  Lagos: { code: 'LAG', terminal: 'Jibowu & Ajah Hubs' },
  Owerri: { code: 'IMO', terminal: 'Control Post Terminal' },
};

export function HeroShowcase({ onNavigate }: HeroShowcaseProps) {
  const [tripMode, setTripMode] = useState<'one-way' | 'round-trip' | 'charter'>('one-way');
  const [fromCity, setFromCity] = useState<ServedCity>('Enugu');
  const [toCity, setToCity] = useState<ServedCity>('Abuja');
  const [date, setDate] = useState<string>(() => getLagosDate());
  const [passengers, setPassengers] = useState<number>(1);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lightVideoRef = useRef<HTMLVideoElement>(null);
  const darkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    lightVideoRef.current?.play().catch(() => { });
    darkVideoRef.current?.play().catch(() => { });
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
  };

  const handleToSelect = (city: ServedCity) => {
    setToCity(city);
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
    <div className="relative w-full overflow-hidden bg-background text-foreground transition-colors h-[100dvh] min-h-[100dvh] md:h-auto md:min-h-0 pt-16 md:pt-32 pb-4 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-border/40 @container/hero [--muted-foreground:#2a161f] dark:[--muted-foreground:#a9a] md:rounded-b-[5%] flex flex-col justify-between md:block">
      {/* Ambient background glows and theme responsive video backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle radial ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-87.5 bg-linear-to-r from-purple-500/10 via-[#ca2484]/15 to-indigo-500/10 dark:from-purple-900/30 dark:via-[#ca2484]/20 dark:to-indigo-900/30 rounded-full blur-[100px]" />

        {/* Hero Video Backdrop: Light Mode */}
        <div className="block dark:hidden absolute inset-0 opacity-50 overflow-hidden motion-reduce:hidden">
          <video
            ref={lightVideoRef}
            src="/videos/hero/Minivan_driving_on_highway_20261020011710.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="w-full h-full object-cover object-center filter brightness-105 contrast-105"
          />
          <div className="absolute inset-0 bg-linear-to-b from-foreground/70 via-background/30 to-purple-900/60" />
        </div>

        {/* Hero Video Backdrop: Dark Mode */}
        <div className="hidden dark:block absolute inset-0 overflow-hidden opacity-50 mix-blend-screen motion-reduce:hidden">
          <video
            ref={darkVideoRef}
            src="/videos/hero/Vehicles_driving_on_highway_20261020060547.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#07030f] via-transparent to-[#07030f]" />
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto z-10 w-full h-full flex flex-col justify-between md:block md:space-y-8">
        {/* 1. Mobile Upper Section (Hero text centered in the middle of 60vh canvas) */}
        <div className="h-[58dvh] flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 md:h-auto md:block">
          {/* Centered Top Pill Badge */}
          <div className="flex justify-center mb-1 md:mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/20 dark:bg-[#1b1030]/80 border border-border text-foreground/80 dark:text-purple-200 text-xs font-normal backdrop-blur-md shadow-xs">
              <Icon icon={Star} size="xs" className="text-amber-400 fill-amber-400" />
              <span>Nigeria Executive Interstate Fleet 2026</span>
            </div>
          </div>

          {/* Main Typographic Headline */}
          <div className="md:text-center space-y-3 max-w-3xl mx-auto">
            <h1 className="text-6xl sm:text-5xl lg:text-7xl font-heading font-black tracking-tight leading-none md:leading-[1.1] text-balance">
              <span className="block text-foreground">Your Journey Begins in</span>
              <span className="block bg-linear-to-b from-purple-900/70 via-pink-800/30 to-[#450539] dark:from-[#e9d5ff] dark:via-[#c084fc] dark:to-[#941861] bg-clip-text text-transparent text-ellipsis">
                One Click
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty font-medium dark:font-normal text-shadow-2xl">
              Experience comfortable 5 passenger Toyota Sienna interstate travel across Lagos, Abuja, Enugu, and Owerri with instant seat reservation.
            </p>
          </div>
        </div>

        {/* 2. Mobile Only Dual CTAs (Positioned just below the 60vh line) */}
        <div className="md:hidden flex items-center justify-center gap-2.5 pt-1 pb-2 max-w-sm mx-auto w-full">
          <Button
            size="lg"
            onClick={() => onNavigate ? onNavigate('/trips') : (window.location.href = '/trips')}
            className="flex-1 font-bold text-xs sm:text-sm rounded-2xl min-h-12 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Find Trips</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate ? onNavigate('/manage') : (window.location.href = '/manage')}
            className="flex-1 font-semibold text-xs sm:text-sm rounded-2xl min-h-12 border-border/80 bg-background/50 dark:bg-black/30 backdrop-blur-md hover:bg-background flex items-center justify-center cursor-pointer"
          >
            Manage Bookings
          </Button>
        </div>

        {/* 3. Floating Glassmorphism Search Island (Desktop Only) */}
        <div
          ref={containerRef}
          className="hidden md:block w-full max-w-5xl mx-auto rounded-3xl glass-card-spatial p-4 sm:p-6 relative @container/search shadow-xl"
        >
          {/* Top Bar: Mode Tabs (Left) + Utility Options (Right) */}
          <div className="flex sm:items-center justify-between gap-3 pb-4 border-b border-border">
            {/* Trip Mode Segmented Pills */}
            <div className="inline-flex items-center p-1 rounded-full bg-muted/50 dark:bg-white/10 border border-border">
              <button
                type="button"
                onClick={() => setTripMode('one-way')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-all duration-200 cursor-pointer min-h-9 active:scale-[0.98] motion-reduce:transform-none ${tripMode === 'one-way'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Once <span className="max-sm:hidden">Way</span>
              </button>
              <button
                type="button"
                onClick={() => setTripMode('round-trip')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-all duration-200 cursor-pointer min-h-9 active:scale-[0.98] motion-reduce:transform-none ${tripMode === 'round-trip'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setTripMode('charter')}
                className={`px-3.5 py-1 rounded-full text-xs font-normal transition-all duration-200 cursor-pointer min-h-9 active:scale-[0.98] motion-reduce:transform-none ${tripMode === 'charter'
                  ? 'bg-background dark:bg-[#2b1c47] text-foreground dark:text-white shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <span className="max-sm:hidden">Private</span> Charter
              </button>
            </div>

            {/* Utility Actions (Promo Code + Terminal Directory) */}
            <div className="flex items-center gap-2">
              <Popover open={isPromoOpen} onOpenChange={setIsPromoOpen}>
                <PopoverTrigger
                  className="px-3 py-1 rounded-full bg-muted/40 hover:bg-muted/70 border border-border text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all duration-200 cursor-pointer min-h-9 hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <Icon icon={Tag} size="sm" />
                  <span className='max-sm:hidden'>{appliedPromo ? `Promo: ${appliedPromo}` : 'Add Promo Code'}</span>
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
                      className="uppercase glass-card-spatial"
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
                className="px-3 py-1 rounded-full bg-muted/40 hover:bg-muted/70 border border-border text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all duration-200 cursor-pointer min-h-9 hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none"
              >
                <Icon icon={SlidersHorizontal} size="sm" />
                <span className='max-sm:hidden'>Terminals</span>
              </button>
            </div>
          </div>

          {/* Search Inputs Row with Container Queries */}
          <div className="flex max-w-5xl w-full max-sm:grid max-sm:overflow-x-auto @sm/search:grid-cols-2 @lg/search:grid-cols-12 gap-2 grid-flow-col-dense pt-4 items-end">
            {/* 1. FROM City */}
            <div className="@lg/search:col-span-2 min-w-fit space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                From
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="w-full bg-background/30 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-primary/40 transition-colors cursor-pointer min-h-14 flex items-center justify-between text-left"
                  aria-label="Select departure hub"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon icon={MapPin} className="shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-xs font-normal text-foreground truncate block">
                        {fromCity} ({CITY_DETAILS[fromCity]?.code})
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {CITY_DETAILS[fromCity]?.terminal}
                      </span>
                    </div>
                  </div>
                  <Icon icon={ChevronDown} size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>Select Departure Hub</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SERVED_CITIES.map((city) => (
                    <DropdownMenuItem
                      key={city}
                      onClick={() => handleFromSelect(city)}
                      className={cn(
                        'flex items-center justify-between cursor-pointer',
                        fromCity === city && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      <div>
                        <div>{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Swap Button (Cleanly integrated between FROM and TO) */}
            <div className="@lg/search:flex @lg/search:col-span-1 justify-center pb-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className="size-6 rounded-full transition-all active:rotate-180 active:scale-95 duration-150 motion-reduce:transform-none"
              >
                <Icon icon={ArrowRightLeft} size="sm" />
              </Button>
            </div>

            {/* 2. TO City */}
            <div className="@lg/search:col-span-3 space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                To
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="w-full bg-background/30 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-primary/40 transition-colors cursor-pointer min-h-14 flex items-center justify-between text-left"
                  aria-label="Select destination hub"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon icon={MapPin} className="shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-xs font-normal text-foreground truncate block">
                        {toCity} ({CITY_DETAILS[toCity]?.code})
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {CITY_DETAILS[toCity]?.terminal}
                      </span>
                    </div>
                  </div>
                  <Icon icon={ChevronDown} size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>Select Destination Hub</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableDestinations.map((city) => (
                    <DropdownMenuItem
                      key={city}
                      onClick={() => handleToSelect(city)}
                      className={cn(
                        'flex items-center justify-between cursor-pointer',
                        toCity === city && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      <div>
                        <div>{city}</div>
                        <div className="text-[10px] opacity-75">{CITY_DETAILS[city]?.terminal}</div>
                      </div>
                      <span className="font-mono text-[10px]">{CITY_DETAILS[city]?.code}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 3. DATE */}
            <div className="@lg/search:col-span-3 space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                Date
              </label>
              <DateField
                value={date}
                onChange={(e) => setDate(e.target.value)}
                startIcon={Calendar}
                className="min-h-14 bg-background/30 dark:bg-black/30 rounded-2xl text-xs cursor-pointer"
              />
            </div>

            {/* 4. PASSENGERS & CLASS */}
            <div className="@lg/search:col-span-2 space-y-1 relative">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block px-1">
                Passengers
              </label>
              <Popover>
                <PopoverTrigger
                  className="w-full bg-background/30 dark:bg-black/30 rounded-2xl p-3 border border-border hover:border-primary/40 transition-colors cursor-pointer min-h-14 flex items-center justify-between text-left"
                  aria-label="Select passengers"
                >
                  <div className="flex text-xs truncate items-center gap-2 overflow-hidden">
                    <Icon icon={Users} className="shrink-0" />
                    <span className="font-normal text-foreground">
                      {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
                    </span>
                  </div>
                  <Icon icon={ChevronDown} size="sm" />
                </PopoverTrigger>
                <PopoverPopup className="w-56 p-4 space-y-3">
                  <div className="text-xs font-semibold text-foreground">5 Seat Sienna Cabin</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Seats</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 text-foreground font-normal flex items-center justify-center cursor-pointer transition-transform active:scale-90 motion-reduce:transform-none"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold text-foreground">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.min(5, passengers + 1))}
                        disabled={passengers >= 5}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 text-foreground font-normal flex items-center justify-center cursor-pointer transition-transform active:scale-90 motion-reduce:transform-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Strictly 5 passenger seats per vehicle.
                  </div>
                </PopoverPopup>
              </Popover>
            </div>
            {/* Search Button */}
            <div className="h-full @lg/search:col-span-1">
              <Button
                variant="default"
                size="default"
                onClick={handleSearch}
                className="w-full max-sm:hidden px-3 font-normal text-xs min-h-14 h-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 motion-reduce:transform-none"
                leftIcon={<Search className="size-4" />}
              >Search Trip
              </Button>
            </div>
          </div>
          <div className="pt-4">
            <Button
              variant="default"
              size="default"
              onClick={handleSearch}
              leftIcon={<Search className="w-4 h-4" />}
              className="sm:hidden w-full px-8 font-normal text-sm min-h-12 h-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 motion-reduce:transform-none"
            >Search Trip
            </Button>
          </div>
        </div>


        {/* 4. Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-10 pt-2 pb-2 md:pt-2 md:pb-0 text-[11px] sm:text-xs text-card-foreground/70">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} icon={Star} size="xs" className="fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="font-medium">4.9/5</span>
            <span>on Trustpilot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Icon icon={ShieldCheck} size="sm" variant="success" />
            <span>100% Secure Checkout</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Icon icon={Globe} size="sm" variant="primary" />
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center transition-all duration-200 cursor-pointer motion-reduce:transform-none"
      >
        <Icon icon={MessageCircle} size="default" className="text-primary-foreground" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-normal flex items-center justify-center">
          1
        </span>
      </a>
    </div>
  );
}
