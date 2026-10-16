import { z } from 'zod';
import { normalisePhone } from '../utils/phone.ts';

export const createCustomerInquirySchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().transform(normalisePhone),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  bookingRef: z.string().trim().toUpperCase().optional().or(z.literal('')),
  waybillCode: z.string().trim().toUpperCase().optional().or(z.literal('')),
  category: z.enum(['booking', 'luggage', 'refund', 'driver_conduct', 'delay', 'general'], {
    errorMap: () => ({ message: 'Please select a valid inquiry category' }),
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  subject: z.string().trim().min(4, 'Subject title must be at least 4 characters'),
  message: z.string().trim().min(10, 'Inquiry message must be at least 10 characters'),
});

export type CreateCustomerInquiryInput = z.infer<typeof createCustomerInquirySchema>;

export const resolveInquirySchema = z.object({
  inquiryId: z.string().min(1, 'Inquiry identifier is required'),
  status: z.enum(['open', 'in_progress', 'resolved']),
  resolutionNotes: z.string().trim().min(3, 'Resolution summary or notes are required'),
  staffId: z.string().min(1, 'Handling staff identifier is required'),
  staffName: z.string().trim().min(2, 'Handling staff name is required'),
});

export type ResolveInquiryInput = z.infer<typeof resolveInquirySchema>;
