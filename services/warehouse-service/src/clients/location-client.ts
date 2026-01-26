const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:3001';

interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
}

/**
 * Validate that a location exists and optionally check its type
 */
export async function validateLocation(
  locationId: string, 
  expectedType?: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${LOCATION_SERVICE_URL}/locations/${locationId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'Location does not exist' };
      }
      return { valid: false, error: 'Failed to validate location' };
    }
    
    const location: Location = await response.json();
    
    // Optionally check if it's the expected type (e.g., WAREHOUSE)
    if (expectedType && location.type !== expectedType) {
      return { 
        valid: false, 
        error: `Location must be of type ${expectedType}, but is ${location.type}` 
      };
    }
    
    return { valid: true };
  } catch (error: any) {
    console.error('Error validating location:', error);
    return { valid: false, error: 'Failed to communicate with location service' };
  }
}
