import { Hono } from 'hono';
import { cors } from 'hono/cors';
import demands from './src/routes/demands';

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'demand-service',
    timestamp: new Date().toISOString()
  });
});

// Mount demands routes
app.route('/demands', demands);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message 
  }, 500);
});

const PORT = Number(process.env.PORT) || 3005;

console.log(`🚀 Demand Service starting on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
