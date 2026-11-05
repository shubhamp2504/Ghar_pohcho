import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaGuard } from './quotaGuard';
import type { LocationPoint, RouteCalculationResult } from '../../types/routing';

describe('QuotaGuard (Zero Spend Protection & Circuit Breaker)', () => {
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

  it('initializes with conservative safety limits', () => {
    const stats = guard.getStats();
    expect(stats.todayCalls).toBe(0);
    expect(stats.dailyLimit).toBe(50);
    expect(stats.remainingToday).toBe(50);
    expect(stats.hardStopEnabled).toBe(true);
    expect(stats.isLimitReached).toBe(false);
    expect(guard.canMakeGoogleCall()).toBe(true);
  });

  it('records Google API calls and decrements remaining quota', () => {
    guard.recordGoogleCall('ROUTES');
    guard.recordGoogleCall('ROUTES');

    const stats = guard.getStats();
    expect(stats.todayCalls).toBe(2);
    expect(stats.remainingToday).toBe(48);
  });

  it('trips the circuit breaker automatically when daily limit is reached', () => {
    guard.setDailyLimit(3); // set low limit for test

    guard.recordGoogleCall('ROUTES');
    guard.recordGoogleCall('ROUTES');
    expect(guard.canMakeGoogleCall()).toBe(true);

    guard.recordGoogleCall('ROUTES'); // 3rd call hits limit
    expect(guard.canMakeGoogleCall()).toBe(false);

    const stats = guard.getStats();
    expect(stats.isLimitReached).toBe(true);
    expect(stats.remainingToday).toBe(0);
  });

  it('caches routes to prevent duplicate API requests', () => {
    const dummyResult: RouteCalculationResult = {
      routes: [],
      selectedRouteIndex: 0,
      origin: mumbai,
      destination: pune,
      computedAt: new Date().toISOString(),
      source: 'GOOGLE_ROUTES_API',
    };

    // Before caching
    expect(guard.getCachedRoute(mumbai, pune)).toBeNull();

    // Cache the route
    guard.setCachedRoute(mumbai, pune, dummyResult, 'now', 15);

    // After caching
    const cached = guard.getCachedRoute(mumbai, pune);
    expect(cached).toBeDefined();
    expect(cached?.source).toBe('GOOGLE_ROUTES_API');
  });
});
