'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Sparkles } from 'lucide-react';
import { SegmentedSearchForm } from '../booking/SegmentedSearchForm.tsx';
import { SearchForm } from '../booking/SearchForm.tsx';
import { VehicleHighwayAnchor } from '../atm/VehicleHighwayAnchor.tsx';
import { cn } from '../../lib/utils.ts';

interface CityPreviewData {
  name: string;
  subtitle: string;
  terminal: string;
  image: string;
  highlight: string;
  dailyTrips: string;
}

const CITY_PREVIEWS: Record<string, CityPreviewData> = {
  Enugu: {
    name: 'Enugu',
    subtitle: 'Coal City State',
    terminal: 'Ogui Road Terminal',
    image: '/images/hero/city-enugu.jpg',
    highlight: 'Milliken Hill Scenic Route',
    dailyTrips: '18 Daily Departures',
  },
  Abuja: {
    name: 'Abuja',
    subtitle: 'Federal Capital Territory',
    terminal: 'Utako District Terminal',
    image: '/images/hero/city-abuja.jpg',
    highlight: 'City Gate & Zuma Express',
    dailyTrips: '24 Daily Departures',
  },
  Lagos: {
    name: 'Lagos',
    subtitle: 'Commercial Hub',
    terminal: 'Jibowu & Ajah Hubs',
    image: '/images/hero/city-lagos.jpg',
    highlight: 'Lekki Bridge Corridor',
    dailyTrips: '32 Daily Departures',
  },
  Owerri: {
    name: 'Owerri',
    subtitle: 'Heartland State',
    terminal: 'Control Post Terminal',
    image: '/images/hero/city-owerri.jpg',
    highlight: 'Freedom Square Direct Link',
    dailyTrips: '14 Daily Departures',
  },
};

