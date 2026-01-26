import { Location } from '../types';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:3001';

export async function getLocations(): Promise<Location[]> {
  try {
    const response = await fetch(`${LOCATION_SERVICE_URL}/locations`);
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}
