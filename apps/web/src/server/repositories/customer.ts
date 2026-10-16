/**
 * Customer & Account Repository
 * Manages customer profiles, multi-channel auth tokens (phone OTP, email verify, password reset),
 * two-factor authentication, companion traveler rosters (max 5),
 * and atomic integer kobo credit ledger deductions/additions.
 */

import crypto from 'crypto';
import type {
  DbCustomer,
  DbUser,
  DbCompanionPassenger,
  DbCreditLedger,
  DbAuthVerificationToken,
  DbUserTwoFactor,
} from '@atm/db';
import {
  normalisePhone,
  assertIntegerKobo,
  type RegisterInput,
  type CompanionPassengerInput,
  type UpdateCustomerProfileInput,
  type CustomerProfile,
  type CompanionPassenger,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';
import { bookingRepository, type HeldBooking } from './bookings.ts';
import { paymentRepository } from './payments.ts';

export interface ApplyCreditResult {
  bookingRef: string;
  appliedKobo: number;
  remainingFareKobo: number;
  isFullyPaid: boolean;
  creditBalanceAfterKobo: number;
}

export interface ICustomerRepository {
  // Customer & User management
  getCustomerById(id: string): Promise<DbCustomer | null>;
  getCustomerByUserId(userId: string): Promise<DbCustomer | null>;
  getCustomerByPhone(phone: string): Promise<DbCustomer | null>;
  getCustomerByEmail(email: string): Promise<DbCustomer | null>;
  getCustomerProfile(userIdOrCustomerId: string): Promise<CustomerProfile | null>;
  register(input: RegisterInput): Promise<{ user: DbUser; customer: DbCustomer }>;
  updateProfile(customerId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfile>;
  authenticatePassword(identifier: string, password: string): Promise<{ user: DbUser; customer: DbCustomer }>;

  // Companion Passengers (max 5)
  getCompanions(customerId: string): Promise<CompanionPassenger[]>;
  addCompanion(customerId: string, input: CompanionPassengerInput): Promise<CompanionPassenger>;
  deleteCompanion(customerId: string, companionId: string): Promise<boolean>;

  // Credit Ledger
  getCreditBalance(customerId: string): Promise<number>;
  getCreditLedger(customerId: string): Promise<DbCreditLedger[]>;
  addCredit(customerId: string, deltaKobo: number, reason: string, refBookingId?: string): Promise<DbCreditLedger>;
  deductCredit(customerId: string, deltaKobo: number, reason: string, refBookingId?: string): Promise<DbCreditLedger>;

  // Tokens & OTPs
  createVerificationToken(identifier: string, type: DbAuthVerificationToken['type']): Promise<{ token: string; code: string }>;
  verifyToken(identifier: string, code: string, type: DbAuthVerificationToken['type']): Promise<boolean>;

  // Two-Factor Auth
  getTwoFactorStatus(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }>;
  setupTwoFactor(userId: string): Promise<{ secret: string; uri: string; backupCodes: string[] }>;
  verifyTwoFactor(userId: string, code: string): Promise<boolean>;
  disableTwoFactor(userId: string): Promise<boolean>;

  // Checkout Store Credit Redemption
  applyCreditToBookingHold(
    customerId: string,
    bookingRef: string,
    holdToken: string,
    requestedCreditKobo: number
  ): Promise<ApplyCreditResult>;
}

export class CustomerRepository implements ICustomerRepository {
  private static get users(): Map<string, DbUser> {
    if (!(globalThis as any).__atm_cust_users__) (globalThis as any).__atm_cust_users__ = new Map<string, DbUser>();
    return (globalThis as any).__atm_cust_users__;
  }
  private static get userPasswords(): Map<string, string> {
    if (!(globalThis as any).__atm_cust_passwords__) (globalThis as any).__atm_cust_passwords__ = new Map<string, string>();
    return (globalThis as any).__atm_cust_passwords__;
  }
  private static get customers(): Map<string, DbCustomer> {
    if (!(globalThis as any).__atm_cust_customers__) (globalThis as any).__atm_cust_customers__ = new Map<string, DbCustomer>();
    return (globalThis as any).__atm_cust_customers__;
  }
  private static get companions(): DbCompanionPassenger[] {
    if (!(globalThis as any).__atm_cust_companions__) (globalThis as any).__atm_cust_companions__ = [];
    return (globalThis as any).__atm_cust_companions__;
  }
  private static get tokens(): DbAuthVerificationToken[] {
    if (!(globalThis as any).__atm_cust_tokens__) (globalThis as any).__atm_cust_tokens__ = [];
    return (globalThis as any).__atm_cust_tokens__;
  }
  private static get twoFactor(): Map<string, DbUserTwoFactor> {
    if (!(globalThis as any).__atm_cust_2fa__) (globalThis as any).__atm_cust_2fa__ = new Map<string, DbUserTwoFactor>();
    return (globalThis as any).__atm_cust_2fa__;
  }
  private static get heldEscrow(): Map<string, { customerId: string; amountKobo: number }> {
    if (!(globalThis as any).__atm_cust_escrow__) (globalThis as any).__atm_cust_escrow__ = new Map<string, { customerId: string; amountKobo: number }>();
    return (globalThis as any).__atm_cust_escrow__;
  }

  constructor() {
    this.seedDefaultData();
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(`${password}:atm-auth-salt`).digest('hex');
  }

  private seedDefaultData() {
    if (CustomerRepository.customers.size === 0) {
      // Seed default customer matching our staff/cust dev sessions
      const seedUserId = 'user-cust-dev-01';
      const seedCustId = 'cust-dev-01';
      const seedPhone = '+2348031234567';
      const seedEmail = 'customer@example.com';

      const user: DbUser = {
        id: seedUserId,
        name: 'Chioma Okeke',
        email: seedEmail,
        emailVerified: true,
        image: null,
        role: 'customer',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-10-15T10:00:00.000Z',
      };
      CustomerRepository.users.set(seedUserId, user);
      CustomerRepository.userPasswords.set(seedUserId, this.hashPassword('Password123'));

      const customer: DbCustomer = {
        id: seedCustId,
        userId: seedUserId,
        phone: seedPhone,
        fullName: 'Chioma Okeke',
        email: seedEmail,
        creditsKobo: 4000000, // ₦40,000 baseline credit
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-10-15T10:00:00.000Z',
      };
      CustomerRepository.customers.set(seedCustId, customer);

      // Seed credit ledger entry for customer
      paymentRepository.creditCustomer(
        seedCustId,
        4000000,
        'Prior booking cancellation refund ATM-7K9W2P',
        'ATM-7K9W2P'
      );

      // Seed default companions for Chioma
      CustomerRepository.companions.push({
        id: 'comp-01',
        customerId: seedCustId,
        fullName: 'Emeka Okeke',
        gender: 'male',
        phone: '+2348029876543',
        isDefaultNextOfKin: true,
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z',
      });
      CustomerRepository.companions.push({
        id: 'comp-02',
        customerId: seedCustId,
        fullName: 'Adaobi Okeke',
        gender: 'female',
        phone: '+2348051239876',
        isDefaultNextOfKin: false,
        createdAt: '2026-09-05T12:00:00.000Z',
        updatedAt: '2026-09-05T12:00:00.000Z',
      });
    }
  }

  async getCustomerById(id: string): Promise<DbCustomer | null> {
    return CustomerRepository.customers.get(id) || null;
  }

  async getCustomerByUserId(userId: string): Promise<DbCustomer | null> {
    for (const customer of CustomerRepository.customers.values()) {
      if (customer.userId === userId) return customer;
    }
    return null;
  }

  async getCustomerByPhone(phone: string): Promise<DbCustomer | null> {
    const normalised = normalisePhone(phone);
    for (const customer of CustomerRepository.customers.values()) {
      if (customer.phone === normalised) return customer;
    }
    return null;
  }

  async getCustomerByEmail(email: string): Promise<DbCustomer | null> {
    const normEmail = email.trim().toLowerCase();
    for (const customer of CustomerRepository.customers.values()) {
      if (customer.email?.toLowerCase() === normEmail) return customer;
    }
    return null;
  }

  async getCustomerProfile(userIdOrCustomerId: string): Promise<CustomerProfile | null> {
    let customer = CustomerRepository.customers.get(userIdOrCustomerId) || null;
    let user: DbUser | null = null;

    if (!customer) {
      customer = await this.getCustomerByUserId(userIdOrCustomerId);
    }

    if (customer && customer.userId) {
      user = CustomerRepository.users.get(customer.userId) || null;
    } else if (userIdOrCustomerId) {
      user = CustomerRepository.users.get(userIdOrCustomerId) || null;
    }

    if (!customer && !user) return null;

    const twoFactor = user ? CustomerRepository.twoFactor.get(user.id) : undefined;
    const defaultKin = customer ? CustomerRepository.companions.find(
      (c) => c.customerId === customer.id && c.isDefaultNextOfKin
    ) : undefined;

    return {
      id: customer ? customer.id : user!.id,
      userId: user ? user.id : (customer ? customer.userId || customer.id : ''),
      fullName: customer ? customer.fullName : user!.name,
      email: customer?.email || user?.email || null,
      phone: customer ? customer.phone : '',
      creditsKobo: customer ? customer.creditsKobo : 0,
      emailVerified: user ? user.emailVerified : false,
      phoneVerified: true,
      twoFactorEnabled: !!twoFactor?.enabled,
      nextOfKinName: defaultKin?.fullName || null,
      nextOfKinPhone: defaultKin?.phone || null,
      createdAt: customer ? customer.createdAt : user!.createdAt,
      updatedAt: customer ? customer.updatedAt : user!.updatedAt,
    };
  }

  async register(input: RegisterInput): Promise<{ user: DbUser; customer: DbCustomer }> {
    const normalisedPhone = normalisePhone(input.phone);
    const normalisedEmail = input.email.trim().toLowerCase();

    // Check existing customer or user
    const existingCust = await this.getCustomerByPhone(normalisedPhone);
    if (existingCust && existingCust.userId) {
      throw new AppError(409, 'An account with this phone number already exists. Please sign in.');
    }

    for (const u of CustomerRepository.users.values()) {
      if (u.email.toLowerCase() === normalisedEmail) {
        throw new AppError(409, 'An account with this email address already exists. Please sign in.');
      }
    }

    const userId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
    const custId = existingCust ? existingCust.id : (crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`);
    const now = new Date().toISOString();

    const user: DbUser = {
      id: userId,
      name: input.fullName.trim(),
      email: normalisedEmail,
      emailVerified: false,
      image: null,
      role: 'customer',
      createdAt: now,
      updatedAt: now,
    };
    CustomerRepository.users.set(userId, user);
    CustomerRepository.userPasswords.set(userId, this.hashPassword(input.password));

    let customer: DbCustomer;
    if (existingCust) {
      existingCust.userId = userId;
      existingCust.fullName = input.fullName.trim();
      existingCust.email = normalisedEmail;
      existingCust.updatedAt = now;
      customer = existingCust;
    } else {
      customer = {
        id: custId,
        userId,
        phone: normalisedPhone,
        fullName: input.fullName.trim(),
        email: normalisedEmail,
        creditsKobo: 0,
        createdAt: now,
        updatedAt: now,
      };
      CustomerRepository.customers.set(custId, customer);
    }

    return { user, customer };
  }

  async updateProfile(customerId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer record not found');
    }

    const now = new Date().toISOString();
    if (input.fullName) {
      customer.fullName = input.fullName.trim();
    }
    if (input.email) {
      customer.email = input.email.trim().toLowerCase();
    }
    customer.updatedAt = now;

    if (customer.userId) {
      const user = CustomerRepository.users.get(customer.userId);
      if (user) {
        if (input.fullName) user.name = input.fullName.trim();
        if (input.email) user.email = input.email.trim().toLowerCase();
        user.updatedAt = now;
      }
    }

    if (input.nextOfKinName && input.nextOfKinPhone) {
      const existingKin = CustomerRepository.companions.find(
        (c) => c.customerId === customerId && c.isDefaultNextOfKin
      );
      if (existingKin) {
        existingKin.fullName = input.nextOfKinName.trim();
        existingKin.phone = normalisePhone(input.nextOfKinPhone);
        existingKin.updatedAt = now;
      } else if (CustomerRepository.companions.filter((c) => c.customerId === customerId).length < 5) {
        CustomerRepository.companions.push({
          id: `comp-${Date.now()}`,
          customerId,
          fullName: input.nextOfKinName.trim(),
          gender: 'other',
          phone: normalisePhone(input.nextOfKinPhone),
          isDefaultNextOfKin: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const profile = await this.getCustomerProfile(customerId);
    return profile!;
  }

  async authenticatePassword(identifier: string, password: string): Promise<{ user: DbUser; customer: DbCustomer }> {
    const trimmed = identifier.trim();
    let user: DbUser | null = null;
    let customer: DbCustomer | null = null;

    if (trimmed.includes('@')) {
      const normEmail = trimmed.toLowerCase();
      for (const u of CustomerRepository.users.values()) {
        if (u.email.toLowerCase() === normEmail) {
          user = u;
          break;
        }
      }
    } else {
      try {
        const normalisedPhone = normalisePhone(trimmed);
        customer = await this.getCustomerByPhone(normalisedPhone);
        if (customer && customer.userId) {
          user = CustomerRepository.users.get(customer.userId) || null;
        }
      } catch {
        // Not a phone number, search user name or direct match
      }
    }

    if (!user) {
      // Also check customer by email
      customer = await this.getCustomerByEmail(trimmed);
      if (customer && customer.userId) {
        user = CustomerRepository.users.get(customer.userId) || null;
      }
    }

    if (!user) {
      throw new AppError(401, 'Invalid email, phone number, or password');
    }

    const expectedHash = CustomerRepository.userPasswords.get(user.id);
    const providedHash = this.hashPassword(password);
    if (expectedHash !== providedHash) {
      throw new AppError(401, 'Invalid email, phone number, or password');
    }

    if (!customer) {
      customer = await this.getCustomerByUserId(user.id);
    }

    if (!customer) {
      customer = {
        id: `cust-${user.id}`,
        userId: user.id,
        phone: '+2348030000000',
        fullName: user.name,
        email: user.email,
        creditsKobo: 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      CustomerRepository.customers.set(customer.id, customer);
    }

    return { user, customer };
  }

  // --- Companion Passengers ---
  async getCompanions(customerId: string): Promise<CompanionPassenger[]> {
    return CustomerRepository.companions.filter((c) => c.customerId === customerId);
  }

  async addCompanion(customerId: string, input: CompanionPassengerInput): Promise<CompanionPassenger> {
    const existing = CustomerRepository.companions.filter((c) => c.customerId === customerId);
    if (existing.length >= 5) {
      throw new AppError(400, 'Maximum of 5 saved companions allowed per customer account');
    }

    const normalisedPhone = normalisePhone(input.phone);
    const now = new Date().toISOString();

    if (input.isDefaultNextOfKin) {
      // Unset previous default next of kin
      for (const comp of existing) {
        comp.isDefaultNextOfKin = false;
        comp.updatedAt = now;
      }
    }

    const companion: DbCompanionPassenger = {
      id: crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customerId,
      fullName: input.fullName.trim(),
      gender: input.gender,
      phone: normalisedPhone,
      isDefaultNextOfKin: !!input.isDefaultNextOfKin,
      createdAt: now,
      updatedAt: now,
    };
    CustomerRepository.companions.push(companion);
    return companion;
  }

  async deleteCompanion(customerId: string, companionId: string): Promise<boolean> {
    const index = CustomerRepository.companions.findIndex(
      (c) => c.customerId === customerId && c.id === companionId
    );
    if (index === -1) {
      throw new AppError(404, 'Companion passenger not found');
    }
    CustomerRepository.companions.splice(index, 1);
    return true;
  }

  // --- Credit Ledger ---
  async getCreditBalance(customerId: string): Promise<number> {
    const customer = await this.getCustomerById(customerId);
    if (customer) return customer.creditsKobo;
    return paymentRepository.getWalletBalance(customerId);
  }

  async getCreditLedger(customerId: string): Promise<DbCreditLedger[]> {
    const entries = await paymentRepository.getCreditLedgerEntries(customerId);
    // Sort newest first
    return entries.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addCredit(customerId: string, deltaKobo: number, reason: string, refBookingId?: string): Promise<DbCreditLedger> {
    assertIntegerKobo(deltaKobo);
    if (deltaKobo <= 0) {
      throw new AppError(400, 'Credit addition must be a positive integer kobo amount');
    }

    const customer = await this.getCustomerById(customerId);
    const entry = await paymentRepository.creditCustomer(customerId, deltaKobo, reason, refBookingId);
    if (customer) {
      customer.creditsKobo = entry.balanceAfterKobo;
      customer.updatedAt = new Date().toISOString();
    }
    return entry;
  }

  async deductCredit(customerId: string, deltaKobo: number, reason: string, refBookingId?: string): Promise<DbCreditLedger> {
    assertIntegerKobo(deltaKobo);
    if (deltaKobo <= 0) {
      throw new AppError(400, 'Credit deduction amount must be greater than zero');
    }

    const balance = await this.getCreditBalance(customerId);
    if (balance < deltaKobo) {
      throw new AppError(400, `Insufficient store credit balance: available ${balance} kobo, requested ${deltaKobo} kobo`);
    }

    const customer = await this.getCustomerById(customerId);
    const entry = await paymentRepository.creditCustomer(customerId, -deltaKobo, reason, refBookingId);
    if (customer) {
      customer.creditsKobo = entry.balanceAfterKobo;
      customer.updatedAt = new Date().toISOString();
    }
    return entry;
  }

  // --- Tokens & OTPs ---
  async createVerificationToken(
    identifier: string,
    type: DbAuthVerificationToken['type']
  ): Promise<{ token: string; code: string }> {
    const norm = identifier.includes('@') ? identifier.trim().toLowerCase() : normalisePhone(identifier);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.createHash('sha256').update(`${norm}:${code}:atm-otp-token`).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const entry: DbAuthVerificationToken = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}`,
      identifier: norm,
      token,
      type,
      expiresAt,
      usedAt: null,
      attempts: 0,
      createdAt: now.toISOString(),
    };
    CustomerRepository.tokens.push(entry);

    return { token, code };
  }

  async verifyToken(
    identifier: string,
    code: string,
    type: DbAuthVerificationToken['type']
  ): Promise<boolean> {
    const norm = identifier.includes('@') ? identifier.trim().toLowerCase() : normalisePhone(identifier);
    const now = new Date();

    // Look for active token matching identifier and type
    const matching = CustomerRepository.tokens
      .filter((t) => t.identifier === norm && t.type === type && t.usedAt === null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeToken = matching[0];
    if (!activeToken) {
      throw new AppError(400, 'No active verification code found or code already used. Please request a new code.');
    }

    if (new Date(activeToken.expiresAt).getTime() < now.getTime()) {
      throw new AppError(410, 'Verification code has expired. Please request a new code.');
    }

    if (activeToken.attempts >= 5) {
      throw new AppError(429, 'Too many failed verification attempts. Please request a new code.');
    }

    const expectedToken = crypto.createHash('sha256').update(`${norm}:${code}:atm-otp-token`).digest('hex');
    if (activeToken.token !== expectedToken && code !== '123456') { // 123456 dev escape hatch for testing
      activeToken.attempts += 1;
      throw new AppError(400, `Invalid verification code. ${5 - activeToken.attempts} attempts remaining.`);
    }

    activeToken.usedAt = now.toISOString();

    // If verifying email, update user.emailVerified
    if (type === 'email_verify') {
      for (const u of CustomerRepository.users.values()) {
        if (u.email.toLowerCase() === norm) {
          u.emailVerified = true;
          u.updatedAt = now.toISOString();
        }
      }
    }

    return true;
  }

  // --- Two-Factor Auth ---
  async getTwoFactorStatus(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
    const tf = CustomerRepository.twoFactor.get(userId);
    return {
      enabled: !!tf?.enabled,
      backupCodesRemaining: tf ? tf.backupCodesJson.length : 0,
    };
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; uri: string; backupCodes: string[] }> {
    const user = CustomerRepository.users.get(userId);
    if (!user) throw new AppError(404, 'User not found');

    const secret = crypto.randomBytes(20).toString('hex').slice(0, 32).toUpperCase();
    const backupCodes = Array.from({ length: 6 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
    );

    const uri = `otpauth://totp/ATM%20Nigeria:${encodeURIComponent(user.email)}?secret=${secret}&issuer=ATM%20Nigeria`;

    CustomerRepository.twoFactor.set(userId, {
      id: `2fa-${userId}`,
      userId,
      secret,
      enabled: true,
      backupCodesJson: backupCodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { secret, uri, backupCodes };
  }

  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    const tf = CustomerRepository.twoFactor.get(userId);
    if (!tf || !tf.enabled) return true;

    // Check backup codes
    const backupIndex = tf.backupCodesJson.indexOf(code.toUpperCase());
    if (backupIndex !== -1) {
      tf.backupCodesJson.splice(backupIndex, 1);
      tf.updatedAt = new Date().toISOString();
      return true;
    }

    // In dev / test, accept standard 6-digit TOTP format or 123456
    if (/^\d{6}$/.test(code)) {
      return true;
    }

    throw new AppError(400, 'Invalid two-factor authentication code or backup code');
  }

  async disableTwoFactor(userId: string): Promise<boolean> {
    const tf = CustomerRepository.twoFactor.get(userId);
    if (tf) {
      tf.enabled = false;
      tf.updatedAt = new Date().toISOString();
    }
    return true;
  }

  // --- Checkout Store Credit Redemption (AC-8) ---
  async applyCreditToBookingHold(
    customerId: string,
    bookingRef: string,
    holdToken: string,
    requestedCreditKobo: number
  ): Promise<ApplyCreditResult> {
    assertIntegerKobo(requestedCreditKobo);
    const booking = await bookingRepository.getHeldBooking(bookingRef, holdToken);
    if (!booking) {
      throw new AppError(404, 'Seat hold not found or has expired');
    }

    const availableCredit = await this.getCreditBalance(customerId);
    if (availableCredit < requestedCreditKobo) {
      throw new AppError(
        400,
        `Cannot apply ₦${(requestedCreditKobo / 100).toLocaleString()}: available credit is ₦${(availableCredit / 100).toLocaleString()}`
      );
    }

    // Amount applied cannot exceed booking total fare
    const appliedKobo = Math.min(requestedCreditKobo, booking.totalFareKobo);
    const remainingFareKobo = booking.totalFareKobo - appliedKobo;
    const isFullyPaid = remainingFareKobo === 0;

    if (isFullyPaid) {
      // Deduct immediately and confirm booking atomically
      await this.deductCredit(
        customerId,
        appliedKobo,
        `Applied to full booking checkout ${bookingRef}`,
        bookingRef
      );

      // Record payment providerRef as credit_balance
      const providerRef = `atm-cred-${bookingRef}-${Date.now()}`;
      await paymentRepository.recordPayment({
        id: `pay-${providerRef}`,
        bookingId: booking.id,
        parcelId: null,
        provider: 'credit_balance',
        providerRef,
        amountKobo: appliedKobo,
        currency: 'NGN',
        method: 'pay_at_terminal',
        status: 'successful',
        metadataJson: { paymentChannel: 'store_credit_full' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Confirm booking and generate HMAC tickets
      await paymentRepository.confirmBookingAndIssueTickets({
        bookingRef,
        providerRef,
        amountKobo: appliedKobo,
        method: 'pay_at_terminal',
      });
    } else {
      // Partial credit deduction held in escrow until Paystack payment completion
      await this.deductCredit(
        customerId,
        appliedKobo,
        `Partial store credit applied to ${bookingRef} (pending gateway remaining balance)`,
        bookingRef
      );
      CustomerRepository.heldEscrow.set(bookingRef, { customerId, amountKobo: appliedKobo });
    }

    const newBalance = await this.getCreditBalance(customerId);

    return {
      bookingRef,
      appliedKobo,
      remainingFareKobo,
      isFullyPaid,
      creditBalanceAfterKobo: newBalance,
    };
  }
}

export const customerRepository: ICustomerRepository = new CustomerRepository();
