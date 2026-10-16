/**
 * Customer Care Inquiries and CRM Repository
 * Ascent Transport Management
 */

import {
  formatWatDateTime,
  normalisePhone,
  type CustomerInquiry,
  type InquiriesKPIs,
  type CreateCustomerInquiryInput,
  type ResolveInquiryInput,
  type InquiryStatus,
  type InquiryCategory,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';

export class InquiriesRepository {
  private inquiries: Map<string, CustomerInquiry> = new Map();

  constructor() {
    this.seedInquiries();
  }

  private seedInquiries() {
    const inq1: CustomerInquiry = {
      id: 'INQ-2026-001',
      customerName: 'Chiamaka Okonkwo',
      customerPhone: '+2348039871122',
      customerEmail: 'chiamaka.o@example.com',
      bookingRef: 'ATM-7K9W2P',
      waybillCode: null,
      category: 'booking',
      categoryLabel: 'Booking & Seat Modification',
      priority: 'high',
      status: 'open',
      subject: 'Request to swap passenger seat from 2 to window seat 1',
      message: 'Good day Ascent team, I booked two seats for Enugu to Abuja departure tomorrow. My mother has mild motion sensitivity; please can her seat be swapped to front window seat 1?',
      assignedStaffId: 'staff-terminal-enugu-01',
      assignedStaffName: 'Obiora Nwachukwu',
      resolutionNotes: null,
      resolvedAtUtc: null,
      resolvedAtWat: null,
      createdAtUtc: '2026-10-15T09:15:00Z',
      createdAtWat: 'Thu, 15 Oct 2026 10:15 am WAT',
    };

    const inq2: CustomerInquiry = {
      id: 'INQ-2026-002',
      customerName: 'Tunde Adeleke',
      customerPhone: '+2348023456781',
      customerEmail: 'tunde.adeleke@example.ng',
      bookingRef: null,
      waybillCode: 'ATM-EXP-7K3N9R',
      category: 'luggage',
      categoryLabel: 'Luggage & Waybills',
      priority: 'urgent',
      status: 'in_progress',
      subject: 'Inquiry on delivery ETA for electronics consignment',
      message: 'I shipped a package containing laptop accessories from Jibowu Lagos to Abuja Utako today. Kindly confirm if the package will be ready for pickup by 5:00 pm today.',
      assignedStaffId: 'staff-hq-admin-01',
      assignedStaffName: 'Adaeze Nwankwo',
      resolutionNotes: 'Package is currently on highway transit vehicle ENU-418-XY; expected at Utako bay by 4:15 pm WAT.',
      resolvedAtUtc: null,
      resolvedAtWat: null,
      createdAtUtc: '2026-10-15T11:40:00Z',
      createdAtWat: 'Thu, 15 Oct 2026 12:40 pm WAT',
    };

    const inq3: CustomerInquiry = {
      id: 'INQ-2026-003',
      customerName: 'Folake Balogun',
      customerPhone: '+2348145678901',
      customerEmail: 'folake.b@example.com',
      bookingRef: 'ATM-8M3X1Q',
      waybillCode: null,
      category: 'refund',
      categoryLabel: 'Ticket Cancellation & Refund',
      priority: 'medium',
      status: 'resolved',
      subject: 'Wallet credit confirmation for cancelled trip',
      message: 'I cancelled my ticket yesterday due to a sudden meeting reschedule. Please confirm the ₦28,800 wallet credit balance on my phone number.',
      assignedStaffId: 'staff-hq-admin-01',
      assignedStaffName: 'Adaeze Nwankwo',
      resolutionNotes: 'Verified wallet ledger credit of ₦28,800 applied to +2348145678901 on 14 Oct. Customer confirmed via SMS.',
      resolvedAtUtc: '2026-10-15T08:30:00Z',
      resolvedAtWat: 'Thu, 15 Oct 2026 9:30 am WAT',
      createdAtUtc: '2026-10-14T16:20:00Z',
      createdAtWat: 'Wed, 14 Oct 2026 5:20 pm WAT',
    };

    const inq4: CustomerInquiry = {
      id: 'INQ-2026-004',
      customerName: 'Emeka Umeh',
      customerPhone: '+2348098765432',
      customerEmail: 'emeka.umeh@business.ng',
      bookingRef: null,
      waybillCode: null,
      category: 'general',
      categoryLabel: 'Corporate Transit Inquiry',
      priority: 'low',
      status: 'open',
      subject: 'Private Toyota Sienna Charter for 4-day Owerri wedding',
      message: 'We are planning a family event in Owerri next month and would like to reserve 2 executive Toyota Siennas with vetted drivers for 4 consecutive days.',
      assignedStaffId: null,
      assignedStaffName: null,
      resolutionNotes: null,
      resolvedAtUtc: null,
      resolvedAtWat: null,
      createdAtUtc: '2026-10-15T14:10:00Z',
      createdAtWat: 'Thu, 15 Oct 2026 3:10 pm WAT',
    };

    this.inquiries.set(inq1.id, inq1);
    this.inquiries.set(inq2.id, inq2);
    this.inquiries.set(inq3.id, inq3);
    this.inquiries.set(inq4.id, inq4);
  }

  async getInquiries(filter?: {
    status?: string;
    category?: string;
    query?: string;
  }): Promise<CustomerInquiry[]> {
    let list = Array.from(this.inquiries.values());

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((i) => i.status === filter.status);
    }

    if (filter?.category && filter.category !== 'all') {
      list = list.filter((i) => i.category === filter.category);
    }

    if (filter?.query) {
      const q = filter.query.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.customerName.toLowerCase().includes(q) ||
          i.customerPhone.includes(q) ||
          (i.bookingRef && i.bookingRef.toLowerCase().includes(q)) ||
          (i.waybillCode && i.waybillCode.toLowerCase().includes(q)) ||
          i.subject.toLowerCase().includes(q)
      );
    }

    return list.map((i) => JSON.parse(JSON.stringify(i)));
  }

  async getKPIs(): Promise<InquiriesKPIs> {
    const all = Array.from(this.inquiries.values());
    return {
      totalInquiries: all.length,
      openCount: all.filter((i) => i.status === 'open').length,
      inProgressCount: all.filter((i) => i.status === 'in_progress').length,
      resolvedCount: all.filter((i) => i.status === 'resolved').length,
      urgentCount: all.filter((i) => i.priority === 'urgent' && i.status !== 'resolved').length,
    };
  }

  async createInquiry(input: CreateCustomerInquiryInput): Promise<CustomerInquiry> {
    const categoryLabels: Record<InquiryCategory, string> = {
      booking: 'Booking & Seat Modification',
      luggage: 'Luggage & Waybills',
      refund: 'Ticket Cancellation & Refund',
      driver_conduct: 'Driver Service & Conduct',
      delay: 'Departure Transit Delay',
      general: 'General Customer Care',
    };

    const nowUtc = new Date().toISOString();
    const formattedWat = formatWatDateTime(nowUtc);

    const newInq: CustomerInquiry = {
      id: `INQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || undefined,
      bookingRef: input.bookingRef || null,
      waybillCode: input.waybillCode || null,
      category: input.category,
      categoryLabel: categoryLabels[input.category] || 'Customer Inquiry',
      priority: input.priority || 'medium',
      status: 'open',
      subject: input.subject,
      message: input.message,
      assignedStaffId: null,
      assignedStaffName: null,
      resolutionNotes: null,
      resolvedAtUtc: null,
      resolvedAtWat: null,
      createdAtUtc: nowUtc,
      createdAtWat: formattedWat.fullStr,
    };

    this.inquiries.set(newInq.id, newInq);
    return JSON.parse(JSON.stringify(newInq));
  }

  async resolveInquiry(input: ResolveInquiryInput): Promise<CustomerInquiry> {
    const inq = this.inquiries.get(input.inquiryId);
    if (!inq) {
      throw new AppError(`Inquiry ticket ${input.inquiryId} was not found.`, 404);
    }

    const nowUtc = new Date().toISOString();
    const formattedWat = formatWatDateTime(nowUtc);

    inq.status = input.status;
    inq.resolutionNotes = input.resolutionNotes;
    inq.assignedStaffId = input.staffId;
    inq.assignedStaffName = input.staffName;

    if (input.status === 'resolved') {
      inq.resolvedAtUtc = nowUtc;
      inq.resolvedAtWat = formattedWat.fullStr;
    } else {
      inq.resolvedAtUtc = null;
      inq.resolvedAtWat = null;
    }

    this.inquiries.set(inq.id, inq);
    return JSON.parse(JSON.stringify(inq));
  }
}

export const inquiriesRepository = new InquiriesRepository();
