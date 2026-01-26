import postgres from 'postgres';

// Database configuration
const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'demands_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
