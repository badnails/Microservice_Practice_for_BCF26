import { Hono } from 'hono';
import sql from '../db';
import { Demand } from '../types';
import { createDemandSchema, demandQuerySchema } from '../validation';
import { validateLocation } from '../clients/location-client';
import { validateProduct } from '../clients/product-client';

const demands = new Hono();

// Create a new demand
demands.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validationResult = createDemandSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Missing or invalid fields', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { locationId, productId, date, minQuantity, maxQuantity } = validationResult.data;

    // Validate both location and product exist
    const [locationValidation, productValidation] = await Promise.all([
      validateLocation(locationId),
      validateProduct(productId)
    ]);

    if (!locationValidation.valid) {
      return c.json({ 
        error: locationValidation.error || 'Invalid location' 
      }, 400);
    }

    if (!productValidation.valid) {
      return c.json({ 
        error: productValidation.error || 'Invalid product' 
      }, 400);
    }

    // Insert into database
    const [demand] = await sql<Demand[]>`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${locationId}, ${productId}, ${date}, ${minQuantity}, ${maxQuantity})
      RETURNING id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at
    `;

    // Parse numeric fields from strings
    const parsedDemand = {
      ...demand,
      minQuantity: Number(demand.minQuantity),
      maxQuantity: Number(demand.maxQuantity)
    };

    return c.json(parsedDemand, 201);
  } catch (error: any) {
    console.error('Error creating demand:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// List all demands (with optional filtering)
demands.get('/', async (c) => {
  try {
    const query = c.req.query();
    const validationResult = demandQuerySchema.safeParse(query);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid query parameters', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { date, locationId, productId } = validationResult.data || {};

    let demandsList: Demand[];

    // Build query based on filters
    if (date && locationId && productId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE date = ${date} AND "locationId" = ${locationId} AND "productId" = ${productId}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (date && locationId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE date = ${date} AND "locationId" = ${locationId}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (date && productId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE date = ${date} AND "productId" = ${productId}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (locationId && productId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE "locationId" = ${locationId} AND "productId" = ${productId}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (date) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE date = ${date}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (locationId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE "locationId" = ${locationId}
        ORDER BY date DESC, created_at DESC
      `;
    } else if (productId) {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        WHERE "productId" = ${productId}
        ORDER BY date DESC, created_at DESC
      `;
    } else {
      demandsList = await sql<Demand[]>`
        SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
        FROM demands 
        ORDER BY date DESC, created_at DESC
      `;
    }

    // Parse numeric fields from strings
    const parsedDemands = demandsList.map(d => ({
      ...d,
      minQuantity: Number(d.minQuantity),
      maxQuantity: Number(d.maxQuantity)
    }));

    return c.json(parsedDemands, 200);
  } catch (error: any) {
    console.error('Error listing demands:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Get demand by ID
demands.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [demand] = await sql<Demand[]>`
      SELECT id, "locationId", "productId", date, "minQuantity", "maxQuantity", created_at, updated_at 
      FROM demands 
      WHERE id = ${id}
    `;

    if (!demand) {
      return c.json({ error: 'Demand not found' }, 404);
    }

    // Parse numeric fields from strings
    const parsedDemand = {
      ...demand,
      minQuantity: Number(demand.minQuantity),
      maxQuantity: Number(demand.maxQuantity)
    };

    return c.json(parsedDemand, 200);
  } catch (error: any) {
    console.error('Error getting demand:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default demands;
