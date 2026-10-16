'use client';

import React, { useEffect } from 'react';
import { BRAND } from '@atm/shared';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  currentPath?: string;
}

export interface RouteMeta {
  title: string;
  description: string;
  ogImage?: string;
  keywords?: string[];
}

export const ROUTE_SEO_DIRECTORY: Record<string, RouteMeta> = {
  '/': {
    title: 'Ascent Transport | Executive Intercity Toyota Sienna Travel Across Nigeria',
    description:
      'Travel in air-conditioned comfort with 5-passenger Toyota Siennas between Enugu, Abuja, Lagos, and Owerri. Punctual departures, extra legroom, and verified safety.',
    ogImage: '/images/hero/highway-sunset.jpg',
    keywords: ['transport nigeria', 'toyota sienna intercity', 'enugu to abuja bus', 'lagos transport', 'ascent transport'],
  },
  '/trips': {
    title: 'Search Scheduled Departures | Ascent Transport Management',
    description:
      'Search live daily Sienna departures, seat availability, and fixed kobo fares across Nigerian transport corridors.',
    keywords: ['book sienna trip', 'intercity transport tickets', 'lagos to enugu departures'],
  },
  '/manage': {
    title: 'Manage Your Booking | Ascent Transport Management',
    description:
      'Retrieve your ticket, view assigned seat number, check departure terminal gate, or reschedule your trip with your booking reference.',
    keywords: ['manage booking', 'check seat reservation', 'ticket status'],
  },
  '/cancel': {
    title: 'Booking Cancellation & Refund Rules | Ascent Transport Management',
    description:
      'Review transparent cancellation fees and refund timelines based on departure cutoff windows.',
    keywords: ['cancel ticket', 'refund policy', 'travel cancellation'],
  },
  '/courier': {
    title: 'Express Intercity Parcel Courier & Freight | Ascent Transport',
    description:
      'Fast terminal-to-terminal waybill delivery for packages and business parcels. Registered, weighed, and dispatched on scheduled departures.',
    ogImage: '/images/hero/sienna-thumb.jpg',
    keywords: ['intercity courier nigeria', 'send parcel to enugu', 'lagos abuja waybill'],
  },
  '/track': {
    title: 'Live Parcel & Waybill Tracking | Ascent Transport',
    description:
      'Track the real-time transit status of your package across Ascent Transport hubs using your ATM tracking code.',
    keywords: ['track waybill', 'parcel tracking nigeria', 'ascent courier status'],
  },
  '/charter': {
    title: 'Executive 5-Passenger Sienna Vehicle Hire | Ascent Charter',
    description:
      'Hire a dedicated Toyota Sienna for family vacations, business travel, weddings, or VIP airport transfers across Nigeria.',
    ogImage: '/images/hero/sienna-thumb.jpg',
    keywords: ['hire sienna car', 'intercity vehicle charter', 'private bus hire nigeria'],
  },
  '/corporate': {
    title: 'Corporate Travel & Staff Transit Logistics | Ascent Transport',
    description:
      'Tailored executive logistics, monthly invoicing, dedicated vehicle allocation, and priority support for Nigerian enterprises.',
    keywords: ['corporate transport', 'staff transit services', 'business logistics nigeria'],
  },
  '/routes': {
    title: 'Scheduled Corridors & Fares | Ascent Transport Management',
    description:
      'Explore all daily intercity corridors connecting Enugu, Abuja, Lagos, and Owerri with fixed fares and estimated travel times.',
    keywords: ['intercity bus routes', 'enugu to abuja fare', 'lagos to owerri route'],
  },
  '/terminals': {
    title: 'Ascent Terminals & Customer Desks | Enugu, Abuja, Lagos, Owerri',
    description:
      'Find physical terminal addresses, phone lines, ticket desks, and GPS locations for Ogui Road, Utako, Jibowu, Ajah, and Control Post.',
    keywords: ['ascent terminal address', 'utako bus park', 'jibowu terminal lagos', 'ogui road enugu'],
  },
  '/about': {
    title: 'About Ascent Transport Management | Punctual, Safe, Executive',
    description:
      'Learn about our 5-passenger fleet standard, certified drivers, automated speed governors, and mission to redefine intercity travel in Nigeria.',
    keywords: ['about ascent transport', 'safe travel nigeria', 'executive sienna fleet'],
  },
  '/contact': {
    title: 'Contact & Helplines | Ascent Transport Support',
    description:
      'Get in touch with customer care, terminal managers, parcel dispatchers, and emergency support lines across Nigeria.',
    keywords: ['ascent customer care', 'helpline phone number', 'complaints desk'],
  },
  '/faq': {
    title: 'Frequently Asked Questions | Ascent Transport Management',
    description:
      'Answers to common questions about 5-passenger seating, 10-minute seat holds, luggage limits, ticket rescheduling, and Paystack payments.',
    keywords: ['ascent faq', 'luggage allowance', 'seat hold time'],
  },
  '/terms': {
    title: 'Terms of Carriage & Passenger Rights | Ascent Transport',
    description:
      'Passenger terms and conditions, luggage liability, passenger responsibilities, and code of conduct for all Ascent journeys.',
    keywords: ['terms of carriage', 'passenger rights', 'luggage policy'],
  },
  '/privacy': {
    title: 'Privacy Policy & Data Security | Ascent Transport Management',
    description:
      'How we protect your phone number, booking records, and payment information in accordance with Nigerian data protection regulations.',
    keywords: ['privacy policy', 'passenger data protection', 'ndpr compliance'],
  },
  '/account': {
    title: 'Customer Profile & Booking History | Ascent Transport',
    description:
      'View your upcoming Sienna departures, past ticket receipts, passenger details, and express rebooking shortcuts.',
    keywords: ['my bookings', 'travel history', 'customer account'],
  },
  '/login': {
    title: 'Customer Sign In | Ascent Transport Management',
    description:
      'Sign in with your phone number or email to access your bookings, saved passengers, and booking receipts.',
    keywords: ['customer login', 'sign in ascent'],
  },
  '/admin/login': {
    title: 'Terminal Staff & Dispatch Portal Sign In | Ascent Transport',
    description:
      'Secure authentication for terminal managers, ticket officers, and fleet dispatch staff.',
    keywords: ['staff portal', 'terminal dispatch login'],
  },
  '/admin': {
    title: 'Operations Dashboard | Ascent Transport Terminal Admin',
    description:
      'Real-time overview of active departures, seat manifest loads, parcel dispatches, and daily terminal revenue.',
    keywords: ['terminal operations', 'fleet management'],
  },
};

