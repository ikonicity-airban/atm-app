import type { DbParcel, DbParcelEvent } from '@atm/db';
import {
  calculateParcelDeliveryFee,
  generateTrackingCode,
  generatePickupOtp,
  type BookParcelInput,
  type ParcelCategory,
  type ParcelStatus,
  SEED_TERMINALS,
} from '@atm/shared';

export interface IParcelRepository {
  createParcel(input: BookParcelInput): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] }>;
  getParcelByTrackingCode(trackingCode: string): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] } | null>;
  getParcelsByPhone(phone: string): Promise<DbParcel[]>;
  updateParcelStatus(
    trackingCode: string,
    newStatus: ParcelStatus,
    locationTerminalId?: string,
    description?: string,
    staffId?: string
  ): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] } | null>;
  verifyPickupAndDeliver(
    trackingCode: string,
    pickupCode: string,
    staffId: string
  ): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] }>;
  getAllParcels(): Promise<DbParcel[]>;
}

// In-memory static storage simulating database state
let parcelsStore: DbParcel[] = [];
let eventsStore: DbParcelEvent[] = [];
let initialized = false;

function initializeSeedParcels() {
  if (initialized) return;
  initialized = true;

  const now = new Date('2026-10-15T14:30:00Z');
  const nowIso = now.toISOString();

  // Seed Parcel 1: In Transit between Enugu and Abuja
  const parcel1Id = 'parcel-seed-01';
  const parcel1Code = 'ATM-EXP-7K3N9R';
  const parcel1Pricing = calculateParcelDeliveryFee({
    category: 'electronics',
    weightKg: 3.5,
    fragile: true,
    declaredValueKobo: 25000000, // ₦250,000 declared value
  });

  const parcel1: DbParcel = {
    id: parcel1Id,
    trackingCode: parcel1Code,
    senderName: 'Chidi Okonkwo',
    senderPhone: '+2348031234567',
    senderEmail: 'chidi.okonkwo@gmail.com',
    receiverName: 'Amina Yusuf',
    receiverPhone: '+2348029876543',
    receiverAddress: 'Plot 482 Obafemi Awolowo Way, Utako, Abuja',
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-abuja-utako',
    category: 'electronics',
    description: 'Dell XPS 15 Laptop & Accessories (Carefully Packaged)',
    weightKg: 3.5,
    fragile: true,
    declaredValueKobo: 25000000,
    feeKobo: parcel1Pricing.baseFeeKobo + parcel1Pricing.weightSurchargeKobo,
    insuranceFeeKobo: parcel1Pricing.insuranceFeeKobo,
    totalFeeKobo: parcel1Pricing.totalFeeKobo,
    pickupOtp: '8391',
    paymentMethod: 'online',
    status: 'in_transit',
    paid: true,
    assignedVehicleId: 'veh-sienna-01',
    createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
  };

  const parcel1Events: DbParcelEvent[] = [
    {
      id: 'event-01-1',
      parcelId: parcel1Id,
      status: 'booked',
      locationTerminalId: 'term-enugu-ogui',
      description: 'Waybill created online. Consignment reservation confirmed.',
      recordedByStaffId: null,
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-01-2',
      parcelId: parcel1Id,
      status: 'received_at_origin',
      locationTerminalId: 'term-enugu-ogui',
      description: 'Package received, weighed, and security verified at Enugu Ogui Terminal parcel bay.',
      recordedByStaffId: 'staff-enugu-01',
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-01-3',
      parcelId: parcel1Id,
      status: 'in_transit',
      locationTerminalId: 'term-enugu-ogui',
      description: 'Loaded onto Toyota Sienna transit vehicle (Corridor Enugu to Abuja). Departed on highway.',
      recordedByStaffId: 'staff-enugu-01',
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
  ];

  // Seed Parcel 2: Ready for collection at Lagos Jibowu Terminal
  const parcel2Id = 'parcel-seed-02';
  const parcel2Code = 'ATM-EXP-2M8W4P';
  const parcel2Pricing = calculateParcelDeliveryFee({
    category: 'documents',
    weightKg: 0.8,
    fragile: false,
    declaredValueKobo: 0,
  });

  const parcel2: DbParcel = {
    id: parcel2Id,
    trackingCode: parcel2Code,
    senderName: 'Emeka Nwosu',
    senderPhone: '+2348035551234',
    senderEmail: 'emeka@nwosulegal.ng',
    receiverName: 'Babatunde Adeleke',
    receiverPhone: '+2348091112233',
    receiverAddress: '7 Ikorodu Road, Jibowu, Yaba, Lagos',
    originTerminalId: 'term-owerri-egbo',
    destinationTerminalId: 'term-lagos-jibowu',
    category: 'documents',
    description: 'Corporate Legal Agreements and Land Deeds (Waterproof envelope)',
    weightKg: 0.8,
    fragile: false,
    declaredValueKobo: 0,
    feeKobo: parcel2Pricing.baseFeeKobo,
    insuranceFeeKobo: 0,
    totalFeeKobo: parcel2Pricing.totalFeeKobo,
    pickupOtp: '4829',
    paymentMethod: 'online',
    status: 'ready_for_pickup',
    paid: true,
    assignedVehicleId: 'veh-sienna-02',
    createdAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
  };

  const parcel2Events: DbParcelEvent[] = [
    {
      id: 'event-02-1',
      parcelId: parcel2Id,
      status: 'booked',
      locationTerminalId: 'term-owerri-egbo',
      description: 'Waybill created online. Drop-off scheduled at Owerri Egbo Terminal.',
      recordedByStaffId: null,
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-02-2',
      parcelId: parcel2Id,
      status: 'received_at_origin',
      locationTerminalId: 'term-owerri-egbo',
      description: 'Envelope received and sealed at Owerri Egbo Terminal counter.',
      recordedByStaffId: 'staff-owerri-01',
      createdAt: new Date(now.getTime() - 22 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-02-3',
      parcelId: parcel2Id,
      status: 'in_transit',
      locationTerminalId: 'term-owerri-egbo',
      description: 'Dispatched on morning transit run (Owerri to Lagos).',
      recordedByStaffId: 'staff-owerri-01',
      createdAt: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-02-4',
      parcelId: parcel2Id,
      status: 'arrived_at_destination',
      locationTerminalId: 'term-lagos-jibowu',
      description: 'Arrived at Lagos Jibowu Terminal. Handed over to terminal baggage controller.',
      recordedByStaffId: 'staff-jibowu-01',
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'event-02-5',
      parcelId: parcel2Id,
      status: 'ready_for_pickup',
      locationTerminalId: 'term-lagos-jibowu',
      description: 'Stored in secure parcel holding room. SMS dispatched with pickup verification code.',
      recordedByStaffId: 'staff-jibowu-01',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ];

  parcelsStore.push(parcel1, parcel2);
  eventsStore.push(...parcel1Events, ...parcel2Events);
}

export class StaticParcelRepository implements IParcelRepository {
  constructor() {
    initializeSeedParcels();
  }

  async createParcel(input: BookParcelInput): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] }> {
    const trackingCode = generateTrackingCode();
    const pickupOtp = generatePickupOtp();
    const parcelId = `parcel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const pricing = calculateParcelDeliveryFee({
      category: input.category as ParcelCategory,
      weightKg: input.weightKg,
      fragile: input.fragile,
      declaredValueKobo: input.declaredValueKobo,
    });

    const originTerminal = SEED_TERMINALS.find((t) => t.id === input.originTerminalId);
    const destTerminal = SEED_TERMINALS.find((t) => t.id === input.destinationTerminalId);

    const parcel: DbParcel = {
      id: parcelId,
      trackingCode,
      senderName: input.senderName,
      senderPhone: input.senderPhone,
      senderEmail: input.senderEmail || null,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      receiverAddress: input.receiverAddress || null,
      originTerminalId: input.originTerminalId,
      destinationTerminalId: input.destinationTerminalId,
      category: input.category,
      description: input.description,
      weightKg: input.weightKg,
      fragile: input.fragile,
      declaredValueKobo: input.declaredValueKobo ?? 0,
      feeKobo: pricing.baseFeeKobo + pricing.weightSurchargeKobo,
      insuranceFeeKobo: pricing.insuranceFeeKobo,
      totalFeeKobo: pricing.totalFeeKobo,
      pickupOtp,
      paymentMethod: input.paymentMethod,
      status: 'booked',
      paid: input.paymentMethod === 'online',
      assignedVehicleId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const initialEvent: DbParcelEvent = {
      id: `event-${Date.now()}-1`,
      parcelId,
      status: 'booked',
      locationTerminalId: input.originTerminalId,
      description: `Waybill booked online for delivery from ${originTerminal?.name || 'Origin'} to ${destTerminal?.name || 'Destination'}. Awaiting package drop-off at terminal counter.`,
      recordedByStaffId: null,
      createdAt: nowIso,
    };

    parcelsStore.unshift(parcel);
    eventsStore.push(initialEvent);

    return { parcel, timeline: [initialEvent] };
  }

  async getParcelByTrackingCode(trackingCode: string): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] } | null> {
    const normalized = trackingCode.trim().toUpperCase();
    const parcel = parcelsStore.find((p) => p.trackingCode.toUpperCase() === normalized);
    if (!parcel) return null;

    const timeline = eventsStore
      .filter((e) => e.parcelId === parcel.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { parcel, timeline };
  }

  async getParcelsByPhone(phone: string): Promise<DbParcel[]> {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return parcelsStore.filter((p) => {
      const sender = p.senderPhone.replace(/[\s-]/g, '');
      const receiver = p.receiverPhone.replace(/[\s-]/g, '');
      return sender.includes(cleanPhone) || receiver.includes(cleanPhone);
    });
  }

  async updateParcelStatus(
    trackingCode: string,
    newStatus: ParcelStatus,
    locationTerminalId?: string,
    description?: string,
    staffId?: string
  ): Promise<{ parcel: DbParcel; timeline: DbParcelEvent[] } | null> {
    const parcelRecord = await this.getParcelByTrackingCode(trackingCode);
    if (!parcelRecord) return null;

    const { parcel } = parcelRecord;
    const nowIso = new Date().toISOString();

    parcel.status = newStatus;
    parcel.updatedAt = nowIso;
    if (newStatus === 'delivered') {
      parcel.paid = true;
    }

    const newEvent: DbParcelEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      parcelId: parcel.id,
      status: newStatus,
      locationTerminalId: locationTerminalId || parcel.destinationTerminalId,
      description: description || `Status updated to ${newStatus}`,
      recordedByStaffId: staffId || null,
      createdAt: nowIso,
    };

    eventsStore.push(newEvent);

    const timeline = eventsStore
      .filter((e) => e.parcelId === parcel.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { parcel, timeline };
  }

  async verifyPickupAndDeliver(
    trackingCode: string,
    pickupCode: string,
    staffId: string
  ): Promise<{ success: boolean; parcel: DbParcel; message: string }> {
    const record = await this.getParcelByTrackingCode(trackingCode);
    if (!record) {
      throw new Error(`Waybill ${trackingCode} was not found.`);
    }

    if (record.parcel.status === 'delivered') {
      throw new Error(`Waybill ${trackingCode} was already delivered and collected.`);
    }

    if (record.parcel.pickupOtp !== pickupCode.trim()) {
      throw new Error('Invalid 4-digit pickup verification code.');
    }

    const updated = await this.updateParcelStatus(
      trackingCode,
      'delivered',
      record.parcel.destinationTerminalId,
      'Package verified with 4-digit collection code and handed to recipient.',
      staffId
    );

    return {
      success: true,
      parcel: updated!.parcel,
      message: 'Package successfully verified and marked delivered.',
    };
  }

  async getAllParcels(): Promise<DbParcel[]> {
    return [...parcelsStore];
  }
}

export const parcelRepository = new StaticParcelRepository();

