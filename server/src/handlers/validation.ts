import sql from '../db';
import { validateTemperatureSchema, validateNetworkSchema } from '../validation';

interface TemperatureValidationResult {
  valid: boolean;
  issues?: string[];
}

interface NetworkValidationResult {
  feasible: boolean;
  issues?: string[];
}

export const validateTemperature = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = validateTemperatureSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { date } = validationResult.data;

    // Get all demands for the given date
    const demands = await sql`
      SELECT 
        d.id as demand_id,
        d."locationId" as location_id,
        d."productId" as product_id,
        l.name as location_name,
        l.type as location_type,
        p.name as product_name,
        p."minTemperature" as product_min_temp,
        p."maxTemperature" as product_max_temp
      FROM demands d
      JOIN locations l ON d."locationId" = l.id
      JOIN products p ON d."productId" = p.id
      WHERE d.date = ${date}
    `;

    if (demands.length === 0) {
      return new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const issues: string[] = [];

    // For each demand, find the warehouse that supplies to this location
    for (const demand of demands) {
      // Find routes that lead to this demand location
      // We need to trace back to find the warehouse
      let warehouseIds: string[] = [];

      if (demand.location_type === 'WAREHOUSE') {
        // Demand is at a warehouse
        warehouseIds = [demand.location_id];
      } else {
        // Find warehouses that have routes to this location (RETAILER or HOSPITAL)
        const routes = await sql`
          SELECT "fromLocationId"
          FROM routes r
          JOIN locations l ON r."fromLocationId" = l.id
          WHERE r."toLocationId" = ${demand.location_id}
            AND l.type = 'WAREHOUSE'
        `;
        warehouseIds = routes.map((r: any) => r.fromLocationId);
      }

      // Check if product temperature is compatible with at least one storage unit in any warehouse
      let isCompatible = false;

      for (const warehouseId of warehouseIds) {
        const storageUnits = await sql`
          SELECT "minTemperature", "maxTemperature"
          FROM storage_units
          WHERE "locationId" = ${warehouseId}
        `;

        // Check if product temperature range is fully within at least one storage unit
        for (const unit of storageUnits) {
          if (
            demand.product_min_temp >= unit.minTemperature &&
            demand.product_max_temp <= unit.maxTemperature
          ) {
            isCompatible = true;
            break;
          }
        }

        if (isCompatible) break;
      }

      if (!isCompatible && warehouseIds.length > 0) {
        issues.push(
          `Product "${demand.product_name}" (temp range: ${demand.product_min_temp}°C to ${demand.product_max_temp}°C) at location "${demand.location_name}" is not compatible with any storage unit temperature range`
        );
      }
    }

    const result: TemperatureValidationResult = {
      valid: issues.length === 0,
    };

    if (issues.length > 0) {
      result.issues = issues;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error validating temperature:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const validateNetwork = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = validateNetworkSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { date } = validationResult.data;

    // Get all demands for the given date
    const demands = await sql`
      SELECT 
        d.id,
        d."locationId",
        d."productId",
        d."minQuantity",
        d."maxQuantity",
        l.name as location_name,
        l.type as location_type,
        p.name as product_name
      FROM demands d
      JOIN locations l ON d."locationId" = l.id
      JOIN products p ON d."productId" = p.id
      WHERE d.date = ${date}
    `;

    if (demands.length === 0) {
      return new Response(JSON.stringify({ feasible: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const issues: string[] = [];
    
    // Track route usage: routeId -> quantity
    const routeUsage = new Map<string, number>();
    
    // Track storage unit usage: storageUnitId -> quantity
    const storageUsage = new Map<string, number>();

    // For each demand, calculate the flow through routes and storage
    for (const demand of demands) {
      const quantity = demand.maxQuantity; // Use max quantity for worst case

      if (demand.location_type === 'WAREHOUSE') {
        // Demand at warehouse - check storage units at this warehouse
        const storageUnits = await sql`
          SELECT id, capacity
          FROM storage_units
          WHERE "locationId" = ${demand.locationId}
        `;

        if (storageUnits.length > 0) {
          // Allocate to first available storage unit (simplified)
          const unit = storageUnits[0];
          const currentUsage = storageUsage.get(unit.id) || 0;
          storageUsage.set(unit.id, currentUsage + quantity);
        }

        // Also check incoming routes to warehouse from producers
        const incomingRoutes = await sql`
          SELECT r.id, r.capacity, r."minShipment", l.type as from_type
          FROM routes r
          JOIN locations l ON r."fromLocationId" = l.id
          WHERE r."toLocationId" = ${demand.locationId}
        `;

        for (const route of incomingRoutes) {
          const currentUsage = routeUsage.get(route.id) || 0;
          routeUsage.set(route.id, currentUsage + quantity);
        }
      } else {
        // Demand at RETAILER or HOSPITAL - find routes from warehouses
        const routes = await sql`
          SELECT r.id, r.capacity, r."minShipment", r."fromLocationId"
          FROM routes r
          JOIN locations l ON r."fromLocationId" = l.id
          WHERE r."toLocationId" = ${demand.locationId}
            AND l.type = 'WAREHOUSE'
        `;

        if (routes.length > 0) {
          // Allocate to first available route (simplified)
          const route = routes[0];
          const currentUsage = routeUsage.get(route.id) || 0;
          routeUsage.set(route.id, currentUsage + quantity);

          // Also track warehouse storage
          const storageUnits = await sql`
            SELECT id, capacity
            FROM storage_units
            WHERE "locationId" = ${route.fromLocationId}
          `;

          if (storageUnits.length > 0) {
            const unit = storageUnits[0];
            const currentUsage = storageUsage.get(unit.id) || 0;
            storageUsage.set(unit.id, currentUsage + quantity);
          }

          // Check routes from producer to this warehouse
          const producerRoutes = await sql`
            SELECT r.id, r.capacity, r."minShipment"
            FROM routes r
            JOIN locations l ON r."fromLocationId" = l.id
            WHERE r."toLocationId" = ${route.fromLocationId}
              AND l.type = 'PRODUCER'
          `;

          for (const pRoute of producerRoutes) {
            const currentUsage = routeUsage.get(pRoute.id) || 0;
            routeUsage.set(pRoute.id, currentUsage + quantity);
          }
        }
      }
    }

    // Check route capacity violations
    const allRoutes = await sql`
      SELECT id, "fromLocationId", "toLocationId", capacity, "minShipment"
      FROM routes
    `;

    for (const route of allRoutes) {
      const usage = routeUsage.get(route.id) || 0;
      
      // Check max capacity
      if (usage > route.capacity) {
        issues.push('MAX_CAPACITY_VIOLATION');
        break;
      }
      
      // Check min shipment (only if route is being used)
      if (usage > 0 && usage < route.minShipment) {
        issues.push('MIN_CAPACITY_VIOLATION');
        break;
      }
    }

    // Check storage unit capacity violations
    if (issues.length === 0) {
      const allStorageUnits = await sql`
        SELECT id, "locationId", capacity
        FROM storage_units
      `;

      for (const unit of allStorageUnits) {
        const usage = storageUsage.get(unit.id) || 0;
        
        if (usage > unit.capacity) {
          issues.push('MAX_CAPACITY_VIOLATION');
          break;
        }
      }
    }

    // Remove duplicates from issues
    const uniqueIssues = Array.from(new Set(issues));

    const result: NetworkValidationResult = {
      feasible: uniqueIssues.length === 0,
    };

    if (uniqueIssues.length > 0) {
      result.issues = uniqueIssues;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error validating network:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
