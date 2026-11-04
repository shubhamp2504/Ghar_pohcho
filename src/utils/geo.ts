import type { Language, CongestionLevel } from '../types/routing';

/**
 * Decodes a Google Encoded Polyline string into an array of [latitude, longitude] pairs.
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Calculates additional traffic delay according to product specification formula:
 * Additional Delay = max(0, Traffic-Aware Duration - Comparable Baseline Duration)
 */
export function calculateAdditionalDelay(trafficDurationSeconds: number, staticBaselineDurationSeconds: number): number {
  if (!trafficDurationSeconds || !staticBaselineDurationSeconds) return 0;
  return Math.max(0, Math.round(trafficDurationSeconds - staticBaselineDurationSeconds));
}

/**
 * Converts meters to kilometers formatted string.
 */
export function formatDistance(meters: number, language: Language = 'en'): string {
  const km = (meters / 1000).toFixed(meters >= 10000 ? 0 : 1);
  if (language === 'hi') return `${km} किमी`;
  if (language === 'mr') return `${km} किमी`;
  return `${km} km`;
}

/**
 * Formats duration in seconds to human readable hours and minutes.
 */
export function formatDuration(seconds: number, language: Language = 'en'): string {
  if (seconds <= 0) return language === 'en' ? '0 min' : '० मि';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (language === 'hi') {
    if (hours === 0) return `${minutes} मिनट`;
    if (minutes === 0) return `${hours} घंटे`;
    return `${hours} घंटे ${minutes} मिनट`;
  }

  if (language === 'mr') {
    if (hours === 0) return `${minutes} मिनिटे`;
    if (minutes === 0) return `${hours} तास`;
    return `${hours} तास ${minutes} मिनिटे`;
  }

  // English
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/**
 * Formats additional traffic delay into an easily digestible badge.
 */
export function formatDelay(delaySeconds: number, language: Language = 'en'): {
  text: string;
  isSignificant: boolean;
  severity: 'low' | 'moderate' | 'high' | 'none';
} {
  const minutes = Math.round(delaySeconds / 60);

  if (minutes < 3) {
    const text = language === 'hi' ? 'ट्रैफ़िक सामान्य' : language === 'mr' ? 'वाहतूक सुरळीत' : 'Normal traffic';
    return { text, isSignificant: false, severity: 'none' };
  }

  let severity: 'low' | 'moderate' | 'high' = 'low';
  if (minutes >= 20) severity = 'high';
  else if (minutes >= 8) severity = 'moderate';

  let text = '';
  if (language === 'hi') {
    text = `+${minutes} मिनट ट्रैफ़िक देरी`;
  } else if (language === 'mr') {
    text = `+${minutes} मि वाहतूक विलंब`;
  } else {
    text = `+${minutes} min traffic delay`;
  }

  return { text, isSignificant: true, severity };
}

/**
 * Formats an ISO timestamp or Date into arrival time in user's locale.
 */
export function formatETA(dateOrIso: string | Date, language: Language = 'en'): string {
  const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(date.getTime())) return '--:--';

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? (language === 'en' ? 'PM' : language === 'hi' ? 'दोपहर/शाम' : 'दु./संध्याकाळी') : (language === 'en' ? 'AM' : language === 'hi' ? 'सुबह' : 'सकाळी');
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateHaversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Determines traffic segment color based on CongestionLevel
 */
export function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case 'NORMAL':
      return '#10B981'; // Emerald 500
    case 'MODERATE':
      return '#F59E0B'; // Amber 500
    case 'SLOW':
      return '#EA580C'; // Orange 600
    case 'HEAVY':
      return '#DC2626'; // Red 600
    case 'SEVERE':
      return '#991B1B'; // Dark Red 800
    default:
      return '#3B82F6'; // Default Route Blue
  }
}
