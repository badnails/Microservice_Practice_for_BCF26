import sql from '../db';
import { Demand } from '../types';
import { createDemandSchema } from '../validation';

export const createDemand = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createDemandSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { locationId, productId, date, minQuantity, maxQuantity } = validationResult.data;

    // Check if location exists
    const [location] = await sql`
      SELECT id FROM locations WHERE id = ${locationId}
    `;

    if (!location) {
      return new Response(
        JSON.stringify({ error: 'Location does not exist' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if product exists
    const [product] = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `;

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product does not exist' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const [demand] = await sql<Demand[]>`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${locationId}, ${productId}, ${date}, ${minQuantity}, ${maxQuantity})
      RETURNING id, "locationId", "productId", date::text as date, "minQuantity", "maxQuantity"
    `;

    return new Response(JSON.stringify(demand), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating demand:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const listDemands = async (req: Request): Promise<Response> => {
  try {
    const demands = await sql<Demand[]>`
      SELECT id, "locationId", "productId", date::text as date, "minQuantity", "maxQuantity" 
      FROM demands
      ORDER BY date, "locationId"
    `;

    return new Response(JSON.stringify(demands), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing demands:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
