import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  routeRepository,
  STATIC_ROUTES,
} from '../../../../server/repositories/routes.ts';
import {
  TerminalCard,
  VehicleCard,
  MoneyText,
} from '../../../../components/atm/AtmBlocks.tsx';
import { Accordion } from '../../../../components/ui/Accordion.tsx';
import { PageShell } from '../../../../components/layout/Templates.tsx';
import { SearchForm } from '../../../../components/booking/SearchForm.tsx';
import {
  getBusTripJsonLd,
  getBreadcrumbListJsonLd,
  getFAQPageJsonLd,
} from '../../../../lib/seo.ts';
import { BRAND } from '@atm/shared';
import {
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  Sparkles,
} from 'lucide-react';

interface RouteDetailPageProps {
  params: Promise<{ corridor: string }>;
}

export async function generateStaticParams() {
  const slugs = await routeRepository.getAllSlugs();
  return slugs.map((corridor) => ({ corridor }));
}

export async function generateMetadata({
  params,
}: RouteDetailPageProps): Promise<Metadata> {
  const { corridor } = await params;
  const route = await routeRepository.getBySlug(corridor);

  if (!route) {
    return {
      title: 'Route Not Found | Ascent Transport Management',
      description: 'The requested intercity corridor route is not currently scheduled.',
    };
  }

  const title = `${route.title} - Sienna Travel & Schedule | ${BRAND.shortName}`;
  const description = `${route.description} Daily departures from ₦${(
    (route.baseFareKobo ?? 0) / 100
  ).toLocaleString()}. 5-passenger Toyota Sienna fleet with air conditioning.`;
  const canonicalUrl = `https://atmnigeria.com/routes/${route.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { corridor } = await params;
  const route = await routeRepository.getBySlug(corridor);

  if (!route) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Routes', href: '/routes' },
    { label: route.title },
  ];

  const jsonLdBusTrip = getBusTripJsonLd({
    slug: route.slug,
    title: route.title,
    originCity: route.origin.city,
    destinationCity: route.destination.city,
    originName: route.origin.name,
    originAddress: route.origin.address,
    destinationName: route.destination.name,
    destinationAddress: route.destination.address,
    startingFareKobo: route.baseFareKobo ?? 3200000,
  });

  const jsonLdBreadcrumbs = getBreadcrumbListJsonLd([
    { name: 'Home', url: 'https://atmnigeria.com' },
    { name: 'Routes', url: 'https://atmnigeria.com/routes' },
    { name: route.title, url: `https://atmnigeria.com/routes/${route.slug}` },
  ]);

  const jsonLdFaq = getFAQPageJsonLd(route.faqs);

  const faqItems = route.faqs.map((f, idx) => ({
    id: `faq-${idx}`,
    title: f.question,
    content: f.answer,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusTrip) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />
      {route.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      )}

      <PageShell
        breadcrumbs={breadcrumbs}
        title={route.title}
        description={route.description}
      >
        <div className="space-y-12">
          {/* Booking Widget pre-filled with corridor cities */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800">
            <div className="max-w-3xl mb-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#ca2484] block mb-1">
                Instant Online Booking
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Reserve your 5-Seat Toyota Sienna from {route.origin.city} to {route.destination.city}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Direct seat selection with 15-minute reservation lock and instant digital ticket confirmation.
              </p>
            </div>

            <SearchForm
              initialFrom={route.origin.city}
              initialTo={route.destination.city}
              className="bg-white/95 backdrop-blur-md text-slate-900 border-0 shadow-lg"
            />
          </section>

          {/* Route Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Distance</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">{route.distanceKm} km</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Duration</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">{route.durationHours} hours</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Starting Fare</span>
              <div className="text-lg font-bold text-[#ca2484] mt-0.5">
                {route.baseFareKobo ? (
                  <>from <MoneyText kobo={route.baseFareKobo} isPlaceholder={route.isPlaceholder} /></>
                ) : (
                  <span className="text-xs text-slate-500">Contact Terminal</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Fleet Type</span>
              <span className="text-xs font-semibold text-slate-800 block mt-1">
                Toyota Sienna (5-Seats)
              </span>
            </div>
          </div>

          {/* Timetable & Departure Schedules */}
          {route.departureSchedules && route.departureSchedules.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Departure Timetable &amp; Service Tiers
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fixed daily departures. All vehicles depart promptly at the designated WAT time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {route.departureSchedules.map((schedule, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-pink-50 text-[#ca2484] flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          {schedule.time}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          {schedule.serviceTier}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                      Daily
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Regional Travel Advisory */}
          {route.travelAdvisory && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Corridor Travel Advisory
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  {route.travelAdvisory}
                </p>
              </div>
            </div>
          )}

          {/* Departure and Arrival Terminals */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Terminal Directions &amp; Boarding Locations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                  Origin (Boarding Terminal)
                </span>
                <TerminalCard terminal={route.origin} />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                  Destination (Arrival Terminal)
                </span>
                <TerminalCard terminal={route.destination} />
              </div>
            </div>
          </section>

          {/* Fleet Specifications & Inclusions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Fleet &amp; Travel Comfort Standards
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <VehicleCard className="lg:col-span-1" />
              <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                <h3 className="font-bold text-slate-900 text-base">
                  Why Travel this Route with Ascent Transport?
                </h3>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Guaranteed 5 Passenger Seats:</strong> Never crowded like 14-seater commercial buses. Every passenger has generous personal legroom, window ventilation, and individual seating.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Speed Regulated &amp; GPS Tracked:</strong> All Sienna minivans are tracked in real-time and operate strictly in daylight hours following Federal Road Safety Corps (FRSC) commercial speed limits.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Continuous Dual-Zone Air Conditioning:</strong> High-efficiency cabin cooling throughout the entire journey.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Luggage Space:</strong> Designated luggage storage in the rear boot. Extra or commercial freight can be dispatched through our courier express desk.
                    </span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Support: {BRAND.contactPhones[0]}</span>
                  </div>
                  <a
                    href={`/trips?from=${encodeURIComponent(route.origin.city)}&to=${encodeURIComponent(route.destination.city)}`}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg min-h-[44px] flex items-center gap-2"
                  >
                    <span>View Scheduled Trips</span>
                    &rarr;
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Pickup Points */}
          {route.popularPickupPoints && route.popularPickupPoints.length > 0 && (
            <section className="space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-sm font-bold text-slate-900">
                Popular Pickup &amp; Drop-off Waypoints on this Corridor
              </h3>
              <div className="flex flex-wrap gap-2">
                {route.popularPickupPoints.map((point, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    <MapPin className="w-3 h-3 text-[#ca2484]" />
                    {point}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Route FAQ Accordion */}
          {faqItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Frequently Asked Questions about {route.title}
              </h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <Accordion items={faqItems} defaultOpenId="faq-0" />
              </div>
            </section>
          )}
        </div>
      </PageShell>
    </>
  );
}
