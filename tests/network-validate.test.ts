import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import sql from '../src/db';

const BASE_URL = 'http://localhost:3000';

// Helper function to make requests
async function makeRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  
  return { response, json };
}

// Clean up database before tests
beforeAll(async () => {
  await sql`DELETE FROM demands`;
  await sql`DELETE FROM routes`;
  await sql`DELETE FROM storage_units`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM locations`;
});

// Clean up after each test
beforeEach(async () => {
  await sql`DELETE FROM demands`;
  await sql`DELETE FROM routes`;
  await sql`DELETE FROM storage_units`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM locations`;
});

afterAll(async () => {
  await sql`DELETE FROM demands`;
  await sql`DELETE FROM routes`;
  await sql`DELETE FROM storage_units`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM locations`;
});

describe('POST /network/validate', () => {
  test('should return feasible:true when no demands exist for date', async () => {
    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(true);
    expect(json.issues).toBeUndefined();
  });

  test('should return 400 for missing date field', async () => {
    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for invalid date format', async () => {
    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '01-25-2026',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
    expect(json.details).toBeDefined();
    expect(json.details.length).toBeGreaterThan(0);
    expect(json.details[0].message).toContain('YYYY-MM-DD');
  });

  test('should return feasible:true for valid network with no violations', async () => {
    // Create producer
    const [producer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Producer A', 'PRODUCER', 'New York')
      RETURNING id
    `;

    // Create warehouse
    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    // Create retailer
    const [retailer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer C', 'RETAILER', 'Los Angeles')
      RETURNING id
    `;

    // Create product
    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    // Create storage unit with sufficient capacity
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 1000)
    `;

    // Create routes with sufficient capacity
    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${producer.id}, ${warehouse.id}, 500, 0)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer.id}, 500, 0)
    `;

    // Create demand with quantity within capacity
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer.id}, ${product.id}, '2026-01-25', 50, 100)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(true);
    expect(json.issues).toBeUndefined();
  });

  test('should detect MAX_CAPACITY_VIOLATION for route exceeding capacity', async () => {
    // Create producer
    const [producer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Producer A', 'PRODUCER', 'New York')
      RETURNING id
    `;

    // Create warehouse
    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    // Create retailer
    const [retailer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer C', 'RETAILER', 'Los Angeles')
      RETURNING id
    `;

    // Create product
    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    // Create storage unit with sufficient capacity
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 1000)
    `;

    // Create routes with INSUFFICIENT capacity
    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${producer.id}, ${warehouse.id}, 500, 0)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer.id}, 50, 0)
    `;

    // Create demand with quantity EXCEEDING route capacity
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer.id}, ${product.id}, '2026-01-25', 50, 200)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(false);
    expect(json.issues).toContain('MAX_CAPACITY_VIOLATION');
  });

  test('should detect MIN_CAPACITY_VIOLATION for route below minimum shipment', async () => {
    // Create producer
    const [producer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Producer A', 'PRODUCER', 'New York')
      RETURNING id
    `;

    // Create warehouse
    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    // Create retailer
    const [retailer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer C', 'RETAILER', 'Los Angeles')
      RETURNING id
    `;

    // Create product
    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    // Create storage unit
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 1000)
    `;

    // Create routes with HIGH minimum shipment requirement
    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${producer.id}, ${warehouse.id}, 500, 100)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer.id}, 500, 100)
    `;

    // Create demand with quantity BELOW minimum shipment
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer.id}, ${product.id}, '2026-01-25', 10, 50)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(false);
    expect(json.issues).toContain('MIN_CAPACITY_VIOLATION');
  });

  test('should detect MAX_CAPACITY_VIOLATION for storage unit exceeding capacity', async () => {
    // Create warehouse
    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    // Create product
    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    // Create storage unit with LIMITED capacity
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 50)
    `;

    // Create demand at warehouse with quantity EXCEEDING storage capacity
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${warehouse.id}, ${product.id}, '2026-01-25', 50, 200)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(false);
    expect(json.issues).toContain('MAX_CAPACITY_VIOLATION');
  });

  test('should handle multiple demands on same date', async () => {
    // Create locations
    const [producer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Producer A', 'PRODUCER', 'New York')
      RETURNING id
    `;

    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    const [retailer1] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer C', 'RETAILER', 'Los Angeles')
      RETURNING id
    `;

    const [retailer2] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer D', 'RETAILER', 'Miami')
      RETURNING id
    `;

    // Create products
    const [product1] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    const [product2] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 2', 5, 10)
      RETURNING id
    `;

    // Create storage unit
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 15, 1000)
    `;

    // Create routes
    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${producer.id}, ${warehouse.id}, 1000, 0)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer1.id}, 500, 0)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer2.id}, 500, 0)
    `;

    // Create multiple demands
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer1.id}, ${product1.id}, '2026-01-25', 50, 100)
    `;

    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer2.id}, ${product2.id}, '2026-01-25', 50, 100)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(true);
  });

  test('should only validate demands for specified date', async () => {
    // Create locations
    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    // Create storage with limited capacity
    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 50)
    `;

    // Create demand on DIFFERENT date that would violate capacity
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${warehouse.id}, ${product.id}, '2026-01-26', 50, 200)
    `;

    // Validate for date with no demands
    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(true);
    expect(json.issues).toBeUndefined();
  });

  test('should handle edge case with zero minShipment', async () => {
    // Create locations
    const [producer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Producer A', 'PRODUCER', 'New York')
      RETURNING id
    `;

    const [warehouse] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Warehouse B', 'WAREHOUSE', 'Chicago')
      RETURNING id
    `;

    const [retailer] = await sql`
      INSERT INTO locations (name, type, city)
      VALUES ('Retailer C', 'RETAILER', 'Los Angeles')
      RETURNING id
    `;

    const [product] = await sql`
      INSERT INTO products (name, "minTemperature", "maxTemperature")
      VALUES ('Product 1', 2, 8)
      RETURNING id
    `;

    await sql`
      INSERT INTO storage_units ("locationId", "minTemperature", "maxTemperature", capacity)
      VALUES (${warehouse.id}, 0, 10, 1000)
    `;

    // Create route with zero minShipment (any quantity is valid)
    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${producer.id}, ${warehouse.id}, 500, 0)
    `;

    await sql`
      INSERT INTO routes ("fromLocationId", "toLocationId", capacity, "minShipment")
      VALUES (${warehouse.id}, ${retailer.id}, 500, 0)
    `;

    // Small demand should be feasible with zero minShipment
    await sql`
      INSERT INTO demands ("locationId", "productId", date, "minQuantity", "maxQuantity")
      VALUES (${retailer.id}, ${product.id}, '2026-01-25', 1, 5)
    `;

    const { response, json } = await makeRequest('/network/validate', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-25',
      }),
    });

    expect(response.status).toBe(200);
    expect(json.feasible).toBe(true);
  });
});
