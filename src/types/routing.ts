export type Language = 'en' | 'hi' | 'mr';

export type CongestionLevel = 'NORMAL' | 'MODERATE' | 'SLOW' | 'HEAVY' | 'SEVERE';

export type DataSource = 'GOOGLE_ROUTES_API' | 'MOCK_FIXTURE' | 'COMMUNITY' | 'HISTORICAL_ESTIMATE';

export type DataConfidence = 'REALTIME' | 'HISTORICAL_ESTIMATE' | 'APPROXIMATE';

export interface LocationPoint {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface TrafficSegment {
  id: string;
  startPoint: [number, number]; // [lat, lng]
  endPoint: [number, number];   // [lat, lng]
  polyline: [number, number][]; // [[lat, lng], ...]
  congestionLevel: CongestionLevel;
  roadName: string;
  lengthMeters: number;
  durationSeconds: number;
  delaySeconds: number;
  source: DataSource;
  lastUpdated: string;
  description?: string;
}

export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  isRecommended: boolean;
  distanceMeters: number;
  durationSeconds: number;       // Traffic-aware duration
  staticDurationSeconds: number; // Baseline / free-flow duration
  additionalDelaySeconds: number; // durationSeconds - staticDurationSeconds
  estimatedArrivalTime: string;  // ISO string
  hasTolls: boolean;
  tollNote?: string;
  encodedPolyline: string;
  polyline: [number, number][]; // Decoded [lat, lng] coordinates
  trafficSegments: TrafficSegment[];
  warnings: string[];
  source: DataSource;
  dataConfidence: DataConfidence;
  lastUpdated: string;
}

export interface RouteRequest {
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints?: LocationPoint[];
  departureTime?: string; // ISO string or 'now'
  travelMode?: 'DRIVE' | 'TWO_WHEELER';
}

export interface RouteCalculationResult {
  routes: RouteOption[];
  selectedRouteIndex: number;
  origin: LocationPoint;
  destination: LocationPoint;
  computedAt: string;
  source: DataSource;
  disclaimer?: string;
}

export interface IRoutingProvider {
  name: string;
  isConfigured(): boolean;
  calculateRoutes(request: RouteRequest): Promise<RouteCalculationResult>;
}

export interface IPlacesProvider {
  searchPlaces(query: string): Promise<LocationPoint[]>;
  reverseGeocode(lat: number, lng: number): Promise<LocationPoint>;
}

export interface PopularRoutePreset {
  id: string;
  titleKey: string;
  origin: LocationPoint;
  destination: LocationPoint;
  typicalDuration: string;
  highwayTag: string;
}
