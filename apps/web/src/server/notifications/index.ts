/**
 * NotificationProvider Interface & Implementations
 * Allows swapping between Termii, Resend, and Stub Providers
 */

export interface SendMessageOptions {
  recipient: string; // phone or email
  message: string;
  subject?: string;
  channel: 'sms' | 'whatsapp' | 'email';
}

export interface SendResult {
  success: boolean;
  messageId: string;
  provider: string;
  timestamp: string;
}

export interface NotificationProvider {
  name: string;
  sendSms(toPhone: string, message: string): Promise<SendResult>;
  sendWhatsApp(toPhone: string, message: string): Promise<SendResult>;
  sendEmail(toEmail: string, subject: string, htmlBody: string): Promise<SendResult>;
}

/**
 * Termii Provider implementation stub
 */
export class TermiiNotificationProvider implements NotificationProvider {
  public readonly name = 'termii';

  constructor(
    private readonly apiKey: string,
    private readonly senderId: string = 'ATMNigeria'
  ) {}

  async sendSms(toPhone: string, message: string): Promise<SendResult> {
    // Stub implementation for Phase 0
    console.log(`[Termii SMS to ${toPhone} via ${this.senderId}]: ${message}`);
    return {
      success: true,
      messageId: `termii-sms-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }

  async sendWhatsApp(toPhone: string, message: string): Promise<SendResult> {
    // Stub implementation for Phase 0
    console.log(`[Termii WhatsApp to ${toPhone}]: ${message}`);
    return {
      success: true,
      messageId: `termii-wa-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }

  async sendEmail(_toEmail: string, _subject: string, _htmlBody: string): Promise<SendResult> {
    throw new Error('Termii provider does not support email. Use ResendNotificationProvider instead.');
  }
}

/**
 * Resend Provider implementation stub
 */
export class ResendNotificationProvider implements NotificationProvider {
  public readonly name = 'resend';

  constructor(private readonly apiKey: string) {}

  async sendSms(_toPhone: string, _message: string): Promise<SendResult> {
    throw new Error('Resend provider does not support SMS. Use TermiiNotificationProvider instead.');
  }

  async sendWhatsApp(_toPhone: string, _message: string): Promise<SendResult> {
    throw new Error('Resend provider does not support WhatsApp. Use TermiiNotificationProvider instead.');
  }

  async sendEmail(toEmail: string, subject: string, htmlBody: string): Promise<SendResult> {
    // Stub implementation for Phase 0
    console.log(`[Resend Email to ${toEmail} | Subject: ${subject}]: (length: ${htmlBody.length} chars)`);
    return {
      success: true,
      messageId: `resend-email-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Stub / Mock Provider for local development & testing
 */
export class StubNotificationProvider implements NotificationProvider {
  public readonly name = 'stub';

  async sendSms(toPhone: string, message: string): Promise<SendResult> {
    console.log(`[Stub SMS -> ${toPhone}]: ${message}`);
    return {
      success: true,
      messageId: `stub-sms-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }

  async sendWhatsApp(toPhone: string, message: string): Promise<SendResult> {
    console.log(`[Stub WhatsApp -> ${toPhone}]: ${message}`);
    return {
      success: true,
      messageId: `stub-wa-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }

  async sendEmail(toEmail: string, subject: string, htmlBody: string): Promise<SendResult> {
    console.log(`[Stub Email -> ${toEmail} (${subject})]: ${htmlBody}`);
    return {
      success: true,
      messageId: `stub-email-${Date.now()}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}
