import { Hono } from 'hono';
import sql from '../db';
import { StorageUnit } from '../types';
import { createStorageUnitSchema, storageUnitQuerySchema } from '../validation';
import { validateLocation } from '../clients/location-client';

const storageUnits = new Hono();

// Create a new storage unit
storageUnits.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validationResult = createStorageUnitSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Missing or invalid fields', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { locationId, minTemperature, maxTemperature, capacity } = validationResult.data;

    // Validate location exists and is a WAREHOUSE
    const locationValidation = await validateLocation(locationId, 'WAREHOUSE');
    if (!locationValidation.valid) {
      return c.json({ 
        error: locationValidation.error || 'Invalid location' 
      }, 400);
    }

    // Insert into database
    const [storageUnit] = await sql<StorageUnit[]>`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${locationId}, ${minTemperature}, ${maxTemperature}, ${capacity})
      RETURNING id, "locationId", "minTemperature", "maxTemperature", capacity, created_at, updated_at
    `;

    // Parse numeric fields from strings
    const parsedStorageUnit = {
      ...storageUnit,
      minTemperature: Number(storageUnit.minTemperature),
      maxTemperature: Number(storageUnit.maxTemperature),
      capacity: Number(storageUnit.capacity)
    };

    return c.json(parsedStorageUnit, 201);
  } catch (error: any) {
    console.error('Error creating storage unit:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// List all storage units (with optional filtering)
storageUnits.get('/', async (c) => {
  try {
    const query = c.req.query();
    const validationResult = storageUnitQuerySchema.safeParse(query);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Invalid query parameters', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { locationId } = validationResult.data || {};

    let storageUnitsList: StorageUnit[];

    if (locationId) {
      storageUnitsList = await sql<StorageUnit[]>`
        SELECT id, "locationId", "minTemperature", "maxTemperature", capacity, created_at, updated_at 
        FROM storage_units 
        WHERE "locationId" = ${locationId}
        ORDER BY created_at DESC
      `;
    } else {
      storageUnitsList = await sql<StorageUnit[]>`
        SELECT id, "locationId", "minTemperature", "maxTemperature", capacity, created_at, updated_at 
        FROM storage_units 
        ORDER BY created_at DESC
      `;
    }

    // Parse numeric fields from strings
    const parsedStorageUnits = storageUnitsList.map(unit => ({
      ...unit,
      minTemperature: Number(unit.minTemperature),
      maxTemperature: Number(unit.maxTemperature),
      capacity: Number(unit.capacity)
    }));

    return c.json(parsedStorageUnits, 200);
  } catch (error: any) {
    console.error('Error listing storage units:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Get storage unit by ID
storageUnits.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [storageUnit] = await sql<StorageUnit[]>`
      SELECT id, "locationId", "minTemperature", "maxTemperature", capacity, created_at, updated_at 
      FROM storage_units 
      WHERE id = ${id}
    `;

    if (!storageUnit) {
      return c.json({ error: 'Storage unit not found' }, 404);
    }

    // Parse numeric fields from strings
    const parsedStorageUnit = {
      ...storageUnit,
      minTemperature: Number(storageUnit.minTemperature),
      maxTemperature: Number(storageUnit.maxTemperature),
      capacity: Number(storageUnit.capacity)
    };

    return c.json(parsedStorageUnit, 200);
  } catch (error: any) {
    console.error('Error getting storage unit:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default storageUnits;
