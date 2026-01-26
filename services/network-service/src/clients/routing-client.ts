import { Route } from '../types';

const ROUTING_SERVICE_URL = process.env.ROUTING_SERVICE_URL || 'http://routing-service:3004';

export async function getRoutes(): Promise<Route[]> {
  try {
    const response = await fetch(`${ROUTING_SERVICE_URL}/routes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}
