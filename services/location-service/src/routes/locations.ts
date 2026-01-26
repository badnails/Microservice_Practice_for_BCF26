import { Hono } from 'hono';
import sql from '../db';
import { Location } from '../types';
import { createLocationSchema, locationQuerySchema } from '../validation';

const locations = new Hono();

// Create a new location
locations.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validationResult = createLocationSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Missing or invalid fields', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { name, type, city } = validationResult.data;

    // Insert into database
    const [location] = await sql<Location[]>`
      INSERT INTO locations (name, type, city)
      VALUES (${name}, ${type}, ${city})
      RETURNING id, name, type, city, created_at, updated_at
    `;

    return c.json(location, 201);
  } catch (error: any) {
    console.error('Error creating location:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// List all locations (with optional filtering)
locations.get('/', async (c) => {
  try {
    const query = c.req.query();
    const validationResult = locationQuerySchema.safeParse(query);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid query parameters', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { type, city } = validationResult.data || {};

    let locationsList: Location[];

    if (type && city) {
      locationsList = await sql<Location[]>`
        SELECT id, name, type, city, created_at, updated_at 
        FROM locations 
        WHERE type = ${type} AND city = ${city}
        ORDER BY name
      `;
    } else if (type) {
      locationsList = await sql<Location[]>`
        SELECT id, name, type, city, created_at, updated_at 
        FROM locations 
        WHERE type = ${type}
        ORDER BY name
      `;
    } else if (city) {
      locationsList = await sql<Location[]>`
        SELECT id, name, type, city, created_at, updated_at 
        FROM locations 
        WHERE city = ${city}
        ORDER BY name
      `;
    } else {
      locationsList = await sql<Location[]>`
        SELECT id, name, type, city, created_at, updated_at 
        FROM locations 
        ORDER BY name
      `;
    }

    return c.json(locationsList, 200);
  } catch (error: any) {
    console.error('Error listing locations:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Get location by ID
locations.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [location] = await sql<Location[]>`
      SELECT id, name, type, city, created_at, updated_at 
      FROM locations 
      WHERE id = ${id}
    `;

    if (!location) {
      return c.json({ error: 'Location not found' }, 404);
    }

    return c.json(location, 200);
  } catch (error: any) {
    console.error('Error getting location:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default locations;
