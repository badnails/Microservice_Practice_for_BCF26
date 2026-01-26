import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from './src/routes/routes';

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
    service: 'routing-service',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.route('/routes', routes);

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

const PORT = Number(process.env.PORT) || 3004;

console.log(`🚀 Routing Service starting on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
