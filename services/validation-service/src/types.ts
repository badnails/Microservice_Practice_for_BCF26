export interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
}

export interface Product {
  id: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
}

export interface StorageUnit {
  id: string;
  locationId: string;
  minTemperature: number;
  maxTemperature: number;
  capacity: number;
}

export interface Route {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  capacity: number;
  minShipment: number;
}

export interface Demand {
  id: string;
  locationId: string;
  productId: string;
  date: string;
  minQuantity: number;
  maxQuantity: number;
}
