import { z } from 'zod';

// Create product validation schema
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  minTemperature: z.number().finite('Min temperature must be a valid number'),
  maxTemperature: z.number().finite('Max temperature must be a valid number'),
}).refine(
  (data) => data.minTemperature <= data.maxTemperature,
  {
    message: 'Min temperature must be less than or equal to max temperature',
    path: ['minTemperature'],
  }
);
