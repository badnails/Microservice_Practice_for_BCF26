import { StorageUnit } from '../types';

const WAREHOUSE_SERVICE_URL = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-service:3003';

export async function getStorageUnits(): Promise<StorageUnit[]> {
  try {
    const response = await fetch(`${WAREHOUSE_SERVICE_URL}/storage-units`);
    if (!response.ok) {
      throw new Error(`Failed to fetch storage units: ${response.statusText}`);
    }
    
    return await response.json();

  } catch (error: any) {
    console.error('Error fetching storage units:', error);
    throw error;
  }
}
