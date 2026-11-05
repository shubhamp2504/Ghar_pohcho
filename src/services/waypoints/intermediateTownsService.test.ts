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

  it('generates Samruddhi Mahamarg waypoints for Mumbai-Nagpur corridor', () => {
    const nagpurRoute: RouteOption = {
      ...dummyRoute,
      distanceMeters: 701000,
      durationSeconds: 27000,
    };
    const nagpurPoint: LocationPoint = { name: 'Zero Mile, Nagpur', lat: 21.1458, lng: 79.0882 };

    const waypoints = intermediateTownsService.getWaypointsForRoute(nagpurRoute, mumbaiPoint, nagpurPoint);
    expect(waypoints.length).toBeGreaterThanOrEqual(8);

    const names = waypoints.map((w) => w.name);
    expect(names.some((n) => n.includes('Kasara') || n.includes('Igatpuri'))).toBe(true);
    expect(names.some((n) => n.includes('Shirdi'))).toBe(true);
    expect(names.some((n) => n.includes('Sambhajinagar'))).toBe(true);
    expect(names.some((n) => n.includes('Wardha'))).toBe(true);
  });

  it('generates waypoints for Pune-Mahabaleshwar getaway corridor', () => {
    const mahabaleshwarRoute: RouteOption = {
      ...dummyRoute,
      distanceMeters: 125000,
      durationSeconds: 9900,
    };
    const mahabaleshwarPoint: LocationPoint = { name: 'Mapro Garden, Mahabaleshwar', lat: 17.9237, lng: 73.6586 };

    const waypoints = intermediateTownsService.getWaypointsForRoute(mahabaleshwarRoute, punePoint, mahabaleshwarPoint);
    const names = waypoints.map((w) => w.name);

    expect(names.some((n) => n.includes('Khed Shivapur'))).toBe(true);
    expect(names.some((n) => n.includes('Wai'))).toBe(true);
    expect(names.some((n) => n.includes('Pasarni Ghat') || n.includes('Panchgani'))).toBe(true);
  });

  it('generates waypoints for Mumbai-Goa NH 66 corridor', () => {
    const goaRoute: RouteOption = {
      ...dummyRoute,
      distanceMeters: 540000,
      durationSeconds: 34000,
    };
    const panvelPoint: LocationPoint = { name: 'Panvel, Navi Mumbai', lat: 18.989, lng: 73.117 };
    const goaPoint: LocationPoint = { name: 'Sawantwadi / Goa Border', lat: 15.905, lng: 73.821 };

    const waypoints = intermediateTownsService.getWaypointsForRoute(goaRoute, panvelPoint, goaPoint);
    const names = waypoints.map((w) => w.name);

    expect(names.some((n) => n.includes('Mangaon'))).toBe(true);
    expect(names.some((n) => n.includes('Chiplun'))).toBe(true);
    expect(names.some((n) => n.includes('Kankavli') || n.includes('Sawantwadi'))).toBe(true);
  });

  it('generates generic milestones for other Indian highway routes', () => {
    const genericRoute: RouteOption = {
      ...dummyRoute,
      distanceMeters: 80000,
    };
    const startPoint: LocationPoint = { name: 'Jalgaon', lat: 21.007, lng: 75.562 };
    const endPoint: LocationPoint = { name: 'Dhule', lat: 20.904, lng: 74.774 };

    const waypoints = intermediateTownsService.getWaypointsForRoute(genericRoute, startPoint, endPoint);
    expect(waypoints.length).toBeGreaterThanOrEqual(4);
    expect(waypoints[0].distanceKm).toBe(0);
    expect(waypoints[waypoints.length - 1].distanceKm).toBe(80);
  });
});
