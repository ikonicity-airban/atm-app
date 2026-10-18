'use client';

import React from 'react';
import { Users, Package, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

interface Pillar {
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  href: string;
  stats: string;
}

const PILLARS: Pillar[] = [
  {
    title: '5 Passenger Cabin',
    tagline: 'Zero Overcrowding',
    description:
      'Standard commercial buses pack eighteen passengers together. Ascent operates exclusively with five passenger Toyota Siennas featuring dual zone climate control and generous legroom.',
    icon: Users,
    accentColor: 'from-[#ca2484] to-[#e0459b]',
    href: '/trips',
    stats: '5 Seats Only',
  },
  {
    title: 'Express Waybill Courier',
    tagline: 'Same Day Intercity Freight',
    description:
      'Send documents, merchandise, and critical parcels across Nigerian states. Waybills are registered at departure hubs and transported on the very next scheduled vehicle.',
    icon: Package,
    accentColor: 'from-[#8b2ccb] to-[#ca2484]',
    href: '/courier',
    stats: '6 Hub Network',
  },
  {
    title: 'Private Fleet Charter',
    tagline: 'Dedicated Sienna Hire',
    description:
      'Reserve a whole 5 passenger Toyota Sienna for your team, family, or executive travel. Set your departure window and enjoy seamless door to door terminal transit.',
    icon: Calendar,
    accentColor: 'from-[#4a0e68] to-[#8b2ccb]',
    href: '/charter',
    stats: 'Custom Timing',
  },
  {
    title: 'GPS Telematics & Safety',
    tagline: 'Live Fleet Oversight',
    description:
      'Every vehicle is equipped with calibrated speed governors, satellite GPS tracking, and verified professional drivers monitored around the clock by central dispatch.',
    icon: ShieldCheck,
    accentColor: 'from-emerald-600 to-teal-700',
    href: '/about',
    stats: '24/7 Monitored',
  },
];

export function ServicePillars({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#ca2484] bg-accent px-3.5 py-1 rounded-full inline-block">
          Executive Mobility Standards
        </span>
        <h2 className="text-2xl sm:text-4xl font-black font-heading text-foreground tracking-tight text-balance">
          Experience Seamless Intercity Transit
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
          Engineered for Nigerian professionals and commuters who demand punctuality, safety, and personal space on interstate corridors.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-card text-card-foreground border border-border shadow-xs hover:shadow-xl hover:border-[#ca2484]/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.accentColor} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {pillar.stats}
                  </span>
                </div>

                <div className="text-xs font-bold text-[#ca2484] mb-1">
                  {pillar.tagline}
                </div>
                <h3 className="text-lg font-bold font-heading text-foreground mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate(pillar.href) : (window.location.href = pillar.href)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground group-hover:text-[#ca2484] transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Explore service</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
