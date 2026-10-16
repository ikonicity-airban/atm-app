import { z } from 'zod';

export const createCorridorPricingRuleSchema = z.object({
  routeId: z.string().min(1, 'Route identifier is required'),
  ruleType: z.enum(['flat_override', 'percentage_multiplier'], {
    errorMap: () => ({ message: 'Rule type must be either flat_override or percentage_multiplier' }),
  }),
  overrideFareKobo: z.number().int().positive('Override fare must be positive integer kobo').optional(),
  multiplierPercentage: z.number().int().min(50, 'Multiplier must be at least 50%').max(300, 'Multiplier cannot exceed 300%').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  reason: z.string().trim().min(3, 'Adjustment justification reason is required'),
  staffId: z.string().min(1, 'Staff identifier is required'),
}).refine(
  (data) => {
    if (data.ruleType === 'flat_override') {
      return typeof data.overrideFareKobo === 'number' && data.overrideFareKobo > 0;
    }
    if (data.ruleType === 'percentage_multiplier') {
      return typeof data.multiplierPercentage === 'number' && data.multiplierPercentage > 0;
    }
    return false;
  },
  {
    message: 'Either overrideFareKobo or multiplierPercentage must be provided matching the rule type',
  }
).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Start date cannot be after end date',
    path: ['endDate'],
  }
);

export type CreateCorridorPricingRuleInput = z.infer<typeof createCorridorPricingRuleSchema>;

export const togglePricingRuleSchema = z.object({
  ruleId: z.string().min(1, 'Rule identifier is required'),
  isActive: z.boolean(),
  staffId: z.string().min(1, 'Staff identifier is required'),
});

export type TogglePricingRuleInput = z.infer<typeof togglePricingRuleSchema>;
