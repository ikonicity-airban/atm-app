'use client';

import React, { useState, useEffect } from 'react';
import { SearchForm } from '../../components/booking/SearchForm.tsx';
import {
  RouteCard,
  VehicleCard,
  SectionBanner,
  TerminalCard,
  WhatsAppButton,
  CallButton,
} from '../../components/atm/AtmBlocks.tsx';
import { Accordion, type AccordionItem } from '../../components/ui/Accordion.tsx';
import { routeRepository, STATIC_ROUTES, type RouteDetail } from '../../server/repositories/routes.ts';
import { terminalRepository, STATIC_TERMINALS, type Terminal } from '../../server/repositories/terminals.ts';
import { BRAND, VEHICLE_DESCRIPTION } from '@atm/shared';
import { getOrganizationJsonLd } from '../../lib/seo.ts';
import {
  Bus,
  Package,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Phone,
} from 'lucide-react';

export interface HomePageProps {
  onNavigate?: (path: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps = {}) {
  const [routes, setRoutes] = useState<RouteDetail[]>(STATIC_ROUTES);
  const [terminals, setTerminals] = useState<Terminal[]>(STATIC_TERMINALS);

  useEffect(() => {
    routeRepository.getAll().then(setRoutes);
    terminalRepository.getAll().then(setTerminals);
  }, []);

  const faqTeasers: AccordionItem[] = [
    {
      id: 'faq-1',
      title: 'How many seats are inside each vehicle?',
      content:
        `Every vehicle is configured strictly for 5 passenger seats: ${VEHICLE_DESCRIPTION}`,
    },
    {
      id: 'faq-2',
      title: 'How long is a seat held during booking?',
      content:
        'When you select a seat, it is reserved for 10 minutes while you complete payment. If payment is not completed within 10 minutes, the seat returns to availability.',
    },
    {
      id: 'faq-3',
      title: 'What payment methods can I use?',
      content:
        'Through Paystack, we accept Nigerian debit/credit cards, bank transfers, USSD, and mobile money. Counter payment is also available at our terminals.',
    },
    {
      id: 'faq-4',
      title: 'How does the parcel courier service work?',
      content:
        'Bring your parcel to any of our six terminals. Parcels are weighed, registered, and dispatched on scheduled departures with tracking codes.',
    },
  ];

  const orgJsonLd = getOrganizationJsonLd();
  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: 'https://atmnigeria.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://atmnigeria.com/trips?from={from}&to={to}&date={date}&passengers={passengers}',
      'query-input': 'required name=from',
    },
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, webSiteJsonLd]) }}
      />

      {/* 1. HERO SECTION: Large plain heading, supporting line, SearchForm directly in hero (Hard ban: NO pills/cards on title) */}
      <section className="bg-slate-50 border-b border-slate-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Intercity transport in 5-passenger Toyota Siennas. <br className="hidden sm:inline" />
              Scheduled departures. No roadside delays.
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Travel between Enugu, Abuja, Lagos, and Owerri in air-conditioned comfort with extra legroom. Departures that leave on schedule.
            </p>
          </div>

          {/* SearchForm embedded directly in hero */}
          <SearchForm onNavigate={onNavigate} />
        </div>
      </section>

      {/* 2. OUR ROUTES SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Our Scheduled Corridors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fixed daily departures linking South-East terminals and Abuja.
            </p>
          </div>
          <a
            href="/routes"
            className="text-xs font-bold text-[#ca2484] hover:text-[#aa1769] flex items-center gap-1 min-h-[36px]"
          >
            <span>View all corridors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.slice(0, 6).map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onSelect={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/routes/${route.slug}`;
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* 3. HOW BOOKING WORKS SECTION (3 plain steps) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            How Booking Works
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Three straightforward steps to secure your seat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#ca2484] text-white font-black text-sm flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-slate-900 text-base">Search Your Route</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your origin, destination city, and date. View real-time departure times and available seats.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#ca2484] text-white font-black text-sm flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-slate-900 text-base">Choose Your Seat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select your exact window or middle position on the 5-seat map. Your seat is held for 10 minutes.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <span className="w-8 h-8 rounded-full bg-[#ca2484] text-white font-black text-sm flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-slate-900 text-base">Pay &amp; Get Ticket</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete payment with debit card, transfer, or USSD via Paystack. Receive instant confirmation and QR ticket.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE VEHICLE SPOTLIGHT */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 bg-white border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <VehicleCard />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              5 Passenger Seats Only
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Standard commercial buses cram 14 to 18 travellers together. We seat only five passengers in each Toyota Sienna, ensuring personal space and air-conditioned travel on every trip.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Toyota Sienna, 5 seats, A/C, extra legroom, refreshments.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Direct terminal-to-terminal travel without roadside stops</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Luggage storage dedicated to the 5 travelling passengers</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. COURIER & PARCEL FREIGHT */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-xl shadow-md grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">
              Express Courier Logistics
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Send Packages Between Terminals
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Drop off your documents and parcels at any terminal for transit on the next departure. Real-time tracking from receipt to receiver pickup.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="/courier"
                className="px-4 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded min-h-[44px] flex items-center"
              >
                Send a Parcel
              </a>
              <a
                href="/track"
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 rounded min-h-[44px] flex items-center"
              >
                Track Delivery
              </a>
            </div>
          </div>

          {/* Quick Tracking Code Form */}
          <div className="md:col-span-5 bg-slate-800/80 p-5 rounded-lg border border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Track Your Parcel
            </h3>
            <form action="/track" method="GET" className="space-y-2">
              <input
                type="text"
                name="code"
                placeholder="Enter ATM-EXP-XXXXXX"
                className="w-full px-3 py-2 text-xs rounded bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
              />
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 6. TERMINALS DIRECTORY SUMMARY */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Our Physical Terminals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official station addresses with direct phone lines.
            </p>
          </div>
          <a
            href="/terminals"
            className="text-xs font-bold text-[#ca2484] hover:text-[#aa1769] flex items-center gap-1 min-h-[36px]"
          >
            <span>All terminals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terminals.slice(0, 3).map((term) => (
            <TerminalCard key={term.id} terminal={term} />
          ))}
        </div>
      </section>

      {/* 7. FAQ TEASER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Common Questions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct information on schedules, seat holds, and terminal arrivals.
            </p>
          </div>
          <a
            href="/faq"
            className="text-xs font-bold text-[#ca2484] hover:text-[#aa1769] flex items-center gap-1 min-h-[36px]"
          >
            <span>View all FAQs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <Accordion items={faqTeasers} defaultOpenId="faq-1" />
        </div>
      </section>

      {/* 8. CLOSING CTA BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#ca2484] text-white p-8 sm:p-12 rounded-xl shadow-md text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Travel Safe and Fast?
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 max-w-xl mx-auto leading-relaxed">
            Choose your route, pick your seat in the 5-passenger Toyota Sienna, and complete your reservation in under two minutes.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="/trips"
              className="px-6 py-3 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded shadow-xs min-h-[44px] flex items-center"
            >
              Book a Seat Now
            </a>
            <WhatsAppButton phone={BRAND.contactPhones[0]} />
            <CallButton phone={BRAND.contactPhones[0]} label="Call Central Dispatch" />
          </div>
        </div>
      </section>
    </div>
  );
}