export function getMetadataForPath(path: string): RouteMeta {
  // Direct exact match
  if (ROUTE_SEO_DIRECTORY[path]) {
    return ROUTE_SEO_DIRECTORY[path]!;
  }

  // Dynamic route matches
  if (path.startsWith('/routes/')) {
    const slug = path.replace('/routes/', '').replace(/-/g, ' ');
    const formattedSlug = slug
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' to ');
    return {
      title: `${formattedSlug} Scheduled Sienna Departures | Ascent Transport`,
      description: `Daily executive 5-passenger Sienna departures on the ${formattedSlug} corridor. Punctual departure schedule and fixed kobo fares.`,
      keywords: [`${slug} travel`, `${slug} fare`, 'intercity sienna'],
    };
  }

  if (path.startsWith('/book/success/')) {
    const ref = path.replace('/book/success/', '').split('?')[0];
    return {
      title: `Booking Confirmed (${ref}) | Ascent Transport Management`,
      description: `Your Ascent Transport seat reservation ${ref} is confirmed. View your departure terminal gate, seat number, and boarding pass.`,
    };
  }

  if (path.startsWith('/book/')) {
    return {
      title: 'Seat Selection & Checkout | Ascent Transport Management',
      description:
        'Select your preferred seat in our 5-passenger Toyota Sienna layout, review departure details, and complete your reservation.',
    };
  }

  if (path.startsWith('/admin/')) {
    const section = path.replace('/admin/', '').replace(/-/g, ' ');
    const formatted = section.charAt(0).toUpperCase() + section.slice(1);
    return {
      title: `Admin ${formatted} | Ascent Transport Operations`,
      description: `Terminal operations and management console for ${formatted}.`,
    };
  }

  // Default fallback
  return ROUTE_SEO_DIRECTORY['/']!;
}

export function SEOHead({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  jsonLd,
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/',
}: SEOHeadProps) {
  const defaultMeta = getMetadataForPath(currentPath);

  const finalTitle = title || defaultMeta.title;
  const finalDescription = description || defaultMeta.description;
  const finalImage = ogImage || defaultMeta.ogImage || '/images/hero/highway-sunset.jpg';
  const siteUrl = 'https://atmnigeria.com';
  const canonicalUrl = `${siteUrl}${canonicalPath || currentPath}`;

  // Imperatively update document.head for guaranteed immediate synchronization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Document title
    document.title = finalTitle;

    // Helper to set or create meta tag
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', finalDescription);
    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', finalDescription);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', `${siteUrl}${finalImage}`);
    setMeta('property', 'og:site_name', BRAND.name);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', finalTitle);
    setMeta('name', 'twitter:description', finalDescription);
    setMeta('name', 'twitter:image', `${siteUrl}${finalImage}`);

    // Canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
  }, [finalTitle, finalDescription, canonicalUrl, ogType, finalImage]);

  return (
    <>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={`${siteUrl}${finalImage}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`${siteUrl}${finalImage}`} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]),
          }}
        />
      )}
    </>
  );
}
