/**
 * Notification Service
 * Dispatches automated SMS confirmation via Termii gateway with development stub logger fallback.
 */

import { formatTicketConfirmationSms, normalisePhone } from '@atm/shared';
import type { DbNotification } from '@atm/db';
import { env } from '../../lib/env.ts';

export interface SendSmsParams {
  recipientPhone: string;
  bookingRef: string;
  corridor: string;
  departureTimeWAT: string;
  seats: number[];
  passengerCount: number;
}

export interface SendCancellationSmsParams {
  recipientPhone: string;
  bookingRef: string;
  cancelledSeats: number[];
  feeKobo: number;
  refundKobo: number;
  disbursementMethod: 'atm_credit' | 'paystack_reversal';
}

export interface SendSmsResult {
  success: boolean;
  provider: 'termii' | 'stub';
  messageId: string;
  body: string;
  error?: string;
}

export class NotificationService {
  private static notificationHistory: DbNotification[] = [];

  constructor(
    private readonly apiKey: string = env.TERMII_API_KEY || '',
    private readonly senderId: string = env.TERMII_SENDER_ID || 'ATMNigeria'
  ) {}

  /**
   * Dispatches passenger ticket SMS confirmation
   */
  async sendBookingConfirmation(params: SendSmsParams): Promise<SendSmsResult> {
    const normalised = normalisePhone(params.recipientPhone);
    const body = formatTicketConfirmationSms({
      bookingRef: params.bookingRef,
      corridor: params.corridor,
      departureTimeWAT: params.departureTimeWAT,
      seats: params.seats,
      passengerCount: params.passengerCount,
    });

    // If live Termii API key is provided, invoke Termii HTTP endpoint
    if (this.apiKey && this.apiKey.length > 5) {
      try {
        const response = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: normalised.replace(/^\+/, ''), // Termii accepts 234... without leading +
            from: this.senderId,
            sms: body,
            type: 'plain',
            channel: 'generic',
            api_key: this.apiKey,
          }),
        });

        const data = await response.json();
        const msgId = data?.message_id || `termii-${Date.now()}`;

        const notificationRecord: DbNotification = {
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
          channel: 'sms',
          recipient: normalised,
          subject: 'ATM Ticket Confirmation',
          body,
          provider: 'termii',
          providerMessageId: msgId,
          status: response.ok ? 'sent' : 'failed',
          createdAt: new Date().toISOString(),
        };

        NotificationService.notificationHistory.push(notificationRecord);

        return {
          success: response.ok,
          provider: 'termii',
          messageId: msgId,
          body,
          error: !response.ok ? (data?.message || 'Termii dispatch failed') : undefined,
        };
      } catch (err) {
        console.warn('[NotificationService] Termii API error, logging fallback stub:', err);
      }
    }

    // Local stub fallback
    const stubMessageId = `stub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[SMS Stub to ${normalised} via ${this.senderId}]: "${body}"`);

    const stubRecord: DbNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      channel: 'sms',
      recipient: normalised,
      subject: 'ATM Ticket Confirmation',
      body,
      provider: 'stub',
      providerMessageId: stubMessageId,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    NotificationService.notificationHistory.push(stubRecord);

    return {
      success: true,
      provider: 'stub',
      messageId: stubMessageId,
      body,
    };
  }

  /**
   * Dispatches passenger ticket cancellation confirmation SMS
   */
  async sendCancellationConfirmation(params: SendCancellationSmsParams): Promise<SendSmsResult> {
    const normalised = normalisePhone(params.recipientPhone);
    const { formatCancellationConfirmationSms } = await import('@atm/shared');
    const body = formatCancellationConfirmationSms({
      bookingRef: params.bookingRef,
      cancelledSeats: params.cancelledSeats,
      feeKobo: params.feeKobo,
      refundKobo: params.refundKobo,
      disbursementMethod: params.disbursementMethod,
    });

    if (this.apiKey && this.apiKey.length > 5) {
      try {
        const response = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: normalised.replace(/^\+/, ''),
            from: this.senderId,
            sms: body,
            type: 'plain',
            channel: 'generic',
            api_key: this.apiKey,
          }),
        });

        const data = await response.json();
        const msgId = data?.message_id || `termii-cancel-${Date.now()}`;

        const notificationRecord: DbNotification = {
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
          channel: 'sms',
          recipient: normalised,
          subject: 'ATM Ticket Cancellation Confirmation',
          body,
          provider: 'termii',
          providerMessageId: msgId,
          status: response.ok ? 'sent' : 'failed',
          createdAt: new Date().toISOString(),
        };

        NotificationService.notificationHistory.push(notificationRecord);

        return {
          success: response.ok,
          provider: 'termii',
          messageId: msgId,
          body,
          error: !response.ok ? (data?.message || 'Termii dispatch failed') : undefined,
        };
      } catch (err) {
        console.warn('[NotificationService] Termii API error on cancellation SMS:', err);
      }
    }

    const stubMessageId = `stub-cancel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[SMS Stub to ${normalised} via ${this.senderId}]: "${body}"`);

    const stubRecord: DbNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      channel: 'sms',
      recipient: normalised,
      subject: 'ATM Ticket Cancellation Confirmation',
      body,
      provider: 'stub',
      providerMessageId: stubMessageId,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    NotificationService.notificationHistory.push(stubRecord);

    return {
      success: true,
      provider: 'stub',
      messageId: stubMessageId,
      body,
    };
  }

  getHistory(): DbNotification[] {
    return [...NotificationService.notificationHistory];
  }
}

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}
