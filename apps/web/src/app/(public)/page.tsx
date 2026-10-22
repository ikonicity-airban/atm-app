'use client';

import React from 'react';
import { HeroShowcase } from '../../components/home/HeroShowcase.tsx';
import { StationStrip } from '../../components/home/StationStrip.tsx';
import { ServicePillars } from '../../components/home/ServicePillars.tsx';
import { HowItWorksVideoSteps } from '../../components/home/HowItWorksVideoSteps.tsx';
import { TrendingBentoGallery } from '../../components/home/TrendingBentoGallery.tsx';
import { SmartTicketingCheckout } from '../../components/home/SmartTicketingCheckout.tsx';
import { MobileAppBanner } from '../../components/home/MobileAppBanner.tsx';
import { CustomerReviews } from '../../components/home/CustomerReviews.tsx';
import { ClosingCta } from '../../components/home/ClosingCta.tsx';
import { Accordion, type AccordionItem } from '../../components/ui/Accordion.tsx';
import { getOrganizationJsonLd } from '../../lib/seo.ts';
import { BRAND, VEHICLE_DESCRIPTION } from '@atm/shared';
import { ArrowRight } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';

export interface HomePageProps {
  onNavigate?: (path: string) => void;
}

const FAQ_ITEMS: AccordionItem[] = [
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
      'When you select a seat, it is reserved exclusively for 15 minutes while you complete payment via Paystack. If payment is not completed within 15 minutes, the seat returns to availability.',
  },
  {
    id: 'faq-3',
    title: 'What payment methods can I use?',
    content:
      'Through Paystack, we accept Nigerian debit and credit cards, bank transfers, USSD, and mobile money. Counter booking is also available at our departure hubs.',
  },
  {
    id: 'faq-4',
    title: 'How does the express parcel waybill service work?',
    content:
      'Bring your parcel to any of our five official terminals. Parcels are weighed, registered, and dispatched on the very next scheduled departure with an SMS tracking code.',
  },
];

export default function HomePage(props?: any) {
  const onNavigate = props?.onNavigate;
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
    <div className="space-y-12 sm:space-y-20 pb-16 bg-background text-foreground transition-colors @container/page">
      {/* Structured SEO Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, webSiteJsonLd]) }}
      />

      {/* 1. HERO SHOWCASE WITH FLOATING SEARCH ISLAND */}
      <HeroShowcase onNavigate={onNavigate} />

      {/* 2. TRUSTED OPERATOR & STATION STRIP */}
      <StationStrip
        onSelectStation={(city) => {
          const url = `/terminals?city=${encodeURIComponent(city)}`;
          if (onNavigate) {
            onNavigate(url);
          } else {
            window.location.href = url;
          }
        }}
      />

      {/* 3. FOUR SERVICE PILLARS */}
      <ServicePillars onNavigate={onNavigate} />

      {/* 4. HOW BOOKING WORKS (THREE STEP GUIDE WITH HOVER-TO-PLAY VIDEO) */}
      <HowItWorksVideoSteps />

      {/* 5. TRENDING DESTINATIONS BENTO GALLERY */}
      <TrendingBentoGallery onNavigate={onNavigate} />

      {/* 6. SMART TICKETING & LIVE CHECKOUT SPLIT */}
      <SmartTicketingCheckout onNavigate={onNavigate} />

      {/* 7. MOBILE EXPERIENCE BANNER */}
      <MobileAppBanner onNavigate={onNavigate} />

      {/* 8. LOVED BY TRAVELERS (VERIFIED REVIEWS) */}
      <CustomerReviews />

      {/* FREQUENTLY ASKED QUESTIONS SUMMARY */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 @container/section">
        <div className="flex justify-between items-end border-b border-border pb-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Direct information on schedules, seat holds, and terminal arrivals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('/faq') : (window.location.href = '/faq')}
            className="text-xs font-normal text-primary hover:text-primary/80 flex items-center gap-1.5 min-h-11 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all motion-reduce:transform-none"
          >
            <span>View all FAQs</span>
            <Icon icon={ArrowRight} size="xs" />
          </button>
        </div>

        <div className="bg-card/75 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-md">
          <Accordion items={FAQ_ITEMS} defaultOpenId="faq-1" />
        </div>
      </section>

      {/* 9. CLOSING CTA BANNER */}
      <ClosingCta onNavigate={onNavigate} />
    </div>
  );
}
