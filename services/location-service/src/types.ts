export type LocationType = 'PRODUCER' | 'WAREHOUSE' | 'RETAILER' | 'HOSPITAL';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  city: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateLocationRequest {
  name: string;
  type: LocationType;
  city: string;
}
