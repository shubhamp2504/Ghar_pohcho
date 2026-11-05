import type { LocationPoint, RouteCalculationResult } from '../../types/routing';

const USAGE_STORAGE_KEY = 'gharpahucho_api_usage_v1';
const ROUTE_CACHE_STORAGE_KEY = 'gharpahucho_route_cache_v1';

export interface ApiUsageStats {
  todayCalls: number;
  monthlyCalls: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingToday: number;
  isLimitReached: boolean;
  hardStopEnabled: boolean;
  lastResetDay: string;
  lastResetMonth: string;
}

export class QuotaGuard {
  // Conservative safety limits to guarantee $0 spend (well within Google's free $200 tier)
  private defaultDailyLimit = 50; // max 50 calls/day
  private defaultMonthlyLimit = 1000; // max 1,000 calls/month (Google free tier allows up to 20,000!)

  constructor() {
    this.ensureReset();
  }

  getStats(): ApiUsageStats {
    this.ensureReset();
    const raw = this.getRawUsage();
    const dailyLimit = raw.dailyLimit ?? this.defaultDailyLimit;
    const monthlyLimit = raw.monthlyLimit ?? this.defaultMonthlyLimit;
    const todayCalls = raw.todayCalls ?? 0;
    const monthlyCalls = raw.monthlyCalls ?? 0;
    const remainingToday = Math.max(0, dailyLimit - todayCalls);
    const hardStopEnabled = raw.hardStopEnabled !== false; // default true
    const isLimitReached = hardStopEnabled && (todayCalls >= dailyLimit || monthlyCalls >= monthlyLimit);

    return {
      todayCalls,
      monthlyCalls,
      dailyLimit,
      monthlyLimit,
      remainingToday,
      isLimitReached,
      hardStopEnabled,
      lastResetDay: raw.lastResetDay,
      lastResetMonth: raw.lastResetMonth,
    };
  }

  setDailyLimit(limit: number): void {
    const raw = this.getRawUsage();
    raw.dailyLimit = Math.max(1, limit);
    this.saveRawUsage(raw);
  }

  setHardStopEnabled(enabled: boolean): void {
    const raw = this.getRawUsage();
    raw.hardStopEnabled = enabled;
    this.saveRawUsage(raw);
  }

  canMakeGoogleCall(): boolean {
    const stats = this.getStats();
    if (!stats.hardStopEnabled) return true;
    return !stats.isLimitReached;
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
  // Route Caching (Deduplication - Prevents repeating identical calls)
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
    ttlMinutes = 15 // 15-minute cache TTL
  ): void {
    if (typeof window === 'undefined') return;
    const key = this.generateCacheKey(origin, dest, departureTime);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    try {
      const raw = localStorage.getItem(ROUTE_CACHE_STORAGE_KEY);
      const cache: Record<string, { result: RouteCalculationResult; expiresAt: number }> = raw ? JSON.parse(raw) : {};

      // Cleanup expired keys
      const now = Date.now();
      for (const k of Object.keys(cache)) {
        if (cache[k].expiresAt < now) {
          delete cache[k];
        }
      }

      cache[key] = { result, expiresAt };
      localStorage.setItem(ROUTE_CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Storage full/quota handled safely
    }
  }

  private generateCacheKey(
    origin: LocationPoint,
    dest: LocationPoint,
    departureTime?: string
  ): string {
    // Round coordinates to 3 decimals (~110m) to group very close requests
    const oLat = origin.lat.toFixed(3);
    const oLng = origin.lng.toFixed(3);
    const dLat = dest.lat.toFixed(3);
    const dLng = dest.lng.toFixed(3);
    const dep = departureTime && departureTime !== 'now' ? departureTime.substring(0, 13) : 'now'; // group by hour
    return `${oLat},${oLng}_to_${dLat},${dLng}_${dep}`;
  }

  private ensureReset(): void {
    if (typeof window === 'undefined') return;
    const raw = this.getRawUsage();
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const month = today.substring(0, 7); // YYYY-MM

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
