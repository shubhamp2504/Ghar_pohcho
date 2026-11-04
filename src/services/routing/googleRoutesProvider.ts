import type {
  IRoutingProvider,
  RouteRequest,
  RouteCalculationResult,
  RouteOption,
  TrafficSegment,
  CongestionLevel,
} from '../../types/routing';
import { decodePolyline, calculateAdditionalDelay } from '../../utils/geo';

interface GoogleRoutesApiResponse {
  routes?: Array<{
    description?: string;
    distanceMeters?: number;
    duration?: string; // e.g. "5400s"
    staticDuration?: string; // e.g. "4200s"
    polyline?: {
      encodedPolyline?: string;
    };
    routeLabels?: string[];
    warnings?: string[];
    travelAdvisory?: {
      speedReadingIntervals?: Array<{
        startPolylinePointIndex?: number;
        endPolylinePointIndex?: number;
        speed?: 'SPEED_UNSPECIFIED' | 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM';
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class GoogleRoutesProvider implements IRoutingProvider {
  name = 'Google Maps Routes API';
  private apiKey: string | null = null;

  constructor(apiKey?: string | null) {
    this.apiKey = apiKey || null;
  }

  setApiKey(key: string | null) {
    this.apiKey = key;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async calculateRoutes(request: RouteRequest): Promise<RouteCalculationResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Routes API key is not configured.');
    }

    const endpoint = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const body: Record<string, unknown> = {
      origin: {
        location: {
          latLng: {
            latitude: request.origin.lat,
            longitude: request.origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: request.destination.lat,
            longitude: request.destination.lng,
          },
        },
      },
      travelMode: request.travelMode === 'TWO_WHEELER' ? 'TWO_WHEELER' : 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true,
      units: 'METRIC',
    };

    if (request.departureTime && request.departureTime !== 'now') {
      body.departureTime = request.departureTime;
    }

    const fieldMask = [
      'routes.duration',
      'routes.staticDuration',
      'routes.distanceMeters',
      'routes.description',
      'routes.polyline.encodedPolyline',
      'routes.warnings',
      'routes.routeLabels',
      'routes.travelAdvisory.speedReadingIntervals',
    ].join(',');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey!,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorJson = (await response.json().catch(() => ({}))) as GoogleRoutesApiResponse;
      const errorMsg =
        errorJson?.error?.message ||
        `Google Routes API error (${response.status}: ${response.statusText})`;
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as GoogleRoutesApiResponse;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found between origin and destination.');
    }

    const now = new Date();
    const computedAt = now.toISOString();

    // Map Google routes to RouteOption[]
    const routes: RouteOption[] = data.routes.map((gRoute, idx) => {
      const durationSeconds = parseSeconds(gRoute.duration);
      const staticDurationSeconds = parseSeconds(gRoute.staticDuration) || durationSeconds;
      const additionalDelaySeconds = calculateAdditionalDelay(
        durationSeconds,
        staticDurationSeconds
      );
      const distanceMeters = gRoute.distanceMeters || 0;
      const encodedPolyline = gRoute.polyline?.encodedPolyline || '';
      const polyline = decodePolyline(encodedPolyline);

      // Parse speed intervals
      const trafficSegments = parseSpeedIntervals(
        gRoute.travelAdvisory?.speedReadingIntervals,
        polyline,
        gRoute.description || `Route ${idx + 1}`
      );

      const etaDate = new Date(now.getTime() + durationSeconds * 1000);

      return {
        id: `google-route-${idx}`,
        name: gRoute.description || (idx === 0 ? 'Primary Route' : `Alternative Route ${idx}`),
        summary: gRoute.description ? `via ${gRoute.description}` : 'Recommended highway corridor',
        isRecommended: false, // Calculated after sorting
        distanceMeters,
        durationSeconds,
        staticDurationSeconds,
        additionalDelaySeconds,
        estimatedArrivalTime: etaDate.toISOString(),
        hasTolls: true, // Google doesn't return toll presence without extra fees; default to standard flag
        encodedPolyline,
        polyline,
        trafficSegments,
        warnings: gRoute.warnings || [],
        source: 'GOOGLE_ROUTES_API',
        dataConfidence: 'REALTIME',
        lastUpdated: computedAt,
      };
    });

    // Recommend route with lowest traffic-aware duration
    let bestIdx = 0;
    let minDuration = Infinity;
    routes.forEach((r, i) => {
      if (r.durationSeconds < minDuration) {
        minDuration = r.durationSeconds;
        bestIdx = i;
      }
    });

    routes[bestIdx].isRecommended = true;

    return {
      routes,
      selectedRouteIndex: bestIdx,
      origin: request.origin,
      destination: request.destination,
      computedAt,
      source: 'GOOGLE_ROUTES_API',
      disclaimer: 'Live traffic duration provided by Google Routes API. Values reflect current road conditions.',
    };
  }
}

function parseSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/^(\d+(\.\d+)?)s$/);
  if (match) {
    return Math.round(parseFloat(match[1]));
  }
  return 0;
}

function parseSpeedIntervals(
  intervals:
    | Array<{
        startPolylinePointIndex?: number;
        endPolylinePointIndex?: number;
        speed?: 'SPEED_UNSPECIFIED' | 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM';
      }>
    | undefined,
  fullPolyline: [number, number][],
  routeName: string
): TrafficSegment[] {
  if (!intervals || intervals.length === 0 || fullPolyline.length < 2) {
    return [];
  }

  const segments: TrafficSegment[] = [];

  intervals.forEach((interval, idx) => {
    const startIdx = interval.startPolylinePointIndex ?? 0;
    const endIdx = interval.endPolylinePointIndex ?? fullPolyline.length - 1;

    if (startIdx >= fullPolyline.length || endIdx >= fullPolyline.length || startIdx >= endIdx) {
      return;
    }

    const segmentPolyline = fullPolyline.slice(startIdx, endIdx + 1);
    if (segmentPolyline.length < 2) return;

    let congestionLevel: CongestionLevel = 'NORMAL';
    if (interval.speed === 'TRAFFIC_JAM') congestionLevel = 'HEAVY';
    else if (interval.speed === 'SLOW') congestionLevel = 'SLOW';

    // Only surface congested segments as distinct alerts in the breakdown
    if (congestionLevel !== 'NORMAL') {
      const startPoint = segmentPolyline[0];
      const endPoint = segmentPolyline[segmentPolyline.length - 1];

      segments.push({
        id: `seg-${idx}`,
        startPoint,
        endPoint,
        polyline: segmentPolyline,
        congestionLevel,
        roadName: `${routeName} (Segment ${idx + 1})`,
        lengthMeters: 0,
        durationSeconds: 0,
        delaySeconds: congestionLevel === 'HEAVY' ? 720 : 360,
        source: 'GOOGLE_ROUTES_API',
        lastUpdated: new Date().toISOString(),
        description:
          congestionLevel === 'HEAVY'
            ? 'Heavy traffic jam detected along this stretch.'
            : 'Slow moving traffic along this section.',
      });
    }
  });

  return segments;
}
