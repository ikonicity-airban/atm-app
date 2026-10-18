'use client';

import React, { useState } from 'react';
import { ArrowRight, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { formatNaira } from '@atm/shared';

interface BentoCorridor {
  id: string;
  from: string;
  fromHub: string;
  to: string;
  toHub: string;
  distanceKm: number;
  durationHours: string;
  baseFareKobo: number;
  dailyDepartures: number;
  image: string;
  isPopular?: boolean;
  filterCategory: 'enugu-abuja' | 'lagos-enugu' | 'lagos-owerri' | 'other';
}

const CORRIDORS: BentoCorridor[] = [
  {
    id: 'enugu-abuja',
    from: 'Enugu',
    fromHub: 'Ogui Road Terminal',
    to: 'Abuja',
    toHub: 'Utako District Terminal',
    distanceKm: 440,
    durationHours: '7.5 hrs',
    baseFareKobo: 3200000,
    dailyDepartures: 24,
    image: '/images/hero/city-abuja.jpg',
    isPopular: true,
    filterCategory: 'enugu-abuja',
  },
  {
    id: 'lagos-enugu',
    from: 'Lagos',
    fromHub: 'Jibowu Central Hub',
    to: 'Enugu',
    toHub: 'Ogui Road Terminal',
    distanceKm: 560,
    durationHours: '8.5 hrs',
    baseFareKobo: 3800000,
    dailyDepartures: 18,
    image: '/images/hero/city-enugu.jpg',
    filterCategory: 'lagos-enugu',
  },
  {
    id: 'abuja-enugu',
    from: 'Abuja',
    fromHub: 'Utako District Terminal',
    to: 'Enugu',
    toHub: 'Ogui Road Terminal',
    distanceKm: 440,
    durationHours: '7.5 hrs',
    baseFareKobo: 3200000,
    dailyDepartures: 20,
    image: '/images/hero/city-enugu.jpg',
    filterCategory: 'enugu-abuja',
  },
  {
    id: 'lagos-owerri',
    from: 'Lagos',
    fromHub: 'Ajah Expressway Hub',
    to: 'Owerri',
    toHub: 'Control Post Terminal',
    distanceKm: 530,
    durationHours: '8.0 hrs',
    baseFareKobo: 3600000,
    dailyDepartures: 14,
    image: '/images/hero/city-owerri.jpg',
    filterCategory: 'lagos-owerri',
  },
  {
    id: 'owerri-lagos',
    from: 'Owerri',
    fromHub: 'Control Post Terminal',
    to: 'Lagos',
    toHub: 'Jibowu Central Hub',
    distanceKm: 530,
    durationHours: '8.0 hrs',
    baseFareKobo: 3600000,
    dailyDepartures: 14,
    image: '/images/hero/city-lagos.jpg',
    filterCategory: 'lagos-owerri',
  },
  {
    id: 'enugu-lagos',
    from: 'Enugu',
    fromHub: 'Ogui Road Terminal',
    to: 'Lagos',
    toHub: 'Ajah Expressway Hub',
    distanceKm: 560,
    durationHours: '8.5 hrs',
    baseFareKobo: 3800000,
    dailyDepartures: 16,
    image: '/images/hero/city-lagos.jpg',
    filterCategory: 'lagos-enugu',
  },
  {
    id: 'owerri-abuja',
    from: 'Owerri',
    fromHub: 'Control Post Terminal',
    to: 'Abuja',
    toHub: 'Utako District Terminal',
    distanceKm: 510,
    durationHours: '8.5 hrs',
    baseFareKobo: 3400000,
    dailyDepartures: 12,
    image: '/images/hero/city-abuja.jpg',
    filterCategory: 'other',
  },
];

export function TrendingBentoGallery({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'enugu-abuja' | 'lagos-enugu' | 'lagos-owerri'>('all');

  const filteredCorridors = CORRIDORS.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.filterCategory === activeFilter;
  });

  const handleBook = (from: string, to: string) => {
    const url = `/trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const featured = filteredCorridors[0] || CORRIDORS[0];
  const rest = filteredCorridors.slice(1);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ca2484] bg-accent px-3.5 py-1 rounded-full inline-block">
            Trending Travel Corridors
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-heading text-foreground tracking-tight text-balance">
            Explore Popular Interstate Routes
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
            Fixed departure times and direct terminal connections with no road pickups.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted rounded-full border border-border">
          {[
            { id: 'all', label: 'All Corridors' },
            { id: 'enugu-abuja', label: 'Enugu ↔ Abuja' },
            { id: 'lagos-enugu', label: 'Lagos ↔ Enugu' },
            { id: 'lagos-owerri', label: 'Lagos ↔ Owerri' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[36px] ${
                activeFilter === tab.id
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Large Featured Card (Spans 2 rows on large) */}
        {featured && (
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-slate-950 text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-between p-6 sm:p-8 shadow-xl border border-slate-800 group">
            {/* Background Image with Gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={featured.image}
                alt={`${featured.from} to ${featured.to}`}
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
            </div>

            {/* Top Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ca2484] text-white text-xs font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Corridor</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                {featured.dailyDepartures} Daily Departures
              </span>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-300 text-xs font-bold uppercase tracking-wider">
                  <span>{featured.fromHub}</span>
                  <span>→</span>
                  <span>{featured.toHub}</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {featured.from} to {featured.to} Express
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span>{featured.durationHours} estimated</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span>{featured.distanceKm} km direct</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>5 Seat Sienna</span>
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/15">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    Starting fare per seat
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {formatNaira(featured.baseFareKobo)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBook(featured.from, featured.to)}
                  className="px-6 py-3 bg-[#ca2484] hover:bg-[#aa1769] text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <span>Book Seat Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regular / Compact Bento Cards */}
        {rest.map((corridor) => (
          <div
            key={corridor.id}
            className="relative rounded-3xl overflow-hidden bg-card text-card-foreground border border-border shadow-sm hover:shadow-xl hover:border-[#ca2484]/40 transition-all duration-300 flex flex-col justify-between p-5 group"
          >
            <div>
              <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4">
                <img
                  src={corridor.image}
                  alt={`${corridor.from} to ${corridor.to}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {corridor.dailyDepartures} Departures
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                  <span>{corridor.durationHours}</span>
                  <span>{corridor.distanceKm} km</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground font-medium truncate">
                  {corridor.fromHub} → {corridor.toHub}
                </div>
                <h4 className="text-lg font-heading font-bold text-foreground">
                  {corridor.from} to {corridor.to}
                </h4>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                  From
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {formatNaira(corridor.baseFareKobo)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleBook(corridor.from, corridor.to)}
                className="px-4 py-2 bg-accent hover:bg-[#ca2484] text-[#ca2484] hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <span>Select</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
