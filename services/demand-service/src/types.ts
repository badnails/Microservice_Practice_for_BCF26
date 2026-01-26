export interface Demand {
  id: string;
  locationId: string;
  productId: string;
  date: string;
  minQuantity: number;
  maxQuantity: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateDemandRequest {
  locationId: string;
  productId: string;
  date: string;
  minQuantity: number;
  maxQuantity: number;
}
