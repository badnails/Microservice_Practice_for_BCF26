import sql from '../db';
import { Route } from '../types';
import { createRouteSchema } from '../validation';

export const createRoute = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createRouteSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { fromLocationId, toLocationId, capacity, minShipment } = validationResult.data;

    // Check if both locations exist
    const locations = await sql`
      SELECT id FROM locations WHERE id IN (${fromLocationId}, ${toLocationId})
    `;

    if (locations.length !== 2) {
      return new Response(
        JSON.stringify({ error: 'Location does not exist' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const [route] = await sql<Route[]>`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${fromLocationId}, ${toLocationId}, ${capacity}, ${minShipment})
      RETURNING id, "fromLocationId", "toLocationId", capacity, "minShipment"
    `;

    return new Response(JSON.stringify(route), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const listRoutes = async (req: Request): Promise<Response> => {
  try {
    const routes = await sql<Route[]>`
      SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment" 
      FROM routes
      ORDER BY "fromLocationId", "toLocationId"
    `;

    return new Response(JSON.stringify(routes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing routes:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
