export interface CompanionPassenger {
  id: string;
  customerId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  isDefaultNextOfKin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditLedgerItem {
  id: string;
  customerId: string;
  deltaKobo: number;
  balanceAfterKobo: number;
  reason: string;
  referenceBookingId: string | null;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
  creditsKobo: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  secretUri?: string;
  qrCodeUrl?: string;
  backupCodesRemaining: number;
}

export type PreferredSeatPosition = 'front_window' | 'middle_row' | 'rear_row' | 'any';

export interface CustomerPreferences {
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  emailReceipts: boolean;
  preferredSeatPosition: PreferredSeatPosition;
  autoFillEmergencyContact: boolean;
  localDataConsent: boolean;
}
