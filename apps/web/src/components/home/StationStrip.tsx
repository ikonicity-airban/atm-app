'use client';

import React from 'react';
import { MapPin, ShieldCheck, Clock, Users, ArrowUpRight } from 'lucide-react';

interface Station {
  city: string;
  hub: string;
  code: string;
  status: string;
}

const STATIONS: Station[] = [
  { city: 'Enugu', hub: 'Ogui Road Terminal', code: 'ENU', status: '18 Daily Departures' },
  { city: 'Abuja', hub: 'Utako District Terminal', code: 'ABV', status: '24 Daily Departures' },
  { city: 'Lagos', hub: 'Jibowu Central Hub', code: 'LOS', status: '20 Daily Departures' },
  { city: 'Lagos', hub: 'Ajah Expressway Hub', code: 'LOS', status: '12 Daily Departures' },
  { city: 'Owerri', hub: 'Control Post Terminal', code: 'QOW', status: '14 Daily Departures' },
];

export function StationStrip({ onSelectStation }: { onSelectStation?: (city: string) => void }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="bg-card text-card-foreground rounded-3xl p-5 sm:p-8 border border-border shadow-xs backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent text-[#ca2484] flex items-center justify-center font-bold shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-foreground">
                Official Departure Hubs Across Nigeria
              </h2>
              <p className="text-xs text-muted-foreground">
                Climate controlled waiting lounges with dedicated luggage check-in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Prompt Departures</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-[#ca2484]" />
              <span>5 Seats Only</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Verified Drivers</span>
            </span>
          </div>
        </div>

        {/* Station Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {STATIONS.map((station) => (
            <button
              key={`${station.city}-${station.hub}`}
              type="button"
              onClick={() => onSelectStation?.(station.city)}
              className="group text-left p-3.5 rounded-2xl bg-muted/40 hover:bg-accent/40 border border-border hover:border-[#ca2484]/40 transition-all duration-200 cursor-pointer min-h-[50px] shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                  {station.code}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#ca2484] transition-colors" />
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-heading font-bold text-foreground group-hover:text-[#ca2484] transition-colors">
                  {station.city}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {station.hub}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {station.status}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
