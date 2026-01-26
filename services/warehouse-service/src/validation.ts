import { z } from 'zod';

// Create storage unit validation schema
export const createStorageUnitSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  minTemperature: z.number().finite('Min temperature must be a valid number'),
  maxTemperature: z.number().finite('Max temperature must be a valid number'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
}).refine(
  (data) => data.minTemperature <= data.maxTemperature,
  {
    message: 'Min temperature must be less than or equal to max temperature',
    path: ['minTemperature'],
  }
);

// Query params validation for filtering
export const storageUnitQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
}).optional();
