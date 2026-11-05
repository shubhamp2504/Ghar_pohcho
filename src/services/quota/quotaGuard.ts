import type { LocationPoint, RouteCalculationResult } from '../../types/routing';

const USAGE_STORAGE_KEY = 'gharpahucho_api_usage_v2';
const ROUTE_CACHE_STORAGE_KEY = 'gharpahucho_route_cache_v2';

export interface ApiUsageStats {
  monthlyCalls: number;
  monthlyLimit: number;
  todayCalls: number;
  lastResetMonth: string;
}

export class QuotaGuard {
  // Generous monthly safety limit aligned with Google's $200 free tier credit
  private defaultMonthlyLimit = 20000; // Up to 20,000 calls/month covered by Google's $200 free credit

  constructor() {
    this.ensureReset();
  }

  getStats(): ApiUsageStats {
    this.ensureReset();
    const raw = this.getRawUsage();
    const monthlyLimit = raw.monthlyLimit ?? this.defaultMonthlyLimit;
    const todayCalls = raw.todayCalls ?? 0;
    const monthlyCalls = raw.monthlyCalls ?? 0;

    return {
      todayCalls,
      monthlyCalls,
      monthlyLimit,
      lastResetMonth: raw.lastResetMonth,
    };
  }

  canMakeGoogleCall(): boolean {
    const stats = this.getStats();
    // No daily limit! Only checks that monthly usage stays within free tier credit
    return stats.monthlyCalls < stats.monthlyLimit;
  }

  recordGoogleCall(type: 'ROUTES' | 'PLACES' = 'ROUTES'): void {
    this.ensureReset();
    const raw = this.getRawUsage();
    raw.todayCalls = (raw.todayCalls || 0) + 1;
    raw.monthlyCalls = (raw.monthlyCalls || 0) + 1;
    raw[type.toLowerCase() + '_calls'] = (raw[type.toLowerCase() + '_calls'] || 0) + 1;
    this.saveRawUsage(raw);
  }

  // -------------------------------------------------------------
  // Route Caching (Deduplication - Instant Response)
  // -------------------------------------------------------------
  getCachedRoute(
    origin: LocationPoint,
    dest: LocationPoint,
    departureTime?: string
  ): RouteCalculationResult | null {
    if (typeof window === 'undefined') return null;
    const key = this.generateCacheKey(origin, dest, departureTime);

    try {
      const raw = localStorage.getItem(ROUTE_CACHE_STORAGE_KEY);
      if (!raw) return null;
      const cache: Record<string, { result: RouteCalculationResult; expiresAt: number }> = JSON.parse(raw);
      const entry = cache[key];
      if (entry && entry.expiresAt > Date.now()) {
        return entry.result;
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }

  setCachedRoute(
    origin: LocationPoint,
    dest: LocationPoint,
    result: RouteCalculationResult,
    departureTime?: string,
    ttlMinutes = 15
  ): void {
    if (typeof window === 'undefined') return;
    const key = this.generateCacheKey(origin, dest, departureTime);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    try {
      const raw = localStorage.getItem(ROUTE_CACHE_STORAGE_KEY);
      const cache: Record<string, { result: RouteCalculationResult; expiresAt: number }> = raw ? JSON.parse(raw) : {};

      const now = Date.now();
      for (const k of Object.keys(cache)) {
        if (cache[k].expiresAt < now) {
          delete cache[k];
        }
      }

      cache[key] = { result, expiresAt };
      localStorage.setItem(ROUTE_CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Storage safe
    }
  }

  private generateCacheKey(
    origin: LocationPoint,
    dest: LocationPoint,
    departureTime?: string
  ): string {
    const oLat = origin.lat.toFixed(3);
    const oLng = origin.lng.toFixed(3);
    const dLat = dest.lat.toFixed(3);
    const dLng = dest.lng.toFixed(3);
    const dep = departureTime && departureTime !== 'now' ? departureTime.substring(0, 13) : 'now';
    return `${oLat},${oLng}_to_${dLat},${dLng}_${dep}`;
  }

  private ensureReset(): void {
    if (typeof window === 'undefined') return;
    const raw = this.getRawUsage();
    const today = new Date().toISOString().substring(0, 10);
    const month = today.substring(0, 7);

    let changed = false;

    if (raw.lastResetDay !== today) {
      raw.todayCalls = 0;
      raw.lastResetDay = today;
      changed = true;
    }

    if (raw.lastResetMonth !== month) {
      raw.monthlyCalls = 0;
      raw.lastResetMonth = month;
      changed = true;
    }

    if (changed) {
      this.saveRawUsage(raw);
    }
  }

  private getRawUsage(): Record<string, any> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(USAGE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveRawUsage(obj: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // Ignore
    }
  }
}

export const quotaGuard = new QuotaGuard();
