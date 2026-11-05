import type { HighwayWaypoint } from '../../types/waypoints';
import type { RouteOption, LocationPoint } from '../../types/routing';

export class IntermediateTownsService {
  /**
   * Generates a step-by-step intermediate towns guide along the highway.
   */
  getWaypointsForRoute(
    route: RouteOption,
    origin: LocationPoint,
    destination: LocationPoint
  ): HighwayWaypoint[] {
    const originClean = origin.name.toLowerCase();
    const destClean = destination.name.toLowerCase();
    const totalDistKm = Math.round(route.distanceMeters / 1000);
    const totalDurationSec = route.durationSeconds;
    const now = new Date();

    // Helper to calculate waypoint arrival time
    const calcEta = (fraction: number): string => {
      const etaTime = new Date(now.getTime() + totalDurationSec * fraction * 1000);
      return etaTime.toISOString();
    };

    // 1. Mumbai <-> Pune Corridor
    if (
      (originClean.includes('mumbai') || originClean.includes('chembur') || originClean.includes('thane') || originClean.includes('navi')) &&
      (destClean.includes('pune') || destClean.includes('pcmc') || destClean.includes('kothrud') || destClean.includes('shivajinagar'))
    ) {
      return [
        {
          id: 'wp_mp_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई (शुरुआत)', mr: 'मुंबई (सुरुवात)' },
          distanceKm: 0,
          estimatedArrival: calcEta(0),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Journey Start Point',
          isOrigin: true,
        },
        {
          id: 'wp_mp_1',
          name: 'Vashi Creek & Navi Mumbai',
          localName: { hi: 'वाशी क्रीक ब्रिज', mr: 'वाशी खाडी पूल' },
          distanceKm: 22,
          estimatedArrival: calcEta(0.16),
          status: 'MODERATE',
          delaySeconds: 180,
          highlight: 'Sion-Panvel Highway Express Stretch',
        },
        {
          id: 'wp_mp_2',
          name: 'Panvel / Kalamboli Junction',
          localName: { hi: 'पनवेल जंक्शन', mr: 'पनवेल जंक्शन' },
          distanceKm: 38,
          estimatedArrival: calcEta(0.28),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Expressway Zero-Mile Start',
        },
        {
          id: 'wp_mp_3',
          name: 'Khalapur Toll & Food Plaza',
          localName: { hi: 'खालापूर टोल व फूड मॉल', mr: 'खालापूर टोल व फूड मॉल' },
          distanceKm: 54,
          estimatedArrival: calcEta(0.42),
          status: route.additionalDelaySeconds > 600 ? 'CONGESTED' : 'MODERATE',
          delaySeconds: Math.min(route.additionalDelaySeconds, 720),
          highlight: 'Fastag Toll Plaza • McDonald’s / Starbucks',
        },
        {
          id: 'wp_mp_4',
          name: 'Khandala & Lonavala Ghat',
          localName: { hi: 'खंडाला व लोनावला घाट', mr: 'खंडाळा व लोणावळा घाट' },
          distanceKm: 74,
          estimatedArrival: calcEta(0.58),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Scenic Mountain Pass • Keep in Lower Gear',
        },
        {
          id: 'wp_mp_5',
          name: 'Urse Food Mall & Talegaon Toll',
          localName: { hi: 'उर्से फूड मॉल व टोल', mr: 'उर्से फूड मॉल व टोल' },
          distanceKm: 98,
          estimatedArrival: calcEta(0.74),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Final Expressway Toll • Fuel & EV Charging',
        },
        {
          id: 'wp_mp_6',
          name: 'Dehu Road & PCMC Entry',
          localName: { hi: 'देहू रोड / पिंपरी', mr: 'देहू रोड / पिंपरी' },
          distanceKm: 124,
          estimatedArrival: calcEta(0.88),
          status: 'MODERATE',
          delaySeconds: 120,
          highlight: 'Pune City Outer Ring Road',
        },
        {
          id: 'wp_mp_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'पुणे (पहुंच)', mr: 'पुणे (आगमन)' },
          distanceKm: totalDistKm,
          estimatedArrival: calcEta(1.0),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Destination Arrival',
          isDestination: true,
        },
      ];
    }

