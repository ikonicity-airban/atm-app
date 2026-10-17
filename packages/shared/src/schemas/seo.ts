import { z } from 'zod';

export const corridorParamSchema = z.object({
  corridor: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z]+-[a-z]+$/, 'Corridor slug must be formatted as [origin]-[destination] (e.g. enugu-abuja)'),
});

export type CorridorParamInput = z.infer<typeof corridorParamSchema>;
