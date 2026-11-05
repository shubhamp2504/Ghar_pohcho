import type {
  RouteRequest,
  RouteCalculationResult,
  LocationPoint,
} from '../../types/routing';
import { GoogleRoutesProvider } from './googleRoutesProvider';
import { FreeOsrmRoutingProvider } from './freeOsrmProvider';
import { MockRoutingProvider } from './mockRoutingProvider';
import { quotaGuard } from '../quota/quotaGuard';

const API_KEY_STORAGE_KEY = 'gharpahucho_google_api_key';
const RECENT_SEARCHES_STORAGE_KEY = 'gharpahucho_recent_searches';

export class RoutingService {
  private googleProvider: GoogleRoutesProvider;
  private freeOsrmProvider: FreeOsrmRoutingProvider;
  private mockProvider: MockRoutingProvider;

  constructor() {
    const savedKey = this.getStoredApiKey();
    this.googleProvider = new GoogleRoutesProvider(savedKey);
    this.freeOsrmProvider = new FreeOsrmRoutingProvider();
    this.mockProvider = new MockRoutingProvider();
  }

  getStoredApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(API_KEY_STORAGE_KEY) ||
      (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
      null
    );
  }

  setApiKey(key: string | null): void {
    if (typeof window === 'undefined') return;
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
      this.googleProvider.setApiKey(key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      this.googleProvider.setApiKey(null);
    }
  }

  hasConfiguredApiKey(): boolean {
    return this.googleProvider.isConfigured();
  }

  async calculateRoutes(request: RouteRequest): Promise<RouteCalculationResult> {
    // 1. Check Short-Lived Cache (Deduplication - prevents repeating identical API queries)
    const cached = quotaGuard.getCachedRoute(request.origin, request.destination, request.departureTime);
    if (cached) {
      this.saveRecentSearch(request.origin, request.destination);
      return cached;
    }

    // 2. If user provided a Google Key, check Safety Quota Guard before making call
    if (this.googleProvider.isConfigured()) {
      if (quotaGuard.canMakeGoogleCall()) {
        try {
          const result = await this.googleProvider.calculateRoutes(request);
          quotaGuard.recordGoogleCall('ROUTES');
          quotaGuard.setCachedRoute(request.origin, request.destination, result, request.departureTime);
          this.saveRecentSearch(request.origin, request.destination);
          return result;
        } catch (err: unknown) {
          console.warn('Google Routes API call failed, falling back to 100% Free OSRM:', err);
        }
      } else {
        console.warn('Google API daily free quota cap reached! Automatic circuit breaker tripped to guarantee $0 spend.');
      }
    }

    // 3. 100% Free OpenStreetMap & Community Traffic Engine (Zero Cost, No Billing)
    try {
      const result = await this.freeOsrmProvider.calculateRoutes(request);
      if (this.googleProvider.isConfigured() && !quotaGuard.canMakeGoogleCall()) {
        result.disclaimer = 'Free Google API safety quota reached for today. Switched automatically to Free Open Network to guarantee $0 spend.';
      }
      quotaGuard.setCachedRoute(request.origin, request.destination, result, request.departureTime);
      this.saveRecentSearch(request.origin, request.destination);
      return result;
    } catch (osrmErr) {
      console.warn('Free OSRM network request failed, falling back to Offline Highway Corridor:', osrmErr);
    }

    // 4. Offline Corridor Resilient Fallback
    const result = await this.mockProvider.calculateRoutes(request);
    this.saveRecentSearch(request.origin, request.destination);
    return result;
  }

  getRecentSearches(): Array<{ origin: LocationPoint; destination: LocationPoint; timestamp: string }> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveRecentSearch(origin: LocationPoint, destination: LocationPoint): void {
    if (typeof window === 'undefined') return;
    try {
      const recents = this.getRecentSearches().filter(
        (r) =>
          !(
            r.origin.name === origin.name &&
            r.destination.name === destination.name
          )
      );

      recents.unshift({
        origin,
        destination,
        timestamp: new Date().toISOString(),
      });

      // Keep last 6 searches
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(recents.slice(0, 6)));
    } catch {
      // Storage errors handled silently
    }
  }
}

export const routingService = new RoutingService();
