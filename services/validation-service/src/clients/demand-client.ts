import { Demand } from '../types';

const DEMAND_SERVICE_URL = process.env.DEMAND_SERVICE_URL || 'http://demand-service:3005';

export async function getDemands(date?: string): Promise<Demand[]> {
  try {
    const url = date 
      ? `${DEMAND_SERVICE_URL}/demands?date=${date}`
      : `${DEMAND_SERVICE_URL}/demands`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch demands: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching demands:', error);
    throw error;
  }
}
