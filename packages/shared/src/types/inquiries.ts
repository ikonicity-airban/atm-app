/**
 * Customer Care Inquiries and CRM Types
 * Ascent Transport Management
 */

export type InquiryCategory = 'booking' | 'luggage' | 'refund' | 'driver_conduct' | 'delay' | 'general';
export type InquiryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InquiryStatus = 'open' | 'in_progress' | 'resolved';

export interface CustomerInquiry {
  id: string; // e.g. "INQ-2026-001"
  customerName: string;
  customerPhone: string; // E.164 normalized
  customerEmail?: string;
  bookingRef?: string | null; // e.g. "ATM-7K9W2P"
  waybillCode?: string | null; // e.g. "ATM-EXP-XXXXXX"
  category: InquiryCategory;
  categoryLabel: string;
  priority: InquiryPriority;
  status: InquiryStatus;
  subject: string;
  message: string;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  resolutionNotes: string | null;
  resolvedAtUtc: string | null;
  resolvedAtWat: string | null;
  createdAtUtc: string;
  createdAtWat: string;
}

export interface InquiriesKPIs {
  totalInquiries: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  urgentCount: number;
}
