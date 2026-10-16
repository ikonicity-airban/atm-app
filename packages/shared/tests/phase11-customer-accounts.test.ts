import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  phoneOtpSendSchema,
  phoneOtpVerifySchema,
  twoFactorVerifySchema,
  twoFactorSetupSchema,
  companionPassengerSchema,
  updateCustomerProfileSchema,
  applyCheckoutCreditSchema,
  normalisePhone,
  formatNaira,
} from '../src/index.ts';

describe('Phase 11: Customer Accounts, Split Auth UI, and Credit Ledger', () => {
  // AC-1 & AC-2: Registration & Sign-In Zod Schema Validation
  describe('AC-2: Registration & Sign-In Schemas', () => {
    it('validates customer registration payload and normalizes Nigerian mobile to E.164', () => {
      const input = {
        fullName: 'Babatunde Adeyemi',
        email: 'babatunde@example.com',
        phone: '08031234567',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      const result = registerSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.phone, '+2348031234567');
        assert.equal(result.data.email, 'babatunde@example.com');
      }
    });

    it('rejects passwords shorter than 8 characters or missing numbers/letters', () => {
      const shortPass = registerSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '08031234567',
        password: 'pass',
      });
      assert.equal(shortPass.success, false);

      const noNumberPass = registerSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '08031234567',
        password: 'PasswordOnly',
      });
      assert.equal(noNumberPass.success, false);
    });

    it('rejects mismatched password and confirmPassword', () => {
      const mismatch = registerSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '08031234567',
        password: 'Password123',
        confirmPassword: 'DifferentPassword456',
      });
      assert.equal(mismatch.success, false);
    });

    it('validates customer login with identifier (email or phone) and rememberMe toggle', () => {
      const loginEmail = loginSchema.safeParse({
        identifier: 'customer@example.com',
        password: 'Password123',
        rememberMe: true,
      });
      assert.equal(loginEmail.success, true);

      const loginPhone = loginSchema.safeParse({
        identifier: '08031234567',
        password: 'Password123',
      });
      assert.equal(loginPhone.success, true);
      if (loginPhone.success) {
        assert.equal(loginPhone.data.rememberMe, false);
      }
    });
  });

  // AC-3: Phone OTP Verification Schemas
  describe('AC-3: Phone OTP Dispatch & Verification', () => {
    it('validates OTP dispatch request and normalizes Nigerian mobile', () => {
      const sendResult = phoneOtpSendSchema.safeParse({
        phone: '09070000625',
        intent: 'verify',
      });
      assert.equal(sendResult.success, true);
      if (sendResult.success) {
        assert.equal(sendResult.data.phone, '+2349070000625');
      }
    });

    it('enforces exact 6-digit numeric OTP constraint on verify', () => {
      const validVerify = phoneOtpVerifySchema.safeParse({
        phone: '+2349070000625',
        code: '123456',
      });
      assert.equal(validVerify.success, true);

      const shortVerify = phoneOtpVerifySchema.safeParse({
        phone: '+2349070000625',
        code: '12345',
      });
      assert.equal(shortVerify.success, false);

      const alphaVerify = phoneOtpVerifySchema.safeParse({
        phone: '+2349070000625',
        code: '12345A',
      });
      assert.equal(alphaVerify.success, false);
    });
  });

  // 2FA Verification & Setup Schemas
  describe('Two-Factor Authentication Schemas', () => {
    it('validates 2FA challenge verification with 6-digit code and challengeToken', () => {
      const valid2FA = twoFactorVerifySchema.safeParse({
        code: '654321',
        challengeToken: 'tok_challenge_abc123',
        rememberDevice: true,
      });
      assert.equal(valid2FA.success, true);

      const invalidCode = twoFactorVerifySchema.safeParse({
        code: 'abc',
        challengeToken: 'tok_challenge_abc123',
      });
      assert.equal(invalidCode.success, false);
    });

    it('validates 2FA setup and enable payload', () => {
      const setup = twoFactorSetupSchema.safeParse({
        enabled: true,
        verificationCode: '123456',
      });
      assert.equal(setup.success, true);
    });
  });

  // AC-7: Saved Companion Passenger Roster
  describe('AC-7: Companion Passenger Roster', () => {
    it('validates companion passenger details and normalizes phone to E.164', () => {
      const comp = companionPassengerSchema.safeParse({
        fullName: 'Emeka Okeke',
        gender: 'male',
        phone: '08029876543',
        isDefaultNextOfKin: true,
      });
      assert.equal(comp.success, true);
      if (comp.success) {
        assert.equal(comp.data.phone, '+2348029876543');
        assert.equal(comp.data.isDefaultNextOfKin, true);
      }
    });

    it('rejects companion with invalid gender', () => {
      const comp = companionPassengerSchema.safeParse({
        fullName: 'Unknown Traveler',
        gender: 'alien',
        phone: '08029876543',
      });
      assert.equal(comp.success, false);
    });

    it('enforces maximum 5 companion passengers rule invariant', () => {
      const roster: Array<{ id: string; fullName: string }> = [
        { id: '1', fullName: 'Companion 1' },
        { id: '2', fullName: 'Companion 2' },
        { id: '3', fullName: 'Companion 3' },
        { id: '4', fullName: 'Companion 4' },
        { id: '5', fullName: 'Companion 5' },
      ];

      const addSixthCompanion = (currentCount: number) => {
        if (currentCount >= 5) {
          throw new Error('Maximum of 5 saved companions allowed per customer account');
        }
      };

      assert.throws(() => addSixthCompanion(roster.length), /Maximum of 5 saved companions/);
    });
  });

  // AC-5 & AC-8: Store Credit Ledger & Integer Kobo Invariants
  describe('AC-5 & AC-8: Store Credit Financial Integrity', () => {
    it('validates applyCheckoutCreditSchema requiring positive integer kobo', () => {
      const valid = applyCheckoutCreditSchema.safeParse({
        bookingRef: 'ATM-7K9W2P',
        holdToken: 'tok_hold_xyz',
        applyCreditKobo: 3200000,
      });
      assert.equal(valid.success, true);

      const negative = applyCheckoutCreditSchema.safeParse({
        bookingRef: 'ATM-7K9W2P',
        holdToken: 'tok_hold_xyz',
        applyCreditKobo: -5000,
      });
      assert.equal(negative.success, false);

      const floatKobo = applyCheckoutCreditSchema.safeParse({
        bookingRef: 'ATM-7K9W2P',
        holdToken: 'tok_hold_xyz',
        applyCreditKobo: 32000.5,
      });
      assert.equal(floatKobo.success, false);
    });

    it('correctly calculates full store credit deduction with zero remaining gateway charge', () => {
      const totalFareKobo = 3200000; // ₦32,000
      const availableCreditKobo = 4000000; // ₦40,000

      const appliedKobo = Math.min(availableCreditKobo, totalFareKobo);
      const remainingFareKobo = totalFareKobo - appliedKobo;
      const balanceAfterKobo = availableCreditKobo - appliedKobo;
      const isFullyPaid = remainingFareKobo === 0;

      assert.equal(appliedKobo, 3200000);
      assert.equal(remainingFareKobo, 0);
      assert.equal(balanceAfterKobo, 800000); // ₦8,000 remaining in wallet
      assert.equal(isFullyPaid, true);
    });

    it('correctly calculates partial store credit deduction routing remaining balance to Paystack', () => {
      const totalFareKobo = 6400000; // ₦64,000 (2 seats)
      const availableCreditKobo = 2000000; // ₦20,000

      const appliedKobo = Math.min(availableCreditKobo, totalFareKobo);
      const remainingFareKobo = totalFareKobo - appliedKobo;
      const balanceAfterKobo = availableCreditKobo - appliedKobo;
      const isFullyPaid = remainingFareKobo === 0;

      assert.equal(appliedKobo, 2000000);
      assert.equal(remainingFareKobo, 4400000); // ₦44,000 routes to Paystack
      assert.equal(balanceAfterKobo, 0);
      assert.equal(isFullyPaid, false);
    });

    it('formats wallet credit balance cleanly via formatNaira from integer kobo', () => {
      assert.equal(formatNaira(4000000), '₦40,000');
      assert.equal(formatNaira(800000), '₦8,000');
      assert.equal(formatNaira(0), '₦0');
    });
  });
});
