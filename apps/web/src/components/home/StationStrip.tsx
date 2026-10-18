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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-[#ca2484] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Departure Hubs Across Nigeria
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Climate controlled waiting lounges with dedicated luggage check-in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STATIONS.map((station) => (
            <button
              key={`${station.city}-${station.hub}`}
              type="button"
              onClick={() => onSelectStation?.(station.city)}
              className="group text-left p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-pink-50/60 dark:hover:bg-pink-950/20 border border-slate-200/60 dark:border-slate-700/60 hover:border-[#ca2484]/40 transition-all duration-200 cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {station.code}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ca2484] transition-colors" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#ca2484] transition-colors">
                  {station.city}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {station.hub}
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
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
