import sql from '../db';
import { NetworkSummary, Location, Product, StorageUnit, Route, Demand } from '../types';

export const getNetworkSummary = async (req: Request): Promise<Response> => {
  try {
    // Fetch all data in parallel
    const [locations, products, storageUnits, routes, demands] = await Promise.all([
      sql<Location[]>`SELECT id, name, type, city FROM locations ORDER BY name`,
      sql<Product[]>`SELECT id, name, "minTemperature", "maxTemperature" FROM products ORDER BY name`,
      sql<StorageUnit[]>`SELECT id, "locationId", "minTemperature", "maxTemperature", capacity FROM storage_units ORDER BY "locationId"`,
      sql<Route[]>`SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment" FROM routes ORDER BY "fromLocationId", "toLocationId"`,
      sql<Demand[]>`SELECT id, "locationId", "productId", date::text as date, "minQuantity", "maxQuantity" FROM demands ORDER BY date, "locationId"`,
    ]);

    const summary: NetworkSummary = {
      locations,
      products,
      storageUnits,
      routes,
      demands,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error getting network summary:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
