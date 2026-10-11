/**
 * SEO & Structured Data Helpers (JSON-LD)
 */

import { BRAND, SEED_TERMINALS } from '@atm/shared';

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
