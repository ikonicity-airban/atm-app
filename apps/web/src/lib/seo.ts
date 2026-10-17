/**
 * SEO & Structured Data Helpers (JSON-LD)
 */

import { BRAND, type CorridorSEOProfile } from '@atm/shared';

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: BRAND.name,
    alternateName: BRAND.shortName,
    url: 'https://atmnigeria.com',
    logo: 'https://atmnigeria.com/favicon.svg',
    description: 'Executive intercity passenger transport and express courier parcel delivery across Nigeria.',
    foundingDate: String(BRAND.foundedYear),
    telephone: BRAND.contactPhones[0],
    email: BRAND.supportEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '263 Ogui Road, Opp. Fire Service',
      addressLocality: 'Enugu',
      addressRegion: 'Enugu State',
      addressCountry: 'NG',
    },
    slogan: BRAND.tagline,
  };
}

export function getTerminalJsonLd(terminal: {
  name: string;
  address: string;
  city: string;
  state: string;
  phones: readonly string[] | string[];
  latitude: number | null;
  longitude: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BusStation',
    name: `Ascent Transport Management - ${terminal.name}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: terminal.address,
      addressLocality: terminal.city,
      addressRegion: terminal.state,
      addressCountry: 'NG',
    },
    telephone: terminal.phones[0] ?? BRAND.contactPhones[0],
    ...(terminal.latitude && terminal.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: terminal.latitude,
            longitude: terminal.longitude,
          },
        }
      : {}),
  };
}

export function getBusTripJsonLd(corridor: {
  slug: string;
  title: string;
  originCity: string;
  destinationCity: string;
  originName: string;
  originAddress: string;
  destinationName: string;
  destinationAddress: string;
  startingFareKobo: number;
}) {
  const fareInNaira = (corridor.startingFareKobo / 100).toFixed(2);
  return {
    '@context': 'https://schema.org',
    '@type': 'BusTrip',
    name: corridor.title,
    busNumber: 'Toyota Sienna (5-Passenger Fleet)',
    departureBusStop: {
      '@type': 'BusStop',
      name: corridor.originName,
      address: corridor.originAddress,
    },
    arrivalBusStop: {
      '@type': 'BusStop',
      name: corridor.destinationName,
      address: corridor.destinationAddress,
    },
    provider: {
      '@type': 'TravelAgency',
      name: BRAND.name,
      url: 'https://atmnigeria.com',
    },
    offers: {
      '@type': 'Offer',
      price: fareInNaira,
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      url: `https://atmnigeria.com/routes/${corridor.slug}`,
    },
  };
}

export function getBreadcrumbListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFAQPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
