import { z } from 'zod';

// Location validation schemas
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['PRODUCER', 'WAREHOUSE', 'RETAILER', 'HOSPITAL'], {
    message: 'Type must be one of: PRODUCER, WAREHOUSE, RETAILER, HOSPITAL',
  }),
  city: z.string().min(1, 'City is required'),
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  minTemperature: z.number(),
  maxTemperature: z.number(),
}).refine((data) => data.minTemperature <= data.maxTemperature, {
  message: 'minTemperature must be less than or equal to maxTemperature',
});

// Storage Unit validation schemas
export const createStorageUnitSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  minTemperature: z.number(),
  maxTemperature: z.number(),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
}).refine((data) => data.minTemperature <= data.maxTemperature, {
  message: 'minTemperature must be less than or equal to maxTemperature',
});

// Route validation schemas
export const createRouteSchema = z.object({
  fromLocationId: z.string().uuid('Invalid from location ID format'),
  toLocationId: z.string().uuid('Invalid to location ID format'),
  capacity: z.number().int().nonnegative('Capacity must be non-negative'),
  minShipment: z.number().int().nonnegative('minShipment must be non-negative'),
}).refine((data) => data.fromLocationId !== data.toLocationId, {
  message: 'fromLocationId and toLocationId must be different',
});

// Demand validation schemas
export const createDemandSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  productId: z.string().uuid('Invalid product ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  minQuantity: z.number().int().nonnegative('minQuantity must be non-negative'),
  maxQuantity: z.number().int().nonnegative('maxQuantity must be non-negative'),
}).refine((data) => data.minQuantity <= data.maxQuantity, {
  message: 'minQuantity must be less than or equal to maxQuantity',
});

// Validation request schemas
export const validateTemperatureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const validateNetworkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
