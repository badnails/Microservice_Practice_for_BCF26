export interface Product {
  id: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductRequest {
  name: string;
  minTemperature: number;
  maxTemperature: number;
}
