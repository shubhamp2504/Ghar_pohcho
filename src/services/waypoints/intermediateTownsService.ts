import type { HighwayWaypoint, WaypointStatus } from '../../types/waypoints';
import type { RouteOption, LocationPoint, TrafficSegment } from '../../types/routing';
import { calculateHaversineDistance } from '../../utils/geo';

interface MilestoneSpec {
  id: string;
  name: string;
  localName?: { hi: string; mr: string };
  distanceKm: number;
  lat: number;
  lng: number;
  defaultHighlight?: string;
  isOrigin?: boolean;
  isDestination?: boolean;
}

export class IntermediateTownsService {
  /**
   * Generates authentic step-by-step intermediate towns guide.
   * Milestone traffic statuses are DYNAMICALLY resolved against real live sensor traffic segments.
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

    const calcEta = (fraction: number): string => {
      const etaTime = new Date(now.getTime() + totalDurationSec * fraction * 1000);
      return etaTime.toISOString();
    };

    let specs: MilestoneSpec[] = [];

    // 1. Mumbai <-> Pune Corridor
    if (
      (originClean.includes('mumbai') || originClean.includes('chembur') || originClean.includes('thane') || originClean.includes('navi')) &&
      (destClean.includes('pune') || destClean.includes('pcmc') || destClean.includes('kothrud') || destClean.includes('shivajinagar'))
    ) {
      specs = [
        {
          id: 'wp_mp_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई (शुरुआत)', mr: 'मुंबई (सुरुवात)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Expressway Corridor',
          isOrigin: true,
        },
        {
          id: 'wp_mp_1',
          name: 'Vashi Creek & Navi Mumbai',
          localName: { hi: 'वाशी क्रीक ब्रिज', mr: 'वाशी खाडी पूल' },
          distanceKm: 22,
          lat: 19.065,
          lng: 72.998,
          defaultHighlight: 'Sion-Panvel Expressway Stretch',
        },
        {
          id: 'wp_mp_2',
          name: 'Panvel / Kalamboli Junction',
          localName: { hi: 'पनवेल जंक्शन', mr: 'पनवेल जंक्शन' },
          distanceKm: 38,
          lat: 18.995,
          lng: 73.118,
          defaultHighlight: 'Expressway Zero-Mile Start',
        },
        {
          id: 'wp_mp_3',
          name: 'Khalapur Toll & Food Plaza',
          localName: { hi: 'खालापूर टोल व फूड मॉल', mr: 'खालापूर टोल व फूड मॉल' },
          distanceKm: 54,
          lat: 18.8175,
          lng: 73.284,
          defaultHighlight: 'Fastag Toll Plaza • McDonald’s / Starbucks',
        },
        {
          id: 'wp_mp_4',
          name: 'Khandala & Lonavala Ghat',
          localName: { hi: 'खंडाला व लोनावला घाट', mr: 'खंडाळा व लोणावळा घाट' },
          distanceKm: 74,
          lat: 18.756,
          lng: 73.407,
          defaultHighlight: 'Scenic Mountain Pass • Keep in Lower Gear',
        },
        {
          id: 'wp_mp_5',
          name: 'Urse Food Mall & Talegaon Toll',
          localName: { hi: 'उर्से फूड मॉल व टोल', mr: 'उर्से फूड मॉल व टोल' },
          distanceKm: 98,
          lat: 18.735,
          lng: 73.658,
          defaultHighlight: 'Final Expressway Toll • Fuel & EV Hub',
        },
        {
          id: 'wp_mp_6',
          name: 'Dehu Road & PCMC Entry',
          localName: { hi: 'देहू रोड / पिंपरी', mr: 'देहू रोड / पिंपरी' },
          distanceKm: 124,
          lat: 18.665,
          lng: 73.745,
          defaultHighlight: 'Pune Outer Bypass Entry',
        },
        {
          id: 'wp_mp_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'पुणे (पहुंच)', mr: 'पुणे (आगमन)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Destination Arrival',
          isDestination: true,
        },
      ];
    } else if (
      (originClean.includes('delhi') || originClean.includes('gurgaon')) &&
      destClean.includes('jaipur')
    ) {
      // 2. Delhi <-> Jaipur Corridor
      specs = [
        {
          id: 'wp_dj_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Journey Origin',
          isOrigin: true,
        },
        {
          id: 'wp_dj_1',
          name: 'Gurugram (Kherki Daula Toll)',
          distanceKm: 34,
          lat: 28.399,
          lng: 76.974,
          defaultHighlight: 'Fastag Toll Plaza',
        },
        {
          id: 'wp_dj_2',
          name: 'Dharuhera & Manesar Industrial',
          distanceKm: 68,
          lat: 28.214,
          lng: 76.804,
          defaultHighlight: 'Popular Highway Dhabas',
        },
        {
          id: 'wp_dj_3',
          name: 'Behror Highway Midway & Oasis',
          distanceKm: 126,
          lat: 27.892,
          lng: 76.284,
          defaultHighlight: 'Highway King • Fuel COCO • Restrooms',
        },
        {
          id: 'wp_dj_4',
          name: 'Kotputli & Shahpura Bypass',
          distanceKm: 198,
          lat: 27.531,
          lng: 75.962,
          defaultHighlight: 'Expressway Toll Gate',
        },
        {
          id: 'wp_dj_5',
          name: destination.name.split(',')[0],
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Pink City Arrival',
          isDestination: true,
        },
      ];
    } else {
      // 3. Generic Dynamic Milestones for any other Indian route
      specs = [
        {
          id: 'wp_gen_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Journey',
          isOrigin: true,
        },
      ];

      if (totalDistKm >= 25) {
        const hasPoints = route.polyline && route.polyline.length >= 4;
        const p1 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.25)]
          : [origin.lat + (destination.lat - origin.lat) * 0.25, origin.lng + (destination.lng - origin.lng) * 0.25];
        const p2 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.5)]
          : [origin.lat + (destination.lat - origin.lat) * 0.5, origin.lng + (destination.lng - origin.lng) * 0.5];
        const p3 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.75)]
          : [origin.lat + (destination.lat - origin.lat) * 0.75, origin.lng + (destination.lng - origin.lng) * 0.75];

        specs.push({
          id: 'wp_gen_1',
          name: 'First Highway Milestone',
          distanceKm: Math.round(totalDistKm * 0.25),
          lat: p1[0],
          lng: p1[1],
          defaultHighlight: 'City Exit Stretch',
        });

        specs.push({
          id: 'wp_gen_2',
          name: 'Midway Rest & Toll Crossing',
          distanceKm: Math.round(totalDistKm * 0.5),
          lat: p2[0],
          lng: p2[1],
          defaultHighlight: 'Highway Midway Junction',
        });

        specs.push({
          id: 'wp_gen_3',
          name: 'Approaching Destination District',
          distanceKm: Math.round(totalDistKm * 0.75),
          lat: p3[0],
          lng: p3[1],
          defaultHighlight: 'Outer Ring Entry',
        });
      }

      specs.push({
        id: 'wp_gen_dest',
        name: destination.name.split(',')[0],
        distanceKm: totalDistKm,
        lat: destination.lat,
        lng: destination.lng,
        defaultHighlight: 'Trip Destination',
        isDestination: true,
      });
    }

    // Authentically resolve live status for each milestone against real live trafficSegments
    return specs.map((spec) => {
      const fraction = totalDistKm > 0 ? spec.distanceKm / totalDistKm : 0;
      const eta = calcEta(fraction);

      const liveMatch = this.findMatchingTrafficSegment(
        spec.lat,
        spec.lng,
        route.trafficSegments
      );

      let status: WaypointStatus = 'CLEAR';
      let delaySeconds = 0;
      let highlight = spec.defaultHighlight;

      if (liveMatch && liveMatch.delaySeconds > 30) {
        status =
          liveMatch.congestionLevel === 'SEVERE' || liveMatch.congestionLevel === 'HEAVY'
            ? 'CONGESTED'
            : 'MODERATE';
        delaySeconds = liveMatch.delaySeconds;
        highlight = `${liveMatch.roadName} (+${Math.round(delaySeconds / 60)}m delay)`;
      }

      return {
        id: spec.id,
        name: spec.name,
        localName: spec.localName,
        distanceKm: spec.distanceKm,
        estimatedArrival: eta,
        status,
        delaySeconds,
        highlight,
        isOrigin: spec.isOrigin,
        isDestination: spec.isDestination,
      };
    });
  }

  private findMatchingTrafficSegment(
    lat: number,
    lng: number,
    segments: TrafficSegment[]
  ): TrafficSegment | null {
    if (!segments || segments.length === 0) return null;

    for (const seg of segments) {
      const dStart = calculateHaversineDistance([lat, lng], seg.startPoint);
      const dEnd = calculateHaversineDistance([lat, lng], seg.endPoint);
      if (dStart <= 4000 || dEnd <= 4000) {
        return seg;
      }
    }
    return null;
  }
}

export const intermediateTownsService = new IntermediateTownsService();
