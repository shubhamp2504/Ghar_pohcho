import type { CorridorStop, AmenityCategory } from '../../types/stops';
import { calculateHaversineDistance } from '../../utils/geo';

const SEEDED_HIGHWAY_STOPS: Omit<CorridorStop, 'distanceAlongRouteKm' | 'detourMeters'>[] = [
  // --- Mumbai - Pune Expressway / NH 48 ---
  {
    id: 'stop_mumbai_pune_khalapur_mall',
    name: 'Khalapur Food Mall (Expressway Midway)',
    category: 'DHABA_FOOD',
    lat: 18.8085,
    lng: 73.2985,
    brand: "McDonald's, Starbucks & Shiv Sagar",
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Clean AC Washrooms', '24/7 Hot Food', 'Baby Care Room', 'UPI Accepted'],
    rating: 4.5,
    is24x7: true,
    notes: 'Primary highway food hub with clean western washrooms and family dining.',
  },
  {
    id: 'stop_mumbai_pune_hp_khalapur',
    name: 'HP AutoCare COCO Fuel Station',
    category: 'PETROL_PUMP',
    lat: 18.8115,
    lng: 73.3015,
    brand: 'Hindustan Petroleum (COCO)',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Clean Restrooms', 'Free Nitrogen Air', '24/7 Fuel', 'Fastag Payment'],
    rating: 4.4,
    is24x7: true,
    notes: 'Company Owned Company Operated 24/7 pump with verified pure fuel.',
  },
  {
    id: 'stop_mumbai_pune_ev_khalapur',
    name: 'Tata Power 60kW DC Fast EV Hub',
    category: 'EV_CHARGER',
    lat: 18.809,
    lng: 73.299,
    brand: 'Tata Power EZ Charge',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Dual CCS2 60kW Guns', '24/7 Operations', 'Near Food Court', 'App Reservation'],
    rating: 4.6,
    is24x7: true,
    notes: '15-40 min rapid EV top-up while dining at Khalapur Food Court.',
  },
  {
    id: 'stop_mumbai_pune_toll_khalapur',
    name: 'Khalapur Expressway Toll Plaza',
    category: 'TOLL_PLAZA',
    lat: 18.8175,
    lng: 73.284,
    brand: 'MSRDC Fastag Plaza',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['100% Fastag Lanes 1-12', 'Emergency Highway Patrol', 'Ambulance Station'],
    rating: 3.9,
    is24x7: true,
    notes: 'Major expressway toll gate. Keep Fastag recharged to avoid 2x cash penalty.',
  },
  {
    id: 'stop_mumbai_pune_shell_urse',
    name: 'Shell Expressway Service Station Urse',
    category: 'PETROL_PUMP',
    lat: 18.732,
    lng: 73.654,
    brand: 'Shell V-Power & Select Deli',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Spotless Washrooms', 'Shell Select Deli', 'Coffee Machine', 'EV Charger'],
    rating: 4.7,
    is24x7: true,
    notes: 'Known for high quality washrooms and premium coffee & fuel.',
  },
  {
    id: 'stop_mumbai_pune_urse_food',
    name: 'Urse Food Plaza & Highway Rest Area',
    category: 'DHABA_FOOD',
    lat: 18.735,
    lng: 73.658,
    brand: "KFC, Haldiram's & Cafe Coffee Day",
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Clean Restrooms', 'AC Food Court', 'Kids Play Zone', 'Ample Parking'],
    rating: 4.4,
    is24x7: true,
    notes: 'Popular Pune-bound rest stop right before Talegaon toll.',
  },
  {
    id: 'stop_mumbai_pune_ev_urse',
    name: 'Jio-bp Pulse 120kW Superfast Charger',
    category: 'EV_CHARGER',
    lat: 18.7335,
    lng: 73.6555,
    brand: 'Jio-bp pulse',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['120kW Ultra Fast CCS2', 'Canopy Covered', 'Security Guarded'],
    rating: 4.6,
    is24x7: true,
    notes: 'Ultra-fast charging for modern EVs (Tata, Mahindra, MG, BYD).',
  },
  {
    id: 'stop_mumbai_pune_toll_talegaon',
    name: 'Talegaon Toll Plaza',
    category: 'TOLL_PLAZA',
    lat: 18.728,
    lng: 73.672,
    brand: 'MSRDC Fastag Plaza',
    highway: 'Mumbai-Pune Expressway',
    amenities: ['Fastag Automatic Gates', 'Weight Check Lanes'],
    rating: 4.0,
    is24x7: true,
    notes: 'Final expressway toll gate before Pune PCMC entry.',
  },
  {
    id: 'stop_mumbai_pune_hospital_kamothe',
    name: 'MGM Highway Trauma & Emergency Hospital',
    category: 'HOSPITAL',
    lat: 19.019,
    lng: 73.092,
    brand: 'MGM Medical Trust',
    highway: 'Mumbai-Pune Expressway / Sion-Panvel',
    amenities: ['24/7 Trauma ICU', 'Cardiac Emergency Unit', 'Highway Ambulance Service'],
    rating: 4.3,
    is24x7: true,
    notes: 'Premier trauma response facility situated near Kalamboli interchange.',
  },

  // --- Delhi - Jaipur NH 48 ---
  {
    id: 'stop_delhi_jaipur_toll_kherki',
    name: 'Kherki Daula Toll Plaza',
    category: 'TOLL_PLAZA',
    lat: 28.3995,
    lng: 76.974,
    brand: 'NHAI Fastag Plaza',
    highway: 'Delhi-Jaipur NH 48',
    amenities: ['Fastag Automatic Boom', 'Traffic Police Post'],
    rating: 3.8,
    is24x7: true,
    notes: 'Gurugram exit toll gate on Delhi-Jaipur highway.',
  },
  {
    id: 'stop_delhi_jaipur_mannat_dhaba',
    name: 'Mannat Family Dhaba & Resort Dharuhera',
    category: 'DHABA_FOOD',
    lat: 28.214,
    lng: 76.804,
    brand: 'Mannat Group',
    highway: 'Delhi-Jaipur NH 48',
    amenities: ['Clean Restrooms', '24/7 Hot Tandoor', 'Lawn Seating', 'Ample Car Parking'],
    rating: 4.4,
    is24x7: true,
    notes: 'Authentic North Indian food and hygienic washrooms.',
  },
  {
    id: 'stop_delhi_jaipur_highway_king',
    name: 'Hotel Highway King Behror',
    category: 'DHABA_FOOD',
    lat: 27.892,
    lng: 76.284,
    brand: 'Highway King Resorts',
    highway: 'Delhi-Jaipur NH 48',
    amenities: ['AC Multi-Cuisine Restaurant', 'Spotless Restrooms', 'Family Play Area', 'Shopping Arcade'],
    rating: 4.6,
    is24x7: true,
    notes: 'The quintessential midway break on Delhi-Jaipur with premier amenities.',
  },
  {
    id: 'stop_delhi_jaipur_iocl_coco',
    name: 'IndianOil COCO 24/7 Behror Oasis',
    category: 'PETROL_PUMP',
    lat: 27.896,
    lng: 76.287,
    brand: 'IndianOil (COCO Swagat)',
    highway: 'Delhi-Jaipur NH 48',
    amenities: ['Clean Restrooms', '24/7 Fuel', 'Tyre Pressure Station', 'Fastag Accepted'],
    rating: 4.5,
    is24x7: true,
    notes: 'Official IndianOil company outlet with verified fuel density.',
  },
  {
    id: 'stop_delhi_jaipur_ev_behror',
    name: 'Statiq 60kW DC Fast EV Station Behror',
    category: 'EV_CHARGER',
    lat: 27.893,
    lng: 76.285,
    brand: 'Statiq EV Network',
    highway: 'Delhi-Jaipur NH 48',
    amenities: ['CCS2 Dual Gun Fast Charger', '24/7 Support', 'Beside Highway King'],
    rating: 4.5,
    is24x7: true,
    notes: 'Ideal EV charging stop while breakfasting or dining in Behror.',
  },

  // --- Delhi - Chandigarh NH 44 (Murthal Corridor) ---
  {
    id: 'stop_murthal_amrik_sukhdev',
    name: 'Amrik Sukhdev Dhaba Murthal',
    category: 'DHABA_FOOD',
    lat: 29.027,
    lng: 77.068,
    brand: 'Amrik Sukhdev Heritage',
    highway: 'Delhi-Chandigarh NH 44',
    amenities: ['5-Star Clean Washrooms', 'White Butter Parathas', 'Bakery & Sweets', 'Valet Parking'],
    rating: 4.7,
    is24x7: true,
    notes: 'India’s most celebrated highway food stop. Ultra-clean facilities.',
  },
  {
    id: 'stop_murthal_ev_fast',
    name: 'ChargeZone 120kW Supercharger Murthal',
    category: 'EV_CHARGER',
    lat: 29.028,
    lng: 77.069,
    brand: 'ChargeZone EV',
    highway: 'Delhi-Chandigarh NH 44',
    amenities: ['120kW Dual Guns', '24/7 Security', 'Direct Dhaba Access'],
    rating: 4.8,
    is24x7: true,
    notes: 'Rapid 15-20 min top up while enjoying parathas.',
  },

  // --- Bengaluru - Mysuru Expressway ---
  {
    id: 'stop_bengaluru_mysuru_bidadi',
    name: 'Bidadi Highway Thatte Idli Food Plaza',
    category: 'DHABA_FOOD',
    lat: 12.795,
    lng: 77.385,
    brand: 'Bidadi Heritage Eateries',
    highway: 'Bengaluru-Mysuru Expressway',
    amenities: ['Hot Thatte Idli & Filter Coffee', 'Clean Restrooms', 'Spacious Parking'],
    rating: 4.5,
    is24x7: false,
    notes: 'Must-visit breakfast corridor spot on the way to Mysuru.',
  },
  {
    id: 'stop_bengaluru_mysuru_bpcl_ghar',
    name: 'BPCL Ghar Express COCO Ramanagara',
    category: 'PETROL_PUMP',
    lat: 12.724,
    lng: 77.282,
    brand: 'Bharat Petroleum (Ghar COCO)',
    highway: 'Bengaluru-Mysuru Expressway',
    amenities: ['Clean AC Washrooms', 'In & Out Convenience Store', 'Air & Water'],
    rating: 4.4,
    is24x7: true,
    notes: 'High-rated family rest stop with clean facilities.',
  },
  {
    id: 'stop_bengaluru_mysuru_ev_tata',
    name: 'Tata Power 60kW EV Station Channapatna',
    category: 'EV_CHARGER',
    lat: 12.651,
    lng: 77.202,
    brand: 'Tata Power EZ Charge',
    highway: 'Bengaluru-Mysuru Expressway',
    amenities: ['Fast DC Charging', 'Restroom Access', 'Coffee Kiosk'],
    rating: 4.6,
    is24x7: true,
    notes: 'Midway EV fast charger between Bengaluru and Mysuru.',
  },
  {
    id: 'stop_bengaluru_mysuru_hospital_mandya',
    name: 'Mandya Highway Emergency Hospital',
    category: 'HOSPITAL',
    lat: 12.525,
    lng: 76.898,
    brand: 'District Highway Trauma Care',
    highway: 'Bengaluru-Mysuru Expressway',
    amenities: ['24/7 Trauma Care', 'Emergency Ambulance Hotline'],
    rating: 4.2,
    is24x7: true,
    notes: 'Equipped for highway emergency care midway on the expressway.',
  },
];

