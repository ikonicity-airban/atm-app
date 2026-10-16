import { z } from 'zod';

export const logMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle identifier is required'),
  serviceType: z.enum([
    'routine_oil_filter',
    'brake_pads',
    'tire_replacement',
    'ac_servicing',
    'suspension_overhaul',
    'emergency_repair',
  ], {
    errorMap: () => ({ message: 'Please select a valid vehicle maintenance service category' }),
  }),
  odometerKm: z.number().int().positive('Odometer reading must be a positive integer in kilometers'),
  costKobo: z.number().int().nonnegative('Service cost must be an integer kobo amount'),
  workshopName: z.string().trim().min(2, 'Workshop or service center name is required'),
  technicianName: z.string().trim().min(2, 'Technician or mechanic name is required'),
  notes: z.string().trim().min(5, 'Please provide service inspection notes'),
  staffId: z.string().min(1, 'Authorizing staff identifier is required'),
});

export type LogMaintenanceInput = z.infer<typeof logMaintenanceSchema>;

export const updateVehicleStatusSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle identifier is required'),
  status: z.enum(['active', 'service_due', 'in_maintenance', 'grounded']),
  reason: z.string().trim().min(3, 'Status update reason is required'),
  staffId: z.string().min(1, 'Authorizing staff identifier is required'),
});

export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>;
