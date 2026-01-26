export interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  id: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface StorageUnit {
  id: string;
  locationId: string;
  minTemperature: number;
  maxTemperature: number;
  capacity: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Route {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  capacity: number;
  minShipment: number;
  created_at?: Date;
  updated_at?: Date;
}

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

export interface NetworkSummary {
  locations: Location[];
  products: Product[];
  storageUnits: StorageUnit[];
  routes: Route[];
  demands: Demand[];
}
