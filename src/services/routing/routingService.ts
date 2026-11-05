import type {
  RouteRequest,
  RouteCalculationResult,
  LocationPoint,
} from '../../types/routing';
import { GoogleRoutesProvider } from './googleRoutesProvider';
import { TomTomRoutingProvider } from './tomtomProvider';
import { FreeOsrmRoutingProvider } from './freeOsrmProvider';
import { MockRoutingProvider } from './mockRoutingProvider';
import { quotaGuard } from '../quota/quotaGuard';

const GOOGLE_KEY_STORAGE = 'gharpahucho_google_api_key';
const TOMTOM_KEY_STORAGE = 'gharpahucho_tomtom_api_key';
const RECENT_SEARCHES_STORAGE_KEY = 'gharpahucho_recent_searches';

export class RoutingService {
  private googleProvider: GoogleRoutesProvider;
  private tomtomProvider: TomTomRoutingProvider;
  private freeOsrmProvider: FreeOsrmRoutingProvider;
  private mockProvider: MockRoutingProvider;

  constructor() {
    this.googleProvider = new GoogleRoutesProvider(this.getStoredGoogleKey());
    this.tomtomProvider = new TomTomRoutingProvider(this.getStoredTomTomKey());
    this.freeOsrmProvider = new FreeOsrmRoutingProvider();
    this.mockProvider = new MockRoutingProvider();
  }

  getStoredGoogleKey(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(GOOGLE_KEY_STORAGE) ||
      (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
      null
    );
  }

  getStoredApiKey(): string | null {
    return this.getStoredGoogleKey() || this.getStoredTomTomKey();
  }

  setApiKey(key: string | null): void {
    this.setGoogleKey(key);
  }

  getStoredTomTomKey(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(TOMTOM_KEY_STORAGE) ||
      (import.meta.env.VITE_TOMTOM_API_KEY as string | undefined) ||
      null
    );
  }

  setGoogleKey(key: string | null): void {
    if (typeof window === 'undefined') return;
    if (key && key.trim()) {
      localStorage.setItem(GOOGLE_KEY_STORAGE, key.trim());
      this.googleProvider.setApiKey(key.trim());
    } else {
      localStorage.removeItem(GOOGLE_KEY_STORAGE);
      this.googleProvider.setApiKey(null);
    }
  }

  setTomTomKey(key: string | null): void {
    if (typeof window === 'undefined') return;
    if (key && key.trim()) {
      localStorage.setItem(TOMTOM_KEY_STORAGE, key.trim());
      this.tomtomProvider.setApiKey(key.trim());
    } else {
      localStorage.removeItem(TOMTOM_KEY_STORAGE);
      this.tomtomProvider.setApiKey(null);
    }
  }

  hasConfiguredLiveKey(): boolean {
    return this.tomtomProvider.isConfigured() || this.googleProvider.isConfigured();
  }

  hasConfiguredApiKey(): boolean {
    return this.googleProvider.isConfigured();
  }

  getActiveProviderName(): string {
    return 'Live Traffic Intelligence';
  }

  async calculateRoutes(request: RouteRequest): Promise<RouteCalculationResult> {
    // 1. Check Short-Lived Cache (Deduplication - Instant Response & Zero Calls)
    const cached = quotaGuard.getCachedRoute(request.origin, request.destination, request.departureTime);
    if (cached) {
      this.saveRecentSearch(request.origin, request.destination);
      return cached;
    }

    // 2. Primary: TomTom Real-Time Traffic Engine (2,500 Free Requests/Day • No Card Required)
    if (this.tomtomProvider.isConfigured()) {
      try {
        const result = await this.tomtomProvider.calculateRoutes(request);
        quotaGuard.setCachedRoute(request.origin, request.destination, result, request.departureTime);
        this.saveRecentSearch(request.origin, request.destination);
        return result;
      } catch (err: unknown) {
        console.warn('TomTom Live Traffic API call failed, falling back to Free Open Engine:', err);
      }
    }

    // 3. Optional: Google Routes API (if configured)
    if (this.googleProvider.isConfigured()) {
      if (quotaGuard.canMakeGoogleCall()) {
        try {
          const result = await this.googleProvider.calculateRoutes(request);
          quotaGuard.recordGoogleCall('ROUTES');
          quotaGuard.setCachedRoute(request.origin, request.destination, result, request.departureTime);
          this.saveRecentSearch(request.origin, request.destination);
          return result;
        } catch (err: unknown) {
          console.warn('Google Routes API call failed, falling back to Free Open Engine:', err);
        }
      }
    }

    // 4. Default: 100% Free OpenStreetMap & Community Traffic Engine (Zero Cost, No Cards, Unlimited)
    try {
      const result = await this.freeOsrmProvider.calculateRoutes(request);
      quotaGuard.setCachedRoute(request.origin, request.destination, result, request.departureTime);
      this.saveRecentSearch(request.origin, request.destination);
      return result;
    } catch (osrmErr) {
      console.warn('Free OSRM network request failed, falling back to Offline Highway Corridor:', osrmErr);
    }

    // 5. Offline Corridor Resilient Fallback
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

      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(recents.slice(0, 6)));
    } catch {
      // Storage errors handled silently
    }
  }
}

export const routingService = new RoutingService();
