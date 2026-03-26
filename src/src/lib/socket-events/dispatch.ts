/** Socket.io event types for dispatch module */

export interface OrderAssignedEvent {
  orderId: string;
  truckId: string;
  routeId?: string;
  locationId: string;
}

export interface RouteUpdatedEvent {
  routeId: string;
  routeNumber?: string;
  status?: string;
  action?: string;
  locationId?: string;
}

export interface TruckStatusChangedEvent {
  truckId: string;
  status: string;
  locationId: string;
}

export interface StopStatusChangedEvent {
  stopId: string;
  routeId: string;
  status: string;
  outcome?: string;
  locationId: string;
}

/** Event names for dispatch Socket.io room */
export const DISPATCH_EVENTS = {
  ORDER_ASSIGNED: "order:assigned-to-truck",
  ROUTE_UPDATED: "route:updated",
  TRUCK_STATUS_CHANGED: "truck:status-changed",
  STOP_STATUS_CHANGED: "stop:status-changed",
} as const;
