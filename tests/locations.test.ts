import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
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

// Clean up database before and after tests
beforeAll(async () => {
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
  await sql.end();
});

describe('POST /locations', () => {
  test('should create a location with valid data - PRODUCER', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Producer',
        type: 'PRODUCER',
        city: 'New York',
      }),
    });

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      name: 'Test Producer',
      type: 'PRODUCER',
      city: 'New York',
    });
    expect(json.id).toBeDefined();
    expect(typeof json.id).toBe('string');
  });

  test('should create a location with valid data - WAREHOUSE', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Central Warehouse',
        type: 'WAREHOUSE',
        city: 'Chicago',
      }),
    });

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      name: 'Central Warehouse',
      type: 'WAREHOUSE',
      city: 'Chicago',
    });
    expect(json.id).toBeDefined();
  });

  test('should create a location with valid data - RETAILER', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Downtown Store',
        type: 'RETAILER',
        city: 'Los Angeles',
      }),
    });

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      name: 'Downtown Store',
      type: 'RETAILER',
      city: 'Los Angeles',
    });
  });

  test('should create a location with valid data - HOSPITAL', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'City Hospital',
        type: 'HOSPITAL',
        city: 'Boston',
      }),
    });

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      name: 'City Hospital',
      type: 'HOSPITAL',
      city: 'Boston',
    });
  });

  test('should return 400 for missing name field', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'PRODUCER',
        city: 'New York',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for empty name', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        type: 'PRODUCER',
        city: 'New York',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for missing type field', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location',
        city: 'New York',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for invalid type', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location',
        type: 'INVALID_TYPE',
        city: 'New York',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for missing city field', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location',
        type: 'PRODUCER',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for empty city', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location',
        type: 'PRODUCER',
        city: '',
      }),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for missing all fields', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing or invalid fields');
  });

  test('should return 400 for invalid JSON body', async () => {
    const response = await fetch(`${BASE_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    expect(response.status).toBe(500);
  });

  test('should handle extra fields gracefully', async () => {
    const { response, json } = await makeRequest('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location',
        type: 'PRODUCER',
        city: 'New York',
        extraField: 'should be ignored',
      }),
    });

    expect(response.status).toBe(201);
    expect(json.name).toBe('Test Location');
    expect(json.extraField).toBeUndefined();
  });
});
