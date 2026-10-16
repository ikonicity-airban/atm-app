import { z } from 'zod';
import { normalisePhone } from '../utils/phone.ts';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 characters')
    .transform((val) => normalisePhone(val)),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.confirmPassword !== undefined && data.confirmPassword !== '') {
      return data.password === data.confirmPassword;
    }
    return true;
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Please enter your email or Nigerian phone number'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const phoneOtpSendSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Valid Nigerian phone number required')
    .transform((val) => normalisePhone(val)),
  intent: z.enum(['register', 'login', 'verify']).default('verify'),
});

export type PhoneOtpSendInput = z.infer<typeof phoneOtpSendSchema>;

export const phoneOtpVerifySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Valid Nigerian phone number required')
    .transform((val) => normalisePhone(val)),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits'),
});

export type PhoneOtpVerifyInput = z.infer<typeof phoneOtpVerifySchema>;

export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Two-factor verification code must be exactly 6 digits'),
  challengeToken: z.string().trim().min(1, 'Challenge token required'),
  rememberDevice: z.boolean().optional().default(false),
});

export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;

export const twoFactorSetupSchema = z.object({
  enabled: z.boolean(),
  verificationCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be 6 digits')
    .optional(),
});

export type TwoFactorSetupInput = z.infer<typeof twoFactorSetupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.confirmPassword !== undefined && data.confirmPassword !== '') {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
