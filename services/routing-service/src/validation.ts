import { z } from 'zod';

// Create route validation schema
export const createRouteSchema = z.object({
  fromLocationId: z.string().uuid('Invalid from location ID format'),
  toLocationId: z.string().uuid('Invalid to location ID format'),
  capacity: z.number().int().min(0, 'Capacity must be non-negative'),
  minShipment: z.number().int().min(0, 'Min shipment must be non-negative'),
}).refine(
  (data) => data.fromLocationId !== data.toLocationId,
  {
    message: 'From and to locations must be different',
    path: ['toLocationId'],
  }
);

// Query params validation for filtering
export const routeQuerySchema = z.object({
  from: z.string().uuid().optional(),
  to: z.string().uuid().optional(),
}).optional();
