/**
 * PaymentProvider Interface & Paystack Implementation
 * Idempotent, webhook-driven, integer KOBO
 */

export interface InitializePaymentParams {
  email: string;
  amountKobo: number; // Integer kobo
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: Array<'card' | 'bank' | 'ussd' | 'mobile_money' | 'bank_transfer'>;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status: 'successful' | 'failed' | 'pending';
  amountKobo: number;
  reference: string;
  channel: string;
  gatewayResponse: string;
  paidAt?: string;
}

export interface PaymentProvider {
  name: string;
  initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(signature: string, rawBody: string): boolean;
}

/**
 * Paystack Provider implementation stub
 */
export class PaystackPaymentProvider implements PaymentProvider {
  public readonly name = 'paystack';

  constructor(
    private readonly secretKey: string,
    private readonly publicKey?: string
  ) {}

  async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    console.log(`[Paystack Initialize]: ${params.reference} for ${params.amountKobo} kobo (${params.email})`);
    return {
      authorizationUrl: `https://checkout.paystack.com/stub-${params.reference}`,
      accessCode: `access-${params.reference}`,
      reference: params.reference,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    console.log(`[Paystack Verify]: ${reference}`);
    return {
      verified: true,
      status: 'successful',
      amountKobo: 3200000,
      reference,
      channel: 'card',
      gatewayResponse: 'Approved',
      paidAt: new Date().toISOString(),
    };
  }

  verifyWebhookSignature(signature: string, _rawBody: string): boolean {
    // Stub signature verification for Phase 0
    return Boolean(signature && signature.length > 10);
  }
}

/**
 * Stub Payment Provider for local dev & offline testing
 */
export class StubPaymentProvider implements PaymentProvider {
  public readonly name = 'stub';

  async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    return {
      authorizationUrl: `/book/mock-pay?ref=${params.reference}`,
      accessCode: `mock-acc-${params.reference}`,
      reference: params.reference,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    return {
      verified: true,
      status: 'successful',
      amountKobo: 3200000,
      reference,
      channel: 'card',
      gatewayResponse: 'Mock Success',
      paidAt: new Date().toISOString(),
    };
  }

  verifyWebhookSignature(_signature: string, _rawBody: string): boolean {
    return true;
  }
}
