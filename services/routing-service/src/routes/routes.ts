import { Hono } from 'hono';
import sql from '../db';
import { Route } from '../types';
import { createRouteSchema, routeQuerySchema } from '../validation';
import { validateLocation } from '../clients/location-client';

const routes = new Hono();

// Create a new route
routes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validationResult = createRouteSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Missing or invalid fields', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { fromLocationId, toLocationId, capacity, minShipment } = validationResult.data;

    // Validate both locations exist
    const [fromValidation, toValidation] = await Promise.all([
      validateLocation(fromLocationId),
      validateLocation(toLocationId)
    ]);

    if (!fromValidation.valid) {
      return c.json({ 
        error: `From location: ${fromValidation.error}` 
      }, 400);
    }

    if (!toValidation.valid) {
      return c.json({ 
        error: `To location: ${toValidation.error}` 
      }, 400);
    }

    // Insert into database
    const [route] = await sql<Route[]>`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${fromLocationId}, ${toLocationId}, ${capacity}, ${minShipment})
      RETURNING id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at
    `;

    // Parse numeric fields from strings
    const parsedRoute = {
      ...route,
      capacity: Number(route.capacity),
      minShipment: Number(route.minShipment)
    };

    return c.json(parsedRoute, 201);
  } catch (error: any) {
    console.error('Error creating route:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// List all routes (with optional filtering)
routes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const validationResult = routeQuerySchema.safeParse(query);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid query parameters', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { from, to } = validationResult.data || {};

    let routesList: Route[];

    if (from && to) {
      routesList = await sql<Route[]>`
        SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at 
        FROM routes 
        WHERE "fromLocationId" = ${from} AND "toLocationId" = ${to}
        ORDER BY created_at DESC
      `;
    } else if (from) {
      routesList = await sql<Route[]>`
        SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at 
        FROM routes 
        WHERE "fromLocationId" = ${from}
        ORDER BY created_at DESC
      `;
    } else if (to) {
      routesList = await sql<Route[]>`
        SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at 
        FROM routes 
        WHERE "toLocationId" = ${to}
        ORDER BY created_at DESC
      `;
    } else {
      routesList = await sql<Route[]>`
        SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at 
        FROM routes 
        ORDER BY created_at DESC
      `;
    }

    // Parse numeric fields from strings
    const parsedRoutes = routesList.map(r => ({
      ...r,
      capacity: Number(r.capacity),
      minShipment: Number(r.minShipment)
    }));

    return c.json(parsedRoutes, 200);
  } catch (error: any) {
    console.error('Error listing routes:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Get route by ID
routes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [route] = await sql<Route[]>`
      SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment", created_at, updated_at 
      FROM routes 
      WHERE id = ${id}
    `;

    if (!route) {
      return c.json({ error: 'Route not found' }, 404);
    }

    // Parse numeric fields from strings
    const parsedRoute = {
      ...route,
      capacity: Number(route.capacity),
      minShipment: Number(route.minShipment)
    };

    return c.json(parsedRoute, 200);
  } catch (error: any) {
    console.error('Error getting route:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default routes;
