import { describe, it, expect, beforeEach } from 'vitest';
import { RoutingService } from './routingService';
import { GoogleRoutesProvider } from './googleRoutesProvider';
import { MockRoutingProvider } from './mockRoutingProvider';
import type { LocationPoint } from '../../types/routing';

import { FreeOsrmRoutingProvider } from './freeOsrmProvider';

describe('RoutingService & Providers Integration', () => {
  let service: RoutingService;

  const mumbai: LocationPoint = {
    name: 'Bandra West, Mumbai',
    lat: 19.0596,
    lng: 72.8295,
  };

  const pune: LocationPoint = {
    name: 'Koregaon Park, Pune',
    lat: 18.5362,
    lng: 73.8940,
  };

  beforeEach(() => {
    localStorage.clear();
    service = new RoutingService();
  });

  it('correctly calculates routes for Mumbai-Pune corridor using MockRoutingProvider', async () => {
    const mockProvider = new MockRoutingProvider();
    const result = await mockProvider.calculateRoutes({
      origin: mumbai,
      destination: pune,
    });

    expect(result.routes.length).toBeGreaterThanOrEqual(2);

    const recommended = result.routes.find((r) => r.isRecommended);
    expect(recommended).toBeDefined();
    expect(recommended?.name).toContain('Expressway');

    // Verify distance & durations
    expect(recommended?.distanceMeters).toBeGreaterThan(100000); // > 100km
    expect(recommended?.durationSeconds).toBeGreaterThan(recommended!.staticDurationSeconds);

    // Verify delay formula
    const expectedDelay = recommended!.durationSeconds - recommended!.staticDurationSeconds;
    expect(recommended?.additionalDelaySeconds).toBe(expectedDelay);

    // Verify traffic segments exist
    expect(recommended?.trafficSegments.length).toBeGreaterThan(0);
    expect(recommended?.trafficSegments[0].congestionLevel).toBe('HEAVY');
  });

  it('gracefully handles missing API key in GoogleRoutesProvider', async () => {
    const googleProvider = new GoogleRoutesProvider(null);
    expect(googleProvider.isConfigured()).toBe(false);

    await expect(
      googleProvider.calculateRoutes({
        origin: mumbai,
        destination: pune,
      })
    ).rejects.toThrow('Google Routes API key is not configured');
  });

  it('automatically falls back to Mock corridor when Google API fails or is unconfigured', async () => {
    service.setApiKey(null);
    expect(service.hasConfiguredApiKey()).toBe(false);

    const result = await service.calculateRoutes({
      origin: mumbai,
      destination: pune,
    });

    expect(result.source).toBe('MOCK_FIXTURE');
    expect(result.routes.length).toBeGreaterThan(0);
  });

  it('saves and retrieves recent searches in local storage', async () => {
    await service.calculateRoutes({
      origin: mumbai,
      destination: pune,
    });

    const recents = service.getRecentSearches();
    expect(recents.length).toBe(1);
    expect(recents[0].origin.name).toBe(mumbai.name);
    expect(recents[0].destination.name).toBe(pune.name);
  });

  it('handles arbitrary Indian coordinates dynamically', async () => {
    const randomOrigin: LocationPoint = {
      name: 'Origin Point',
      lat: 20.000,
      lng: 74.000,
    };
    const randomDest: LocationPoint = {
      name: 'Destination Point',
      lat: 20.400,
      lng: 74.500,
    };

    const result = await service.calculateRoutes({
      origin: randomOrigin,
      destination: randomDest,
    });

    expect(result.routes.length).toBeGreaterThanOrEqual(2);
    expect(result.routes[0].polyline.length).toBeGreaterThan(2);
    expect(result.routes[0].additionalDelaySeconds).toBeGreaterThanOrEqual(0);
  });

  it('verifies FreeOsrmRoutingProvider requires no API key and calculates 100% free routes', async () => {
    const freeProvider = new FreeOsrmRoutingProvider();
    expect(freeProvider.isConfigured()).toBe(true);

    const result = await freeProvider.calculateRoutes({
      origin: mumbai,
      destination: pune,
    });

    expect(result.routes.length).toBeGreaterThanOrEqual(1);
    expect(result.routes[0].distanceMeters).toBeGreaterThan(120000);
    expect(result.routes[0].polyline.length).toBeGreaterThan(5);
    expect(result.disclaimer).toContain('zero API costs');
  });
});
