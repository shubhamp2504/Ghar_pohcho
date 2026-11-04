import { describe, it, expect } from 'vitest';
import {
  decodePolyline,
  calculateAdditionalDelay,
  formatDistance,
  formatDuration,
  formatDelay,
  formatETA,
  calculateHaversineDistance,
  getCongestionColor,
} from './geo';

describe('Geo & Delay Utilities', () => {
  it('correctly calculates additional delay formula', () => {
    // Traffic duration: 1 hr 30 min (5400s), Baseline static: 1 hr 10 min (4200s)
    const delay = calculateAdditionalDelay(5400, 4200);
    expect(delay).toBe(1200); // 20 minutes

    // When traffic is faster or equal to static baseline (free flow)
    const noDelay = calculateAdditionalDelay(4000, 4200);
    expect(noDelay).toBe(0);

    // Edge cases with 0 or negative
    expect(calculateAdditionalDelay(0, 0)).toBe(0);
  });

  it('formats distance in English, Hindi, and Marathi', () => {
    expect(formatDistance(148000, 'en')).toBe('148 km');
    expect(formatDistance(148000, 'hi')).toBe('148 किमी');
    expect(formatDistance(148000, 'mr')).toBe('148 किमी');

    // Fractional km below 10 km
    expect(formatDistance(4500, 'en')).toBe('4.5 km');
  });

  it('formats duration in English, Hindi, and Marathi', () => {
    const seconds = 8100; // 2 hours 15 minutes
    expect(formatDuration(seconds, 'en')).toBe('2 hr 15 min');
    expect(formatDuration(seconds, 'hi')).toBe('2 घंटे 15 मिनट');
    expect(formatDuration(seconds, 'mr')).toBe('2 तास 15 मिनिटे');

    // Minutes only
    expect(formatDuration(1500, 'en')).toBe('25 min');
    expect(formatDuration(1500, 'hi')).toBe('25 मिनट');
    expect(formatDuration(1500, 'mr')).toBe('25 मिनिटे');
  });

  it('formats delay badge with severity tiers', () => {
    // Normal traffic (< 3 min)
    const normal = formatDelay(120, 'en');
    expect(normal.isSignificant).toBe(false);
    expect(normal.severity).toBe('none');

    // Moderate delay (10 min = 600s)
    const moderate = formatDelay(600, 'en');
    expect(moderate.isSignificant).toBe(true);
    expect(moderate.severity).toBe('moderate');
    expect(moderate.text).toContain('+10 min traffic delay');

    // High delay (25 min = 1500s) in Marathi
    const highMr = formatDelay(1500, 'mr');
    expect(highMr.isSignificant).toBe(true);
    expect(highMr.severity).toBe('high');
    expect(highMr.text).toContain('+25 मि वाहतूक विलंब');
  });

  it('decodes encoded polylines correctly', () => {
    // Encoded polyline for points near Mumbai [(19.0760, 72.8777), (19.0800, 72.8800)]
    // Let's test with a known valid Google polyline string
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePolyline(encoded);
    expect(decoded.length).toBeGreaterThan(0);
    expect(decoded[0][0]).toBeCloseTo(38.5, 0.1);
  });

  it('formats ETA timestamp in 12-hour format with AM/PM', () => {
    // 2026-11-04 16:30:00 (04:30 PM)
    const testDate = new Date(2026, 10, 4, 16, 30, 0);
    const etaEn = formatETA(testDate, 'en');
    expect(etaEn).toContain('4:30 PM');

    const etaHi = formatETA(testDate, 'hi');
    expect(etaHi).toContain('4:30');
  });

  it('calculates Haversine distance correctly between two points', () => {
    // Mumbai (18.9220, 72.8347) to Pune (18.5204, 73.8567)
    // Approximate straight-line distance is ~120 km (115-130 km)
    const dist = calculateHaversineDistance([18.9220, 72.8347], [18.5204, 73.8567]);
    expect(dist).toBeGreaterThan(110000);
    expect(dist).toBeLessThan(140000);
  });

  it('returns valid traffic condition hex colors', () => {
    expect(getCongestionColor('NORMAL')).toBe('#10B981');
    expect(getCongestionColor('HEAVY')).toBe('#DC2626');
    expect(getCongestionColor('SEVERE')).toBe('#991B1B');
  });
});
