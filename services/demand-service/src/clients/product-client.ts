const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

/**
 * Validate that a product exists
 */
export async function validateProduct(productId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'Product does not exist' };
      }
      return { valid: false, error: 'Failed to validate product' };
    }
    
    return { valid: true };
  } catch (error: any) {
    console.error('Error validating product:', error);
    return { valid: false, error: 'Failed to communicate with product service' };
  }
}
