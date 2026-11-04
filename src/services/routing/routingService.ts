import type {
  RouteRequest,
  RouteCalculationResult,
  LocationPoint,
} from '../../types/routing';
import { GoogleRoutesProvider } from './googleRoutesProvider';
import { MockRoutingProvider } from './mockRoutingProvider';

const API_KEY_STORAGE_KEY = 'gharpahucho_google_api_key';
const RECENT_SEARCHES_STORAGE_KEY = 'gharpahucho_recent_searches';

export class RoutingService {
  private googleProvider: GoogleRoutesProvider;
  private mockProvider: MockRoutingProvider;

  constructor() {
    const savedKey = this.getStoredApiKey();
    this.googleProvider = new GoogleRoutesProvider(savedKey);
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
    // If Google API is configured, attempt live call first
    if (this.googleProvider.isConfigured()) {
      try {
        const result = await this.googleProvider.calculateRoutes(request);
        this.saveRecentSearch(request.origin, request.destination);
        return result;
      } catch (err: unknown) {
        console.warn('Google Routes API failed, falling back to Corridor Fixture:', err);
        const fallbackResult = await this.mockProvider.calculateRoutes(request);
        const errorMsg = err instanceof Error ? err.message : 'API connection failed';
        fallbackResult.disclaimer = `Live Google Routes API error (${errorMsg}). Displaying offline historical corridor model.`;
        this.saveRecentSearch(request.origin, request.destination);
        return fallbackResult;
      }
    }

    // Default to Offline / Dev Corridor Fixture
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
