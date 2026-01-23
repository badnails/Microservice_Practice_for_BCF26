import sql from '../db';
import { StorageUnit } from '../types';
import { createStorageUnitSchema } from '../validation';

export const createStorageUnit = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createStorageUnitSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { locationId, minTemperature, maxTemperature, capacity } = validationResult.data;

    // Check if location exists and is a WAREHOUSE
    const [location] = await sql`
      SELECT id, type FROM locations WHERE id = ${locationId}
    `;

    if (!location) {
      return new Response(
        JSON.stringify({ error: 'Location does not exist' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (location.type !== 'WAREHOUSE') {
      return new Response(
        JSON.stringify({ error: 'Location ID does not belong to type WAREHOUSE' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const [storageUnit] = await sql<StorageUnit[]>`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${locationId}, ${minTemperature}, ${maxTemperature}, ${capacity})
      RETURNING id, "locationId", "minTemperature", "maxTemperature", capacity
    `;

    return new Response(JSON.stringify(storageUnit), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating storage unit:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const listStorageUnits = async (req: Request): Promise<Response> => {
  try {
    const storageUnits = await sql<StorageUnit[]>`
      SELECT id, "locationId", "minTemperature", "maxTemperature", capacity 
      FROM storage_units
      ORDER BY "locationId"
    `;

    return new Response(JSON.stringify(storageUnits), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing storage units:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
