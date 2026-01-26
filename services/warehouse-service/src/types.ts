export interface StorageUnit {
  id: string;
  locationId: string;
  minTemperature: number;
  maxTemperature: number;
  capacity: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateStorageUnitRequest {
  locationId: string;
  minTemperature: number;
  maxTemperature: number;
  capacity: number;
}
