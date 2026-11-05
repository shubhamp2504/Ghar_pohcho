import { describe, it, expect } from 'vitest';
import { corridorStopsService } from './corridorStopsService';

describe('CorridorStopsService', () => {
  it('returns empty array when route polyline is empty or invalid', () => {
    expect(corridorStopsService.findStopsAlongRoute([])).toEqual([]);
    expect(corridorStopsService.findStopsAlongRoute([[19.0, 72.8]])).toEqual([]);
  });

  it('detects stops along Mumbai-Pune expressway corridor and sorts by distance', () => {
    // Coarse polyline simulating Mumbai (Chembur) to Pune (Shivajinagar)
    const mumbaiPunePolyline: [number, number][] = [
      [19.052, 72.899], // Chembur
      [19.033, 73.029], // Vashi
      [19.019, 73.092], // Kamothe
      [18.989, 73.123], // Panvel
      [18.817, 73.284], // Khalapur Toll
      [18.808, 73.298], // Khalapur Food Mall
      [18.756, 73.407], // Khandala / Lonavala
      [18.735, 73.658], // Urse
      [18.728, 73.672], // Talegaon Toll
      [18.627, 73.805], // Pimpri Chinchwad
      [18.531, 73.844], // Pune Shivajinagar
    ];

    const stops = corridorStopsService.findStopsAlongRoute(mumbaiPunePolyline, 5000);

    expect(stops.length).toBeGreaterThan(0);

    // Verify Khalapur food mall and Urse are found
    const names = stops.map((s) => s.name);
    expect(names.some((n) => n.includes('Khalapur'))).toBe(true);
    expect(names.some((n) => n.includes('Urse') || n.includes('Talegaon'))).toBe(true);

    // Verify sorted chronologically
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].distanceAlongRouteKm).toBeGreaterThanOrEqual(stops[i - 1].distanceAlongRouteKm);
    }
  });

  it('filters stops correctly by category', () => {
    const mumbaiPunePolyline: [number, number][] = [
      [19.052, 72.899],
      [18.808, 73.298],
      [18.735, 73.658],
      [18.531, 73.844],
    ];

    const stops = corridorStopsService.findStopsAlongRoute(mumbaiPunePolyline, 6000);
    const evStops = corridorStopsService.filterByCategory(stops, 'EV_CHARGER');
    const foodStops = corridorStopsService.filterByCategory(stops, 'DHABA_FOOD');

    expect(evStops.every((s) => s.category === 'EV_CHARGER')).toBe(true);
    expect(foodStops.every((s) => s.category === 'DHABA_FOOD')).toBe(true);
  });
});

