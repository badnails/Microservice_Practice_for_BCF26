import { createLocation, listLocations } from './src/handlers/locations';
import { createProduct, listProducts } from './src/handlers/products';
import { createStorageUnit, listStorageUnits } from './src/handlers/storage-units';
import { createRoute, listRoutes } from './src/handlers/routes';
import { createDemand, listDemands } from './src/handlers/demands';
import { getNetworkSummary } from './src/handlers/network';
import { validateTemperature, validateNetwork } from './src/handlers/validation';

const PORT = process.env.PORT || 8000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Location endpoints
      if (path === '/locations' && method === 'POST') {
        const response = await createLocation(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/locations' && method === 'GET') {
        const response = await listLocations(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Product endpoints
      if (path === '/products' && method === 'POST') {
        const response = await createProduct(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/products' && method === 'GET') {
        const response = await listProducts(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Storage Unit endpoints
      if (path === '/storage-units' && method === 'POST') {
        const response = await createStorageUnit(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/storage-units' && method === 'GET') {
        const response = await listStorageUnits(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Route endpoints
      if (path === '/routes' && method === 'POST') {
        const response = await createRoute(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/routes' && method === 'GET') {
        const response = await listRoutes(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Demand endpoints
      if (path === '/demands' && method === 'POST') {
        const response = await createDemand(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/demands' && method === 'GET') {
        const response = await listDemands(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Network Summary endpoint
      if (path === '/network/summary' && method === 'GET') {
        const response = await getNetworkSummary(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // Validation endpoints
      if (path === '/temps/validate' && method === 'POST') {
        const response = await validateTemperature(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      if (path === '/network/validate' && method === 'POST') {
        const response = await validateNetwork(req);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      // 404 Not Found
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
});

console.log(`Server running at http://localhost:${PORT}`);