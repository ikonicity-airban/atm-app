/**
 * Charter & Corporate Logistics Repository
 * Manages bespoke Toyota Sienna private hire, corporate fleet contracts,
 * quote estimation adjustments, and vehicle/driver assignments.
 */

import {
  assertIntegerKobo,
  generateCharterReference,
  calculateCharterQuote,
  type CharterRequest,
  type CharterEvent,
  type CreateCharterRequestInput,
  type UpdateCharterRequestInput,
  type CharterStatus,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';

export interface ICharterRepository {
  createRequest(input: CreateCharterRequestInput, customerId?: string): Promise<CharterRequest>;
  getRequestByReference(reference: string): Promise<CharterRequest | null>;
  getRequestById(id: string): Promise<CharterRequest | null>;
  getAllRequests(filters?: {
    status?: string;
    serviceType?: string;
    search?: string;
  }): Promise<CharterRequest[]>;
  updateRequest(id: string, update: UpdateCharterRequestInput): Promise<CharterRequest>;
  addEvent(
    requestId: string,
    status: CharterStatus,
    description: string,
    staffId?: string
  ): Promise<CharterEvent>;
}

export class StaticCharterRepository implements ICharterRepository {
  private static requests = new Map<string, CharterRequest>();
  private static events = new Map<string, CharterEvent[]>(); // key: requestId
  private static initialized = false;

  constructor() {
    StaticCharterRepository.initSeeds();
  }

  private static initSeeds() {
    if (StaticCharterRepository.initialized) return;
    StaticCharterRepository.initialized = true;

    const seedRequests: CharterRequest[] = [
      {
        id: 'crt-001',
        reference: 'ATM-CRT-7K9W2P',
        customerId: 'usr-customer-01',
        contactName: 'Chief Emeka Okafor',
        contactPhone: '+2348031234567',
        contactEmail: 'emeka.okafor@primeholdings.ng',
        organizationName: 'Prime Holdings Ltd',
        organizationTaxId: 'TIN-28491048-0001',
        serviceType: 'private_charter',
        tripType: 'round_trip',
        originCity: 'Enugu',
        originAddress: '14 Independence Layout, Enugu',
        destinationCity: 'Abuja',
        destinationAddress: 'Transcorp Hilton Hotel, Maitama, Abuja',
        departureDate: '2026-10-24T06:30:00.000Z',
        returnDate: '2026-10-27T14:00:00.000Z',
        durationDays: 4,
        passengerCount: 4,
        specialRequirements: 'Executive leather Sienna required with luggage trunk for 4 travel suitcases and chilled water dispenser.',
        estimatedFareKobo: 69000000, // ₦690,000
        finalFareKobo: 69000000,
        billingMethod: 'paystack_gateway',
        invoiceReference: null,
        status: 'assigned',
        assignedVehicleId: 'veh-sienna-01',
        assignedDriverId: 'drv-chukwuma-01',
        dispatchNotes: 'Driver briefed for executive protocol and early morning pickup.',
        createdAt: '2026-10-15T09:00:00.000Z',
        updatedAt: '2026-10-15T11:30:00.000Z',
      },
      {
        id: 'crt-002',
        reference: 'ATM-CRT-9X2L8M',
        customerId: null,
        contactName: 'Engr. Folake Adeleke',
        contactPhone: '+2348029876543',
        contactEmail: 'folake.adeleke@dangote-cement.com',
        organizationName: 'Dangote Cement PLC (South East Operations)',
        organizationTaxId: 'RC-1129481',
        serviceType: 'corporate_transit',
        tripType: 'one_way',
        originCity: 'Enugu',
        originAddress: 'Enugu Regional Depot, Emene Industrial Area',
        destinationCity: 'Lagos',
        destinationAddress: 'Dangote Towers, Ikoyi, Lagos',
        departureDate: '2026-10-28T07:00:00.000Z',
        returnDate: null,
        durationDays: 1,
        passengerCount: 3,
        specialRequirements: 'Technical audit delegation. Need VAT invoice issued to Dangote Cement Accounts.',
        estimatedFareKobo: 23500000, // ₦235,000
        finalFareKobo: 23500000,
        billingMethod: 'corporate_invoice',
        invoiceReference: 'PO-DANG-2026-089',
        status: 'approved',
        assignedVehicleId: null,
        assignedDriverId: null,
        dispatchNotes: 'Verified corporate purchase order with procurement manager.',
        createdAt: '2026-10-15T14:15:00.000Z',
        updatedAt: '2026-10-16T08:00:00.000Z',
      },
      {
        id: 'crt-003',
        reference: 'ATM-CRT-4M6P1Q',
        customerId: null,
        contactName: 'Nnamdi Kanu & Associates',
        contactPhone: '+2348145556677',
        contactEmail: 'logistics@kanu-legal.ng',
        organizationName: 'Kanu & Partners Chambers',
        organizationTaxId: 'TIN-9918234-01',
        serviceType: 'custom_cargo',
        tripType: 'one_way',
        originCity: 'Enugu',
        originAddress: 'Federal High Court Area, Independence Layout',
        destinationCity: 'Owerri',
        destinationAddress: 'Customary Court of Appeal Complex, Owerri',
        departureDate: '2026-10-22T08:00:00.000Z',
        returnDate: null,
        durationDays: 1,
        passengerCount: 2,
        specialRequirements: 'Confidential legal briefs transport. Direct nonstop corridor transit required.',
        estimatedFareKobo: 10000000, // ₦100,000
        finalFareKobo: null,
        billingMethod: 'paystack_gateway',
        invoiceReference: null,
        status: 'submitted',
        assignedVehicleId: null,
        assignedDriverId: null,
        dispatchNotes: null,
        createdAt: '2026-10-16T09:45:00.000Z',
        updatedAt: '2026-10-16T09:45:00.000Z',
      },
    ];

    for (const req of seedRequests) {
      StaticCharterRepository.requests.set(req.id, req);

      const seedEvents: CharterEvent[] = [
        {
          id: `evt-${req.id}-1`,
          requestId: req.id,
          status: 'submitted',
          description: `Charter request received online for ${req.originCity} to ${req.destinationCity}.`,
          staffId: null,
          createdAt: req.createdAt,
        },
      ];

      if (req.status === 'approved' || req.status === 'assigned') {
        seedEvents.push({
          id: `evt-${req.id}-2`,
          requestId: req.id,
          status: 'approved',
          description: 'Charter quote validated and approved by operations desk.',
          staffId: 'staff-ops-01',
          createdAt: req.updatedAt,
        });
      }

      if (req.status === 'assigned') {
        seedEvents.push({
          id: `evt-${req.id}-3`,
          requestId: req.id,
          status: 'assigned',
          description: `Vehicle ${req.assignedVehicleId} and driver ${req.assignedDriverId} assigned.`,
          staffId: 'staff-ops-01',
          createdAt: req.updatedAt,
        });
      }

      StaticCharterRepository.events.set(req.id, seedEvents);
    }
  }

  async createRequest(
    input: CreateCharterRequestInput,
    customerId?: string
  ): Promise<CharterRequest> {
    assertIntegerKobo(input.estimatedFareKobo);

    const now = new Date().toISOString();
    const id = `crt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const reference = generateCharterReference();

    const request: CharterRequest = {
      id,
      reference,
      customerId: customerId || null,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      organizationName: input.organizationName || null,
      organizationTaxId: input.organizationTaxId || null,
      serviceType: input.serviceType,
      tripType: input.tripType,
      originCity: input.originCity,
      originAddress: input.originAddress,
      destinationCity: input.destinationCity,
      destinationAddress: input.destinationAddress,
      departureDate: input.departureDate,
      returnDate: input.returnDate || null,
      durationDays: input.durationDays,
      passengerCount: input.passengerCount,
      specialRequirements: input.specialRequirements || null,
      estimatedFareKobo: input.estimatedFareKobo,
      finalFareKobo: null,
      billingMethod: input.billingMethod,
      invoiceReference: input.invoiceReference || null,
      status: 'submitted',
      assignedVehicleId: null,
      assignedDriverId: null,
      dispatchNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    StaticCharterRepository.requests.set(id, request);

    await this.addEvent(
      id,
      'submitted',
      `Charter request submitted by ${input.contactName} (${input.contactPhone}) for ${input.originCity} → ${input.destinationCity}.`,
      null
    );

    return {
      ...request,
      events: StaticCharterRepository.events.get(id) || [],
    };
  }

  async getRequestByReference(reference: string): Promise<CharterRequest | null> {
    const norm = reference.trim().toUpperCase();
    for (const req of StaticCharterRepository.requests.values()) {
      if (req.reference.toUpperCase() === norm) {
        return {
          ...req,
          events: StaticCharterRepository.events.get(req.id) || [],
        };
      }
    }
    return null;
  }

  async getRequestById(id: string): Promise<CharterRequest | null> {
    const req = StaticCharterRepository.requests.get(id);
    if (!req) return null;
    return {
      ...req,
      events: StaticCharterRepository.events.get(id) || [],
    };
  }

  async getAllRequests(filters?: {
    status?: string;
    serviceType?: string;
    search?: string;
  }): Promise<CharterRequest[]> {
    let list = Array.from(StaticCharterRepository.requests.values());

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }

    if (filters?.serviceType && filters.serviceType !== 'all') {
      list = list.filter((r) => r.serviceType === filters.serviceType);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reference.toLowerCase().includes(q) ||
          r.contactName.toLowerCase().includes(q) ||
          r.contactPhone.toLowerCase().includes(q) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(q)) ||
          r.originCity.toLowerCase().includes(q) ||
          r.destinationCity.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map((r) => ({
      ...r,
      events: StaticCharterRepository.events.get(r.id) || [],
    }));
  }

  async updateRequest(
    id: string,
    update: UpdateCharterRequestInput
  ): Promise<CharterRequest> {
    const req = StaticCharterRepository.requests.get(id);
    if (!req) {
      throw AppError.notFound(`Charter request with id ${id} not found`);
    }

    if (update.finalFareKobo !== undefined) {
      assertIntegerKobo(update.finalFareKobo);
      req.finalFareKobo = update.finalFareKobo;
    }

    if (update.assignedVehicleId !== undefined) {
      req.assignedVehicleId = update.assignedVehicleId;
    }

    if (update.assignedDriverId !== undefined) {
      req.assignedDriverId = update.assignedDriverId;
    }

    if (update.dispatchNotes !== undefined) {
      req.dispatchNotes = update.dispatchNotes;
    }

    const prevStatus = req.status;
    if (update.status && update.status !== prevStatus) {
      req.status = update.status;
      await this.addEvent(
        id,
        update.status,
        `Status updated from ${prevStatus} to ${update.status} by staff.`,
        update.staffId
      );
    }

    req.updatedAt = new Date().toISOString();
    StaticCharterRepository.requests.set(id, req);

    return {
      ...req,
      events: StaticCharterRepository.events.get(id) || [],
    };
  }

  async addEvent(
    requestId: string,
    status: CharterStatus,
    description: string,
    staffId?: string | null
  ): Promise<CharterEvent> {
    const event: CharterEvent = {
      id: `crtevt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId,
      status,
      description,
      staffId: staffId || null,
      createdAt: new Date().toISOString(),
    };

    const list = StaticCharterRepository.events.get(requestId) || [];
    list.push(event);
    StaticCharterRepository.events.set(requestId, list);
    return event;
  }
}

export const charterRepository: ICharterRepository = new StaticCharterRepository();
