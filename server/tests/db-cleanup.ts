import postgres from 'postgres';

// Database connections for each microservice
const connections = {
  locations: postgres({
    host: 'localhost',
    port: 5433,
    database: 'locations_db',
    username: 'postgres',
    password: 'postgres',
  }),
  products: postgres({
    host: 'localhost',
    port: 5434,
    database: 'products_db',
    username: 'postgres',
    password: 'postgres',
  }),
  warehouse: postgres({
    host: 'localhost',
    port: 5435,
    database: 'warehouse_db',
    username: 'postgres',
    password: 'postgres',
  }),
  routing: postgres({
    host: 'localhost',
    port: 5436,
    database: 'routing_db',
    username: 'postgres',
    password: 'postgres',
  }),
  demands: postgres({
    host: 'localhost',
    port: 5437,
    database: 'demands_db',
    username: 'postgres',
    password: 'postgres',
  }),
};

export async function cleanupAllDatabases() {
  try {
    console.log('🧹 Cleaning up all microservice databases...');
    
    // Clean locations database
    await connections.locations`TRUNCATE TABLE locations RESTART IDENTITY CASCADE`;
    
    // Clean products database
    await connections.products`TRUNCATE TABLE products RESTART IDENTITY CASCADE`;
    
    // Clean warehouse database
    await connections.warehouse`TRUNCATE TABLE storage_units RESTART IDENTITY CASCADE`;
    
    // Clean routing database
    await connections.routing`TRUNCATE TABLE routes RESTART IDENTITY CASCADE`;
    
    // Clean demands database
    await connections.demands`TRUNCATE TABLE demands RESTART IDENTITY CASCADE`;
    
    console.log('✅ All databases cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning databases:', error);
    throw error;
  }
}

export async function closeAllConnections() {
  try {
    await connections.locations.end();
    await connections.products.end();
    await connections.warehouse.end();
    await connections.routing.end();
    await connections.demands.end();
    console.log('🔌 All database connections closed');
  } catch (error) {
    console.error('❌ Error closing connections:', error);
  }
}
