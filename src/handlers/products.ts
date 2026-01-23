import sql from '../db';
import { Product } from '../types';
import { createProductSchema } from '../validation';

export const createProduct = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, minTemperature, maxTemperature } = validationResult.data;

    // Insert into database
    const [product] = await sql<Product[]>`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES (${name}, ${minTemperature}, ${maxTemperature})
      RETURNING id, name, "minTemperature", "maxTemperature"
    `;

    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const listProducts = async (req: Request): Promise<Response> => {
  try {
    const products = await sql<Product[]>`
      SELECT id, name, "minTemperature", "maxTemperature" FROM products
      ORDER BY name
    `;

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing products:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
