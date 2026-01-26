import { Hono } from 'hono';
import sql from '../db';
import { Product } from '../types';
import { createProductSchema } from '../validation';

const products = new Hono();

// Create a new product
products.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Missing or invalid fields', 
        details: validationResult.error.issues 
      }, 400);
    }

    const { name, minTemperature, maxTemperature } = validationResult.data;

    // Insert into database
    const [product] = await sql<Product[]>`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES (${name}, ${minTemperature}, ${maxTemperature})
      RETURNING id, name, "minTemperature", "maxTemperature", created_at, updated_at
    `;

    // Parse numeric fields from strings
    const parsedProduct = {
      ...product,
      minTemperature: Number(product.minTemperature),
      maxTemperature: Number(product.maxTemperature)
    };

    return c.json(parsedProduct, 201);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// List all products
products.get('/', async (c) => {
  try {
    const productsList = await sql<Product[]>`
      SELECT id, name, "minTemperature", "maxTemperature", created_at, updated_at 
      FROM products 
      ORDER BY name
    `;

    // Parse numeric fields from strings
    const parsedProducts = productsList.map(p => ({
      ...p,
      minTemperature: Number(p.minTemperature),
      maxTemperature: Number(p.maxTemperature)
    }));

    return c.json(parsedProducts, 200);
  } catch (error: any) {
    console.error('Error listing products:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

// Get product by ID
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [product] = await sql<Product[]>`
      SELECT id, name, "minTemperature", "maxTemperature", created_at, updated_at 
      FROM products 
      WHERE id = ${id}
    `;

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Parse numeric fields from strings
    const parsedProduct = {
      ...product,
      minTemperature: Number(product.minTemperature),
      maxTemperature: Number(product.maxTemperature)
    };

    return c.json(parsedProduct, 200);
  } catch (error: any) {
    console.error('Error getting product:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
});

export default products;
