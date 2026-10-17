import type { VehicleSeatLayout, CancellationPolicy } from '../types/index.ts';

export const BRAND = {
  name: 'Ascent Transport Management',
  shortName: 'ATM Nigeria',
  domain: 'atmnigeria.com',
  tagline: 'Travel Safe and Fast.',
  foundedYear: 2019,
  currency: 'NGN',
  currencySymbol: '₦',
  timezone: 'Africa/Lagos',
  defaultPhoneCode: '+234',
  supportEmail: 'support@atmnigeria.com',
  contactPhones: ['+2349070000625', '+2349070000210', '+2349070000884'],
} as const;

export const SEAT_HOLD_DURATION_MINUTES = 15; // 15-minute reservation hold window (Spec 0009)

// Default booking settings (configurable in settings)
export const DEFAULT_BOOKING_SETTINGS = {
  holdMinutes: 15,     // 15-minute hold window for seat reservations
  maxAdvanceDays: 30,  // 30 days maximum advance booking window
  cutoffMinutes: 60,   // booking closes 60 minutes before departure
} as const;

// Official vehicle description requirement: "Toyota Sienna, 5 seats, A/C, extra legroom, refreshments."
export const VEHICLE_DESCRIPTION = 'Toyota Sienna, 5 seats, A/C, extra legroom, refreshments.' as const;

// Dedicated Toyota Sienna 5-passenger configuration
export const SIENNA_5_SEAT_LAYOUT: VehicleSeatLayout = {
  totalSeats: 5,
  driverSeat: 'Front Left',
  seats: [
    { seatNo: 1, label: 'Front Passenger (Window)', row: 1, column: 2 },
    { seatNo: 2, label: 'Middle Row Left (Window)', row: 2, column: 1 },
    { seatNo: 3, label: 'Middle Row Right (Window)', row: 2, column: 2 },
    { seatNo: 4, label: 'Rear Row Left', row: 3, column: 1 },
    { seatNo: 5, label: 'Rear Row Right', row: 3, column: 2 },
  ],
};

// Default Cancellation Policy (fallback if not in DB setting)
// TODO(client): confirm policy with terminal management
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  noRefundHoursBefore: 2,
  rules: [
    { hoursBeforeDeparture: 24, feePercentage: 10 },
    { hoursBeforeDeparture: 6, feePercentage: 25 },
    { hoursBeforeDeparture: 2, feePercentage: 50 },
  ],
};

export const SERVED_CITIES = ['Enugu', 'Abuja', 'Lagos', 'Owerri'] as const;
export type ServedCity = (typeof SERVED_CITIES)[number];

export const SERVED_CORRIDORS: Array<{ from: ServedCity; to: ServedCity }> = [
  { from: 'Enugu', to: 'Abuja' },
  { from: 'Abuja', to: 'Enugu' },
  { from: 'Enugu', to: 'Lagos' },
  { from: 'Lagos', to: 'Enugu' },
  { from: 'Lagos', to: 'Owerri' },
  { from: 'Owerri', to: 'Lagos' },
];

export const SEED_TERMINALS = [
  {
    id: 'term-enugu-ogui',
    code: 'ENU',
    name: 'Enugu (Ogui Road)',
    city: 'Enugu' as const,
    state: 'Enugu State',
    address: '263 Ogui Road, Opp. Fire Service, Enugu State',
    phones: ['09070000625', '09033933118'],
    latitude: 6.4474,
    longitude: 7.5144,
  },
  {
    id: 'term-abuja-utako',
    code: 'ABJ',
    name: 'Abuja (Utako)',
    city: 'Abuja' as const,
    state: 'Abuja FCT',
    address: 'Atlantic Mall, Plot 482, Obafemi Awolowo Way, Utako, Abuja FCT',
    phones: ['09070000210', '09033856469'],
    latitude: 9.0621,
    longitude: 7.4398,
  },
  {
    id: 'term-lagos-jibowu',
    code: 'LOS-JIB',
    name: 'Lagos (Jibowu)',
    city: 'Lagos' as const,
    state: 'Lagos State',
    address: '7 Ikorodu Road, Jibowu, Yaba, opp. Chisco, Lagos State',
    phones: ['09070000884', '09033856334'],
    latitude: 6.5218,
    longitude: 3.3686,
  },
  {
    id: 'term-lagos-ajah',
    code: 'LOS-AJH',
    name: 'Lagos (Ajah)',
    city: 'Lagos' as const,
    state: 'Lagos State',
    address: 'Top Notch Place Ajowe, Opp. Fidelity Bank, Ajah, before Abraham Adesanya Estate, Lekki, Lagos State',
    phones: ['09070000985', '09062535218'],
    latitude: 6.4698,
    longitude: 3.5852,
  },
  {
    id: 'term-lagos-festac',
    code: 'LOS-FST',
    name: 'Lagos (Festac)',
    city: 'Lagos' as const,
    state: 'Lagos State',
    address: 'Opp. Maternal & Child, After NIPCO Gas Station, Festac Town, Lagos',
    phones: ['09070000902', '09062535210'],
    latitude: 6.4674,
    longitude: 3.2847,
  },
  {
    id: 'term-owerri-egbo',
    code: 'QOW',
    name: 'Owerri (Egbo Road)',
    city: 'Owerri' as const,
    state: 'Imo State',
    address: 'Plot C38 Egbo Road, opp. Young Shall Grow, Owerri',
    phones: ['09070000867', '09062535222'],
    latitude: 5.4836,
    longitude: 7.0333,
  },
] as const;

// Flagged placeholder fares in kobo (// TODO(client): confirm with client on actual route fares)
export const PLACEHOLDER_FARES_KOBO = {
  ENUGU_ABUJA: 3200000,   // ₦32,000
  ENUGU_LAGOS: 3600000,   // ₦36,000
  LAGOS_OWERRI: 3500000,  // ₦35,000
  isPlaceholder: true,
} as const;

export * from './navigation.ts';
export * from './corridors.ts';
export * from './waypoints.ts';