export function HeroShowcase({
  onNavigate,
}: {
  onNavigate?: (path: string) => void;
}) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tripMode, setTripMode] = useState<'one-way' | 'round-trip' | 'charter'>('one-way');
  const [selectedSearchCity, setSelectedSearchCity] = useState<{
    city: string;
    role?: 'from' | 'to';
    timestamp: number;
  } | null>(null);

  const handleTripModeChange = (mode: 'one-way' | 'round-trip' | 'charter') => {
    setTripMode(mode);
    if (mode === 'charter') {
      if (onNavigate) {
        onNavigate('/charter');
      } else {
        window.location.href = '/charter';
      }
    }
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6 pt-20 sm:pt-[10vh]">
      <section className="relative rounded-3xl lg:rounded-[2.5rem] overflow-hidden text-white pt-8 sm:pt-12 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-10 bg-slate-950">
        {/* Background Image & Cinematic Gradients */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/images/hero/highway-sunset.jpg"
            alt="Ascent Transport Interstate Highway Corridor at Dusk"
            className="w-full h-full object-cover object-center opacity-40 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120324] via-[#1f063d]/70 to-[#180530]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120324]/85 via-transparent to-[#120324]/85" />
        </div>

        <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 relative z-10">
          {/* Top Row: Social Proof Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold shadow-md border border-white/15">
              <span className="flex items-center text-emerald-400">
                <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              </span>
              <span className="font-bold tracking-wide">Trustpilot</span>
              <span className="text-purple-200 font-normal">
                TrustScore 4.9 | 5,000+ Completed Sienna Trips
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-purple-200/80 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-none" />
              <span>Active Departures Across 6 Hubs</span>
            </div>
          </div>

          {/* Two-Column Typographic Header Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10 items-center relative z-40">
            {/* Left: Headline directly on background */}
            <div className="lg:col-span-7 space-y-2">
              <h1 className="font-heading space-y-3 leading-[1.08]">
                <span className="block text-4xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white">
                  Your Journey Begins in One Click
                </span>
                <span className="block text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-300 via-[#ca2484] to-purple-300 bg-clip-text text-transparent">
                  Executive 5-Passenger Toyota Sienna Fleet
                </span>
              </h1>
            </div>

            {/* Right: Explanatory value proposition copy with interactive city tags */}
            <div className="lg:col-span-5 relative z-40">
              <p className="font-sans text-xs sm:text-sm lg:text-base text-purple-100/90 leading-relaxed font-normal">
                Direct departures between{' '}
                {(['Enugu', 'Abuja', 'Lagos', 'Owerri'] as const).map((city, idx) => (
                  <React.Fragment key={city}>
                    <span
                      className={cn(
                        'relative inline-block cursor-pointer font-bold text-pink-300 hover:text-white underline decoration-dashed transition-colors',
                        hoveredCity === city ? 'z-50' : 'z-10'
                      )}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                      onClick={() => {
                        setSelectedSearchCity({ city, role: 'from', timestamp: Date.now() });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSearchCity({ city, role: 'from', timestamp: Date.now() });
                        }
                      }}
                      aria-label={`Select ${city} as departure city`}
                    >
                      {city}
                      {/* Destination Tooltip Card */}
                      <AnimatePresence>
                        {hoveredCity === city && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-2.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/80 ring-1 ring-purple-900/10 z-50 pointer-events-auto text-left text-slate-900 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 shadow-xs">
                              <img
                                src={CITY_PREVIEWS[city]?.image}
                                alt={city}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-white">
                                <span className="font-heading font-black text-xs text-white">
                                  {CITY_PREVIEWS[city]?.name}
                                </span>
                                <span className="text-[9px] font-semibold bg-[#ca2484] px-1.5 py-0.5 rounded-full text-white">
                                  {CITY_PREVIEWS[city]?.dailyTrips}
                                </span>
                              </div>
                            </div>
                            <div className="px-1 space-y-1">
                              <div className="flex items-center gap-1 text-[10px] text-slate-700 font-semibold">
                                <MapPin className="w-3 h-3 text-[#ca2484] flex-shrink-0" />
                                <span className="truncate">{CITY_PREVIEWS[city]?.terminal}</span>
                              </div>
                              <div className="text-[9px] text-purple-700 font-medium">
                                {CITY_PREVIEWS[city]?.highlight}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSearchCity({ city, role: 'from', timestamp: Date.now() });
                                  setHoveredCity(null);
                                }}
                                className="w-full mt-1.5 py-1 px-2 rounded-lg bg-gradient-to-r from-[#2a0e5b] to-[#ca2484] text-white text-[10px] font-bold text-center hover:opacity-95 transition-opacity cursor-pointer shadow-xs min-h-[36px]"
                              >
                                Select Departure City
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </span>
                    {idx < 2 ? ', ' : idx === 2 ? ', and ' : ' '}
                  </React.Fragment>
                ))}
                in air-conditioned comfort with generous legroom. Vehicles depart on schedule without roadside delays.
              </p>
            </div>
          </div>

          {/* Trip Mode Tabs */}
          <div className="flex items-center gap-2 pt-2">
            {[
              { id: 'one-way', label: 'One Way' },
              { id: 'round-trip', label: 'Round Trip' },
              { id: 'charter', label: 'Private Charter' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTripModeChange(tab.id as typeof tripMode)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  tripMode === tab.id
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Floating Search Island (Desktop: SegmentedSearchForm, Mobile: SearchForm) */}
          <div className="pt-1 hidden md:block">
            <SegmentedSearchForm onNavigate={onNavigate} selectedCity={selectedSearchCity} />
          </div>
          <div className="pt-1 md:hidden">
            <SearchForm onNavigate={onNavigate} />
          </div>

          {/* Bottom Trust Strip: Left Avatars, Center Anchor, Right Stat Card */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 pt-2 relative z-10">
            {/* Left: Avatar Proof Badge */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hidden sm:flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-white/15"
            >
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-purple-900 bg-[#2a0e5b] text-[10px] font-bold text-white flex items-center justify-center">
                  ATM
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-purple-900 bg-[#ca2484] text-[10px] font-bold text-white flex items-center justify-center">
                  5P
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-purple-900 bg-purple-600 text-[10px] font-bold text-white flex items-center justify-center">
                  NG
                </div>
              </div>
              <div className="text-[11px] font-bold text-white">
                <span>5,000+</span> <span className="text-purple-200 font-normal">Executive Commuters</span>
              </div>
            </motion.div>

            {/* Center Vehicle Highway Anchor */}
            <div className="flex-1 w-full max-w-2xl mx-auto">
              <VehicleHighwayAnchor />
            </div>

            {/* Right: Inset Floating Stat Card */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -2 }}
              className="hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 pr-4 rounded-2xl shadow-xl border border-white/80 ring-1 ring-slate-900/5 max-w-xs text-slate-900 cursor-default"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 shadow-2xs">
                <img
                  src="/images/hero/sienna-thumb.jpg"
                  alt="Ascent 5-Passenger Toyota Sienna Fleet"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 font-heading">15,000+</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] font-bold text-[#ca2484]">Safe Intercity Trips</div>
                <div className="text-[10px] text-slate-500 font-medium">99.4% On-time schedule</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Chamfered Notch Silhouette */}
        <div className="absolute -bottom-[1px] left-0 right-0 h-6 sm:h-10 overflow-hidden pointer-events-none z-20">
          <svg
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className="w-full h-full fill-white dark:fill-slate-950"
            role="presentation"
          >
            <path d="M0,0 L320,0 C360,0 380,30 430,30 L770,30 C820,30 840,0 880,0 L1200,0 L1200,40 L0,40 Z" />
          </svg>
        </div>
      </section>
    </div>
  );
}