export class CorridorStopsService {
  /**
   * Filters and sorts verified highway stops situated along the active route corridor.
   *
   * @param routePolyline Array of [lat, lng] points representing the driver's route.
   * @param maxDetourMeters Max perpendicular distance from route centerline (default: 4,000m / 4km).
   */
  findStopsAlongRoute(
    routePolyline: [number, number][],
    maxDetourMeters: number = 4000
  ): CorridorStop[] {
    if (!routePolyline || routePolyline.length < 2) return [];

    const results: CorridorStop[] = [];

    // Precalculate cumulative distances along route for fast projection
    const cumulativeDistancesKm: number[] = [0];
    let runningDist = 0;
    for (let i = 1; i < routePolyline.length; i++) {
      runningDist += calculateHaversineDistance(routePolyline[i - 1], routePolyline[i]);
      cumulativeDistancesKm.push(runningDist / 1000);
    }

    const step = Math.max(1, Math.floor(routePolyline.length / 50));

    for (const stop of SEEDED_HIGHWAY_STOPS) {
      let minDetour = Infinity;
      let nearestSegmentIdx = 0;

      // Sample along the polyline
      for (let i = 0; i < routePolyline.length; i += step) {
        const dist = calculateHaversineDistance([stop.lat, stop.lng], routePolyline[i]);
        if (dist < minDetour) {
          minDetour = dist;
          nearestSegmentIdx = i;
        }
      }

      if (minDetour <= maxDetourMeters) {
        const approxDistanceAlongKm = Math.round(cumulativeDistancesKm[nearestSegmentIdx] || 0);

        results.push({
          ...stop,
          distanceAlongRouteKm: approxDistanceAlongKm,
          detourMeters: Math.round(minDetour),
        });
      }
    }

    // Sort chronologically in order of encounter during drive
    results.sort((a, b) => a.distanceAlongRouteKm - b.distanceAlongRouteKm);

    return results;
  }

  /**
   * Filter stops by specific amenity category
   */
  filterByCategory(stops: CorridorStop[], category: AmenityCategory | 'ALL'): CorridorStop[] {
    if (category === 'ALL') return stops;
    return stops.filter((s) => s.category === category);
  }
}

export const corridorStopsService = new CorridorStopsService();
