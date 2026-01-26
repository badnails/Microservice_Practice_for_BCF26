import { z } from 'zod';

// Create demand validation schema
export const createDemandSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  productId: z.string().uuid('Invalid product ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  minQuantity: z.number().int().min(0, 'Min quantity must be non-negative'),
  maxQuantity: z.number().int().min(0, 'Max quantity must be non-negative'),
}).refine(
  (data) => data.minQuantity <= data.maxQuantity,
  {
    message: 'Min quantity must be less than or equal to max quantity',
    path: ['minQuantity'],
  }
);

// Query params validation for filtering
export const demandQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  locationId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
}).optional();
