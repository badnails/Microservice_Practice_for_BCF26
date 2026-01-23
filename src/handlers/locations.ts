import sql from '../db';
import { Location } from '../types';
import { createLocationSchema } from '../validation';

export const createLocation = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createLocationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, type, city } = validationResult.data;

    // Insert into database
    const [location] = await sql<Location[]>`
      INSERT INTO locations (name, type, city)
      VALUES (${name}, ${type}, ${city})
      RETURNING id, name, type, city
    `;

    return new Response(JSON.stringify(location), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating location:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const listLocations = async (req: Request): Promise<Response> => {
  try {
    const locations = await sql<Location[]>`
      SELECT id, name, type, city FROM locations
      ORDER BY name
    `;

    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing locations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
