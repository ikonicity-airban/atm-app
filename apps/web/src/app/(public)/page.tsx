'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { SearchForm } from '../../components/booking/SearchForm.tsx';
import { SegmentedSearchForm } from '../../components/booking/SegmentedSearchForm.tsx';
import { VehicleHighwayAnchor } from '../../components/atm/VehicleHighwayAnchor.tsx';
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
import { cn } from '../../lib/utils.ts';
import {
  Bus,
  Package,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Phone,
  Star,
  MapPin,
} from 'lucide-react';

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

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface HomePageProps {
  onNavigate?: (path: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps = {}) {
  const [routes, setRoutes] = useState<RouteDetail[]>(STATIC_ROUTES);
  const [terminals, setTerminals] = useState<Terminal[]>(STATIC_TERMINALS);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [selectedSearchCity, setSelectedSearchCity] = useState<{
    city: string;
    role?: 'from' | 'to';
    timestamp: number;
  } | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Perspective 3D scroll reaction hooks
  const { scrollY } = useScroll();
  const scrollPerspective = useTransform(scrollY, [0, 600], [0, 5]);
  const scrollScale = useTransform(scrollY, [0, 600], [1, 1.05]);
  const scrollYOffset = useTransform(scrollY, [0, 600], [0, 35]);

  useEffect(() => {
    routeRepository.getAll().then(setRoutes);
    terminalRepository.getAll().then(setTerminals);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !pageRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Scroll-to-fade effect on the hero top section as user scrolls down
      if (heroRef.current) {
        gsap.to('.hero-fade-layer', {
          opacity: 0.25,
          y: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom 20%',
            scrub: 1,
          },
        });

        // 2. Parallax effect across the vehicle anchor
        gsap.to('.parallax-vehicle', {
          y: 25,
          scale: 1.02,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }

      // 3. Scroll-to-fade entrance animation across content sections
      gsap.utils.toArray<HTMLElement>('.scroll-fade-in').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 35,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
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
    <div ref={pageRef} className="space-y-16 sm:space-y-24 pb-16">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, webSiteJsonLd]) }}
      />

      {/* 1. HERO SECTION: Framed Showcase Container with 3D Perspective Scroll & Chamfered Bottom */}
      <div className="px-2 sm:px-4 lg:px-6 pt-20 sm:pt-16">
        <section
          ref={heroRef}
          className="relative rounded-3xl lg:rounded-[2.5rem] overflow-hidden text-white pt-8 sm:pt-12 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-10"
        >
          {/* 3D Perspective Highway Background on Scroll */}
          <motion.div
            style={{
              rotateX: scrollPerspective,
              scale: scrollScale,
              y: scrollYOffset,
              transformPerspective: 1200,
              transformOrigin: 'top center',
            }}
            className="absolute inset-0 pointer-events-none z-0"
          >
            <img
              src="/images/hero/highway-sunset.jpg"
              alt="Ascent Transport Interstate Highway Corridor at Dusk"
              className="w-full h-full object-cover object-center opacity-45 brightness-95"
            />
            {/* Cinematic Gradient Overlays matching Reference */}
            <div className="absolute inset-0 bg-linear-to-t from-[#120324] via-[#1f063d]/70 to-[#180530]/60" />
            <div className="absolute inset-0 bg-linear-to-r from-[#120324]/85 via-transparent to-[#120324]/85" />
          </motion.div>

          <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 relative z-10">
            {/* Top row: Social Proof Badge matching reference dark pill */}
            <div className="hero-fade-layer flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold shadow-md border border-white/15">
                <span className="flex items-center text-emerald-400">
                  <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                </span>
                <span className="font-bold tracking-wide">Trustpilot</span>
                <span className="text-purple-200 font-normal">TrustScore 4.9 | 5,000+ Completed Sienna Trips</span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-purple-200/80 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-none" />
                <span>Active Departures Across 6 Hubs</span>
              </div>
            </div>

            {/* Two-Column Typographic Header Row with Large Text Gradients */}
            <div className="hero-fade-layer grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10 items-center relative z-40">
              {/* Left: Heavy H1 Title directly on background */}
              <div className="lg:col-span-7 space-y-2">
                <h1 className="font-heading space-y-4 leading-[1.08]">
                  <span className="block text-5xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-black text-white md:whitespace-nowrap">
                    Intercity Transport
                  </span>
                  <span className="block text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-pink-300 via-[#8b2ccb] to-purple-300 bg-clip-text text-transparent mt-1">
                    in 5-passenger Toyota Siennas.
                  </span>
                </h1>
              </div>

              {/* Right: Explanatory value proposition copy with Interactive Destination Tooltips */}
              <div className="lg:col-span-5 relative z-40">
                <p className="font-sans text-xs sm:text-sm lg:text-base text-purple-100/90 leading-relaxed font-normal">
                  Travel between{' '}
                  {(['Enugu', 'Abuja', 'Lagos', 'Owerri'] as const).map((city, idx) => (
                    <React.Fragment key={city}>
                      <span
                        className={cn(
                          "relative inline-block cursor-pointer font-bold text-pink-300 hover:text-white underline decoration-dashed transition-colors",
                          hoveredCity === city ? "z-50" : "z-10"
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
                        {/* Interactive Destination Preview Card with AnimatePresence */}
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
                                  className="w-full mt-1.5 py-1 px-2 rounded-lg bg-gradient-to-r from-[#2a0e5b] to-[#ca2484] text-white text-[10px] font-bold text-center hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
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
                  in air-conditioned comfort with extra legroom. Departures that leave on schedule without roadside delays.
                </p>
              </div>
            </div>

            {/* Floating Segmented Search Island */}
            <div className="pt-1 hidden md:flex">
              <SegmentedSearchForm onNavigate={onNavigate} selectedCity={selectedSearchCity} />
            </div>

            {/* Bottom Row: Inset Avatar Proof (Left), Vehicle Highway Anchor (Center), Floating Stat Card (Right) */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 pt-2 relative z-10">
              {/* Left: Avatar Proof Badge matching reference bottom-left */}
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

              {/* Right: Inset Floating Stat Card matching reference bottom-right */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -2 }}
                className="hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 pr-4 rounded-2xl shadow-xl border border-white/80 ring-1 ring-slate-900/5 max-w-xs text-slate-900 cursor-default"
              >
                <div className="relative w-13 h-13 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 shadow-2xs">
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

          {/* Bottom Chamfered Notch Silhouette matching reference design */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-6 sm:h-10 overflow-hidden pointer-events-none z-20">
            <svg
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
              className="w-full h-full fill-white"
              role="presentation"
            >
              <path d="M0,0 L320,0 C360,0 380,30 430,30 L770,30 C820,30 840,0 880,0 L1200,0 L1200,40 L0,40 Z" />
            </svg>
          </div>
        </section>
      </div>

      {/* 2. OUR ROUTES SECTION */}
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
              Our Scheduled Corridors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fixed daily departures linking South East terminals and Abuja.
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

      {/* 3. HOW BOOKING WORKS SECTION (3 plain steps with Card Gradients) */}
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight text-balance">
            How Booking Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Three straightforward steps to secure your seat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-white via-white to-purple-50/40 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-xl hover:border-[#ca2484]/40 hover:-translate-y-0.5 transition-all space-y-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#ca2484] to-[#9333ea] text-white font-black text-sm flex items-center justify-center shadow-md">
              1
            </span>
            <h3 className="font-bold font-heading text-slate-900 text-base text-balance">Search Your Route</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Choose your origin, destination city, and date. View real time departure times and available seats.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-white via-white to-purple-50/40 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-xl hover:border-[#ca2484]/40 hover:-translate-y-0.5 transition-all space-y-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#ca2484] to-[#9333ea] text-white font-black text-sm flex items-center justify-center shadow-md">
              2
            </span>
            <h3 className="font-bold font-heading text-slate-900 text-base text-balance">Choose Your Seat</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Select your exact window or middle position on the 5 seat map. Your seat is held for 15 minutes.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-white via-white to-purple-50/40 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-xl hover:border-[#ca2484]/40 hover:-translate-y-0.5 transition-all space-y-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#ca2484] to-[#9333ea] text-white font-black text-sm flex items-center justify-center shadow-md">
              3
            </span>
            <h3 className="font-bold font-heading text-slate-900 text-base text-balance">Pay &amp; Get Ticket</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Complete payment with debit card, transfer, or USSD via Paystack. Receive instant confirmation and QR ticket.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE VEHICLE SPOTLIGHT with Card Gradient */}
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 bg-gradient-to-br from-white via-slate-50/60 to-purple-50/30 border border-purple-100/90 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <VehicleCard />
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight text-balance">
              5 Passenger Seats Only
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-sans text-pretty">
              Standard commercial buses cram 14 to 18 travellers together. We seat only five passengers in each Toyota Sienna, ensuring personal space and air-conditioned travel on every trip.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-sans">
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
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 bg-gradient-to-br from-slate-950 via-[#1e0f3d] to-[#2f1166] text-white rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-purple-900/40">
          <div className="md:col-span-7 space-y-3">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block font-heading">
              Express Courier Logistics
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading text-balance">
              Send Packages Between Terminals
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans text-pretty">
              Drop off your documents and parcels at any terminal for transit on the next departure. Real-time tracking from receipt to receiver pickup.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="/courier"
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ca2484] to-[#aa1769] hover:from-[#aa1769] hover:to-[#8c1656] rounded-xl shadow-md min-h-[44px] flex items-center transition-all hover:scale-105"
              >
                Send a Parcel
              </a>
              <a
                href="/track"
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800/80 rounded-xl min-h-[44px] flex items-center transition-all"
              >
                Track Delivery
              </a>
            </div>
          </div>

          {/* Quick Tracking Code Form with Card Gradient */}
          <div className="md:col-span-5 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-purple-800/50 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading text-balance">
              Track Your Parcel
            </h3>
            <form action="/track" method="GET" className="space-y-2.5">
              <input
                type="text"
                name="code"
                placeholder="Enter ATM-EXP-XXXXXX"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
              />
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-xl min-h-[44px] flex items-center justify-center cursor-pointer shadow-md transition-all font-heading"
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 6. TERMINALS DIRECTORY SUMMARY */}
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight text-balance">
              Our Physical Terminals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight text-balance">
              Common Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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

        <div className="bg-gradient-to-br from-white via-white to-purple-50/20 border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <Accordion items={faqTeasers} defaultOpenId="faq-1" />
        </div>
      </section>

      {/* 8. CLOSING CTA BANNER with Gradient and Large Text */}
      <section className="scroll-fade-in scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#ca2484] via-[#9333ea] to-[#4c1d95] text-white p-8 sm:p-14 rounded-3xl shadow-2xl text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-balance">
            Ready to Travel Safe and Fast?
          </h2>
          <p className="text-xs sm:text-base text-pink-100 max-w-xl mx-auto leading-relaxed font-sans text-pretty">
            Choose your route, pick your seat in the 5 seat Toyota Sienna, and complete your reservation in under two minutes.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="/trips"
              className="px-6 py-3 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-md min-h-[44px] flex items-center transition-all hover:scale-105 font-heading"
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
