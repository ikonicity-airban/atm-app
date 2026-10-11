import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional().default(''),
  BETTER_AUTH_SECRET: z.string().min(16).optional().default('development-secret-key-at-least-16-chars'),
  BETTER_AUTH_URL: z.string().url().optional().default('http://localhost:3000'),
  PAYSTACK_SECRET_KEY: z.string().optional().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default(''),
  TERMII_API_KEY: z.string().optional().default(''),
  TERMII_SENDER_ID: z.string().optional().default('ATMNigeria'),
  DATA_SOURCE: z.enum(['db', 'static']).default('static'),
  RESEND_API_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

export function getEnv(): Env {
  if (!validatedEnv) {
    const rawEnv = typeof process !== 'undefined' && process.env ? process.env : {};
    const parsed = envSchema.safeParse(rawEnv);
    if (!parsed.success) {
      console.error('Invalid environment variables:', parsed.error.format());
      throw new Error('Environment variable validation failed');
    }
    validatedEnv = parsed.data;
  }
  return validatedEnv;
}

export const env = getEnv();
