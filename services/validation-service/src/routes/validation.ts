import { Hono } from 'hono';
import { z } from 'zod';
import { getProducts } from '../clients/product-client';
import { getStorageUnits } from '../clients/warehouse-client';
import { getDemands } from '../clients/demand-client';
import { getRoutes } from '../clients/routing-client';

const validation = new Hono();

// Validation request schema
const validateRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Temperature validation endpoint
validation.post('/temps/validate', async (c) => {
  try {
    const body = await c.req.json();
    
    const validationResult = validateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid request', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { date } = validationResult.data;

    // Fetch data from multiple services in parallel
    const [products, storageUnits, demands] = await Promise.all([
      getProducts(),
      getStorageUnits(),
      getDemands(date)
    ]);

    const issues: string[] = [];

    // Validate temperature compatibility for each demand
    for (const demand of demands) {
      const product = products.find(p => p.id === demand.productId);
      const storage = storageUnits.find(s => s.locationId === demand.locationId);

      if (!product) {
        issues.push(`Product ${demand.productId} not found for demand ${demand.id}`);
        continue;
      }

      if (!storage) {
        issues.push(`No storage unit found at location ${demand.locationId} for demand ${demand.id}`);
        continue;
      }

      // Check if product temperature range is compatible with storage unit
      if (product.minTemperature < storage.minTemperature || 
          product.maxTemperature > storage.maxTemperature) {
        issues.push(
          `Temperature incompatibility: Product "${product.name}" ` +
          `(${product.minTemperature}°C to ${product.maxTemperature}°C) ` +
          `cannot be stored in unit at location ${demand.locationId} ` +
          `(${storage.minTemperature}°C to ${storage.maxTemperature}°C)`
        );
      }
    }

    return c.json({
      valid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      date,
      demandsChecked: demands.length
    }, 200);

  } catch (error: any) {
    console.error('Error validating temperatures:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Network validation endpoint
validation.post('/network/validate', async (c) => {
  try {
    const body = await c.req.json();
    
    const validationResult = validateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid request', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { date } = validationResult.data;

    // Fetch data from multiple services in parallel
    const [routes, demands] = await Promise.all([
      getRoutes(),
      getDemands(date)
    ]);

    const issues: string[] = [];

    // Group demands by route (fromLocation -> toLocation)
    const routeCapacityMap = new Map<string, number>();
    
    // Initialize route capacities
    for (const route of routes) {
      const key = `${route.fromLocationId}->${route.toLocationId}`;
      routeCapacityMap.set(key, route.capacity);
    }

    // Check for capacity violations
    const demandsByRoute = new Map<string, number>();
    for (const demand of demands) {
      // For simplicity, we're checking if total demand exceeds route capacity
      // In reality, this would need more complex flow optimization
      for (const route of routes) {
        if (route.toLocationId === demand.locationId) {
          const key = `${route.fromLocationId}->${route.toLocationId}`;
          const currentDemand = demandsByRoute.get(key) || 0;
          demandsByRoute.set(key, currentDemand + demand.maxQuantity);
        }
      }
    }

    // Validate capacities
    for (const [routeKey, totalDemand] of demandsByRoute.entries()) {
      const capacity = routeCapacityMap.get(routeKey) || 0;
      if (totalDemand > capacity) {
        issues.push(`MAX_CAPACITY_VIOLATION on route ${routeKey}: demand ${totalDemand} exceeds capacity ${capacity}`);
      }
    }

    // Check minimum shipment constraints
    for (const route of routes) {
      const key = `${route.fromLocationId}->${route.toLocationId}`;
      const totalDemand = demandsByRoute.get(key) || 0;
      if (totalDemand > 0 && totalDemand < route.minShipment) {
        issues.push(`MIN_CAPACITY_VIOLATION on route ${key}: demand ${totalDemand} below minimum ${route.minShipment}`);
      }
    }

    return c.json({
      feasible: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      date,
      routesChecked: routes.length,
      demandsAnalyzed: demands.length
    }, 200);

  } catch (error: any) {
    console.error('Error validating network:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default validation;
