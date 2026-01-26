import { Hono } from 'hono';
import { NetworkSummary } from '../types';
import { getLocations } from '../clients/location-client';
import { getProducts } from '../clients/product-client';
import { getStorageUnits } from '../clients/warehouse-client';
import { getRoutes } from '../clients/routing-client';
import { getDemands } from '../clients/demand-client';

const network = new Hono();

// Get network summary - aggregates data from all services
network.get('/summary', async (c) => {
  try {
    // Fetch data from all 5 services in parallel for optimal performance
    const [locations, products, storageUnits, routes, demands] = await Promise.all([
      getLocations(),
      getProducts(),
      getStorageUnits(),
      getRoutes(),
      getDemands()
    ]);

    const summary: NetworkSummary = {
      locations,
      products,
      storageUnits,
      routes,
      demands
    };

    return c.json(summary, 200);
  } catch (error: any) {
    console.error('Error fetching network summary:', error);
    return c.json({ 
      error: 'Failed to fetch network summary', 
      message: error.message,
      details: 'One or more services may be unavailable'
    }, 500);
  }
});

export default network;
