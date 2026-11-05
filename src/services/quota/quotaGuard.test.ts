import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaGuard } from './quotaGuard';
import type { LocationPoint, RouteCalculationResult } from '../../types/routing';

describe('QuotaGuard (Zero Spend Protection without Daily Limit)', () => {
  let guard: QuotaGuard;

  const mumbai: LocationPoint = {
    name: 'Bandra, Mumbai',
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
    guard = new QuotaGuard();
  });

  it('initializes with full monthly free tier limit and no daily restriction', () => {
    const stats = guard.getStats();
    expect(stats.todayCalls).toBe(0);
    expect(stats.monthlyCalls).toBe(0);
    expect(stats.monthlyLimit).toBe(20000); // 20k free quota
    expect(guard.canMakeGoogleCall()).toBe(true);
  });

  it('records Google API calls accurately', () => {
    guard.recordGoogleCall('ROUTES');
    guard.recordGoogleCall('ROUTES');

    const stats = guard.getStats();
    expect(stats.todayCalls).toBe(2);
    expect(stats.monthlyCalls).toBe(2);
    expect(guard.canMakeGoogleCall()).toBe(true);
  });

  it('caches routes to prevent repeating identical API requests', () => {
    const dummyResult: RouteCalculationResult = {
      routes: [],
      selectedRouteIndex: 0,
      origin: mumbai,
      destination: pune,
      computedAt: new Date().toISOString(),
      source: 'GOOGLE_ROUTES_API',
    };

    expect(guard.getCachedRoute(mumbai, pune)).toBeNull();

    guard.setCachedRoute(mumbai, pune, dummyResult, 'now', 15);

    const cached = guard.getCachedRoute(mumbai, pune);
    expect(cached).toBeDefined();
    expect(cached?.source).toBe('GOOGLE_ROUTES_API');
  });
});
