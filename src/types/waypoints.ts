export type WaypointStatus = 'CLEAR' | 'MODERATE' | 'CONGESTED' | 'BLOCKED_DIVERTED';

export interface HighwayWaypoint {
  id: string;
  name: string;
  localName?: { hi: string; mr: string };
  distanceKm: number;
  estimatedArrival: string;
  status: WaypointStatus;
  delaySeconds: number;
  highlight?: string;
  isOrigin?: boolean;
  isDestination?: boolean;
}