    // 2. Delhi <-> Jaipur Corridor
    if (
      (originClean.includes('delhi') || originClean.includes('gurgaon')) &&
      destClean.includes('jaipur')
    ) {
      return [
        {
          id: 'wp_dj_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          estimatedArrival: calcEta(0),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Start of Trip',
          isOrigin: true,
        },
        {
          id: 'wp_dj_1',
          name: 'Gurugram (Kherki Daula Toll)',
          distanceKm: 34,
          estimatedArrival: calcEta(0.18),
          status: 'MODERATE',
          delaySeconds: 240,
          highlight: 'NH48 Fastag Toll Plaza',
        },
        {
          id: 'wp_dj_2',
          name: 'Dharuhera & Manesar Industrial',
          distanceKm: 68,
          estimatedArrival: calcEta(0.32),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Popular Dhabas & Rest Stops',
        },
        {
          id: 'wp_dj_3',
          name: 'Behror Highway Midway & Oasis',
          distanceKm: 126,
          estimatedArrival: calcEta(0.52),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Highway King • Fuel COCO • Restrooms',
        },
        {
          id: 'wp_dj_4',
          name: 'Kotputli & Shahpura Bypass',
          distanceKm: 198,
          estimatedArrival: calcEta(0.76),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Express Toll Gate',
        },
        {
          id: 'wp_dj_5',
          name: destination.name.split(',')[0],
          distanceKm: totalDistKm,
          estimatedArrival: calcEta(1.0),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Pink City Arrival',
          isDestination: true,
        },
      ];
    }

    // 3. Bengaluru <-> Mysuru Expressway
    if (
      (originClean.includes('bengaluru') || originClean.includes('bangalore')) &&
      (destClean.includes('mysuru') || destClean.includes('mysore'))
    ) {
      return [
        {
          id: 'wp_bm_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          estimatedArrival: calcEta(0),
          status: 'CLEAR',
          delaySeconds: 0,
          isOrigin: true,
        },
        {
          id: 'wp_bm_1',
          name: 'Bidadi (Thatte Idli Hub)',
          distanceKm: 34,
          estimatedArrival: calcEta(0.24),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Traditional Highway Eateries',
        },
        {
          id: 'wp_bm_2',
          name: 'Ramanagara & Channapatna',
          distanceKm: 66,
          estimatedArrival: calcEta(0.46),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Silk City • Midway Fuel & EV Stop',
        },
        {
          id: 'wp_bm_3',
          name: 'Maddur & Mandya Bypass',
          distanceKm: 108,
          estimatedArrival: calcEta(0.72),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Sugar City Bypass',
        },
        {
          id: 'wp_bm_4',
          name: destination.name.split(',')[0],
          distanceKm: totalDistKm,
          estimatedArrival: calcEta(1.0),
          status: 'CLEAR',
          delaySeconds: 0,
          highlight: 'Palace City Arrival',
          isDestination: true,
        },
      ];
    }

    // 4. Dynamic Generic Waypoints for Arbitrary Indian Routes
    const waypoints: HighwayWaypoint[] = [];

    // Origin
    waypoints.push({
      id: 'wp_gen_0',
      name: origin.name.split(',')[0],
      distanceKm: 0,
      estimatedArrival: calcEta(0),
      status: 'CLEAR',
      delaySeconds: 0,
      highlight: 'Start Point',
      isOrigin: true,
    });

    if (totalDistKm >= 25) {
      // Step 1: ~25%
      waypoints.push({
        id: 'wp_gen_1',
        name: 'First Highway Stretch',
        distanceKm: Math.round(totalDistKm * 0.25),
        estimatedArrival: calcEta(0.25),
        status: 'CLEAR',
        delaySeconds: 0,
        highlight: 'City Exit Corridor',
      });

      // Step 2: ~50%
      waypoints.push({
        id: 'wp_gen_2',
        name: 'Midway Rest Area & Highway Junction',
        distanceKm: Math.round(totalDistKm * 0.5),
        estimatedArrival: calcEta(0.5),
        status: route.additionalDelaySeconds > 400 ? 'CONGESTED' : 'CLEAR',
        delaySeconds: Math.round(route.additionalDelaySeconds * 0.6),
        highlight: 'Midway Crossing',
      });

      // Step 3: ~75%
      waypoints.push({
        id: 'wp_gen_3',
        name: 'Approaching Destination District',
        distanceKm: Math.round(totalDistKm * 0.75),
        estimatedArrival: calcEta(0.75),
        status: 'CLEAR',
        delaySeconds: 0,
        highlight: 'Outer Ring Entry',
      });
    }

    // Destination
    waypoints.push({
      id: 'wp_gen_dest',
      name: destination.name.split(',')[0],
      distanceKm: totalDistKm,
      estimatedArrival: calcEta(1.0),
      status: 'CLEAR',
      delaySeconds: 0,
      highlight: 'Arrival',
      isDestination: true,
    });

    return waypoints;
  }
}

export const intermediateTownsService = new IntermediateTownsService();
