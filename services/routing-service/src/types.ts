export interface Route {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  capacity: number;
  minShipment: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateRouteRequest {
  fromLocationId: string;
  toLocationId: string;
  capacity: number;
  minShipment: number;
}
