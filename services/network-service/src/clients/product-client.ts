import { Product } from '../types';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching products:', error);
    throw error;
  }
}
