export interface NavigationItem {
  id: string;
  label: string;
  sub?: string;
  path: string;
  badge?: string;
}

export interface NavigationCategory {
  id: 'trips' | 'travel' | 'courier' | 'charter' | 'support';
  label: string;
  directPath?: string;
  description: string;
  items?: NavigationItem[];
}

export const MAIN_NAVIGATION: NavigationCategory[] = [
  {
    id: 'trips',
    label: 'Find Trips',
    directPath: '/trips',
    description: 'Direct search and booking engine for scheduled intercity trips',
  },
  {
    id: 'travel',
    label: 'Travel',
    description: 'Passenger transport schedules and departure terminals across Nigeria',
    items: [
      {
        id: 'routes',
        label: 'Corridors & Schedules',
        sub: 'Daily fixed schedule Toyota Sienna departures',
        path: '/routes',
      },
      {
        id: 'terminals',
        label: 'Terminal Directory',
        sub: 'Official departure and arrival hubs across Nigeria',
        path: '/terminals',
      },
    ],
  },
  {
    id: 'courier',
    label: 'Courier',
    description: 'Intercity freight logistics and express package tracking',
    items: [
      {
        id: 'courier-send',
        label: 'Send Express Parcel',
        sub: 'Same day intercity freight and waybills',
        path: '/courier',
      },
      {
        id: 'courier-track',
        label: 'Track Waybill Shipment',
        sub: 'Real time chain of custody by ATM tracking code',
        path: '/track',
      },
    ],
  },
  {
    id: 'charter',
    label: 'Charter & Fleet',
    description: 'Private vehicle hire and corporate logistics contracts',
    items: [
      {
        id: 'charter-private',
        label: 'Private Sienna Charter',
        sub: 'Dedicated 5 seat executive vehicle hire',
        path: '/charter',
      },
      {
        id: 'charter-corporate',
        label: 'Corporate Fleet Logistics',
        sub: 'Bespoke staff transit and intercity contracts',
        path: '/corporate',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    description: 'Customer help desk, policies, and company information',
    items: [
      {
        id: 'support-faq',
        label: 'Frequently Asked Questions',
        sub: 'Seat selection, 15 minute holds, and baggage policies',
        path: '/faq',
      },
      {
        id: 'support-contact',
        label: 'Contact & Helplines',
        sub: 'Terminal phone desks and customer support',
        path: '/contact',
      },
      {
        id: 'support-about',
        label: 'About Ascent Fleet',
        sub: 'Executive Sienna travel standards and safety mission',
        path: '/about',
      },
      {
        id: 'support-terms',
        label: 'Terms of Carriage',
        sub: 'Passenger rights, baggage, and cancellation rules',
        path: '/terms',
      },
      {
        id: 'support-privacy',
        label: 'Privacy Policy',
        sub: 'Data protection and passenger security',
        path: '/privacy',
      },
    ],
  },
];

export const UTILITY_NAVIGATION: NavigationItem[] = [
  {
    id: 'utility-track',
    label: 'Track Parcel',
    path: '/track',
    sub: 'Instant parcel status',
  },
  {
    id: 'utility-manage',
    label: 'Manage Booking',
    path: '/booking/manage',
    sub: 'View or reschedule ticket',
  },
];

export const ALL_PUBLIC_ROUTES = [
  '/',
  '/trips',
  '/routes',
  '/terminals',
  '/courier',
  '/track',
  '/charter',
  '/corporate',
  '/faq',
  '/contact',
  '/about',
  '/terms',
  '/privacy',
  '/booking/manage',
  '/auth/login',
  '/auth/register',
] as const;
