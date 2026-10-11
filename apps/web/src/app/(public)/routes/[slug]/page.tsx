'use client';

import React, { useState, useEffect } from 'react';
import { routeRepository, STATIC_ROUTES, type RouteDetail } from '../../../../server/repositories/routes.ts';
import {
  TerminalCard,
  VehicleCard,
  MoneyText,
  SectionBanner,
} from '../../../../components/atm/AtmBlocks.tsx';
import { Accordion } from '../../../../components/ui/Accordion.tsx';
import { PageShell } from '../../../../components/layout/Templates.tsx';
import { Clock, MapPin, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export function generateStaticParams() {
  return STATIC_ROUTES.map((r) => ({ slug: r.slug }));
}

export default function RouteDetailPage({
  params,
  onNavigate,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  onNavigate?: (path: string) => void;
}) {
  const [slug, setSlug] = useState<string>(() => {
    if (params && typeof (params as any).then !== 'function') {
      return (params as { slug: string }).slug;
    }
    return 'enugu-abuja';
  });

  const [route, setRoute] = useState<RouteDetail | null>(() => {
    const initialSlug = params && typeof (params as any).then !== 'function' ? (params as { slug: string }).slug : 'enugu-abuja';
    return STATIC_ROUTES.find((r) => r.slug === initialSlug) ?? null;
  });

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.slug) {
        setSlug(resolved.slug);
        routeRepository.getBySlug(resolved.slug).then((res) => {
          if (res) setRoute(res);
        });
      }
    });
  }, [params]);

  if (!route) {
    return (
      <PageShell
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Routes', href: '/routes' }, { label: 'Not Found' }]}
        title="Route Not Found"
        description="The requested intercity route could not be found or has been rescheduled."
      >
        <div className="py-12 text-center">
          <a
            href="/routes"
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded min-h-[44px]"
          >
            View All Scheduled Routes
          </a>
        </div>
      </PageShell>
    );
  }

  const faqItems = route.faqs.map((f, idx) => ({
    id: `faq-${idx}`,
    title: f.question,
    content: f.answer,
  }));

  return (
    <PageShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Routes', href: '/routes' },
        { label: route.title },
      ]}
      title={route.title}
      description={route.description}
      actions={
        <a
          href="/trips"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded shadow-xs min-h-[44px]"
        >
          <span>Book this Route</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      }
    >
      <div className="space-y-12">
        {/* Route Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Distance</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{route.distanceKm} km</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duration</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{route.durationHours} hours</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Passenger Fare</span>
            <div className="text-lg font-bold text-[#ca2484] mt-0.5">
              {route.baseFareKobo ? (
                <>from <MoneyText kobo={route.baseFareKobo} isPlaceholder={route.isPlaceholder} /></>
              ) : (
                <span className="text-xs text-slate-500">Contact Terminal</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Departures</span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">
              {route.dailyDepartures.join(', ')}
            </span>
          </div>
        </div>

        {/* Departure and Arrival Terminals */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Terminal Stops
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                Origin (Boarding Point)
              </span>
              <TerminalCard terminal={route.origin} />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                Destination (Arrival Point)
              </span>
              <TerminalCard terminal={route.destination} />
            </div>
          </div>
        </section>

        {/* Vehicle & Fleet Specifications */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Fleet &amp; Travel Comfort
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <VehicleCard className="lg:col-span-1" />
            <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-lg space-y-4">
              <h3 className="font-bold text-slate-900 text-base">
                Why Travel this Route with Ascent Transport?
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Only 5 Passenger Seats:</strong> Unlike crowded commercial buses, each passenger enjoys ample personal space, unhindered window views, and room to stretch.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Speed Regulated &amp; Tracked:</strong> All Sienna vehicles adhere to Federal Road Safety Corps (FRSC) commercial speed regulations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Air Conditioned Comfort:</strong> Continuous dual-zone air conditioning maintained throughout the trip.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Fixed departures daily. Advance seat reservation recommended.</span>
                <a
                  href="/trips"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded min-h-[44px] flex items-center"
                >
                  Select Seat &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Route FAQ Accordion */}
        {faqItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Route Questions &amp; Answers
            </h2>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <Accordion items={faqItems} defaultOpenId="faq-0" />
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
