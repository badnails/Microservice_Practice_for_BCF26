import { z } from 'zod';

// Location type enum validation
export const locationTypeSchema = z.enum(['PRODUCER', 'WAREHOUSE', 'RETAILER', 'HOSPITAL']);

// Create location validation schema
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  type: locationTypeSchema,
  city: z.string().min(1, 'City is required').max(255, 'City too long'),
});

// Query params validation for filtering
export const locationQuerySchema = z.object({
  type: locationTypeSchema.optional(),
  city: z.string().optional(),
}).optional();
