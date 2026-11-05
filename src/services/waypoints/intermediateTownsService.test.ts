import { describe, it, expect } from 'vitest';
import { intermediateTownsService } from './intermediateTownsService';
import type { RouteOption, LocationPoint } from '../../types/routing';

describe('IntermediateTownsService', () => {
  const dummyRoute: RouteOption = {
    id: 'r1',
    name: 'Mumbai-Pune Expressway',
    summary: 'via Mumbai-Pune Expressway',
    isRecommended: true,
    distanceMeters: 148000,
    durationSeconds: 9600,
    staticDurationSeconds: 7800,
    additionalDelaySeconds: 1800,
    estimatedArrivalTime: new Date().toISOString(),
    hasTolls: true,
    encodedPolyline: '',
    polyline: [],
    trafficSegments: [],
    warnings: [],
    source: 'GOOGLE_ROUTES_API',
    dataConfidence: 'REALTIME',
    lastUpdated: new Date().toISOString(),
  };

  const mumbaiPoint: LocationPoint = {
    name: 'Chembur, Mumbai',
    lat: 19.052,
    lng: 72.899,
  };

  const punePoint: LocationPoint = {
    name: 'Shivajinagar, Pune',
    lat: 18.531,
    lng: 73.844,
  };

  it('generates intermediate waypoints for Mumbai-Pune corridor', () => {
    const waypoints = intermediateTownsService.getWaypointsForRoute(dummyRoute, mumbaiPoint, punePoint);

    expect(waypoints.length).toBeGreaterThan(4);
    expect(waypoints[0].distanceKm).toBe(0);
    expect(waypoints[waypoints.length - 1].distanceKm).toBe(148);

    const names = waypoints.map((w) => w.name);
    expect(names.some((n) => n.includes('Vashi'))).toBe(true);
    expect(names.some((n) => n.includes('Khalapur'))).toBe(true);
    expect(names.some((n) => n.includes('Lonavala') || n.includes('Khandala'))).toBe(true);
  });

  it('generates generic milestones for other Indian highway routes', () => {
    const genericRoute: RouteOption = {
      ...dummyRoute,
      distanceMeters: 80000,
    };
    const startPoint: LocationPoint = { name: 'Nagpur', lat: 21.145, lng: 79.088 };
    const endPoint: LocationPoint = { name: 'Wardha', lat: 20.745, lng: 78.602 };

    const waypoints = intermediateTownsService.getWaypointsForRoute(genericRoute, startPoint, endPoint);
    expect(waypoints.length).toBeGreaterThanOrEqual(4);
    expect(waypoints[0].distanceKm).toBe(0);
    expect(waypoints[waypoints.length - 1].distanceKm).toBe(80);
  });
});
