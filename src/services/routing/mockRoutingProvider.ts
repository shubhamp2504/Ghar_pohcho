import type {
  IRoutingProvider,
  RouteRequest,
  RouteCalculationResult,
  RouteOption,
  TrafficSegment,
} from '../../types/routing';
import { calculateHaversineDistance, calculateAdditionalDelay } from '../../utils/geo';

export class MockRoutingProvider implements IRoutingProvider {
  name = 'Indian Highway Corridor Simulator (Offline / Dev)';

  isConfigured(): boolean {
    return true;
  }

  async calculateRoutes(request: RouteRequest): Promise<RouteCalculationResult> {
    // Simulate slight network realism
    await new Promise((resolve) => setTimeout(resolve, 400));

    const origin = request.origin;
    const dest = request.destination;
    const distanceStraight = calculateHaversineDistance(
      [origin.lat, origin.lng],
      [dest.lat, dest.lng]
    );

    // Identify corridor match or generate dynamic corridor
    const corridor = matchCorridor(origin, dest);
    const now = new Date();
    const computedAt = now.toISOString();

    let routes: RouteOption[] = [];

    if (corridor) {
      routes = corridor.generateRoutes(now);
    } else {
      // Dynamic fallback for any arbitrary Indian origin/destination
      routes = generateDynamicRoutes(origin, dest, distanceStraight, now);
    }

    return {
      routes,
      selectedRouteIndex: 0,
      origin,
      destination: dest,
      computedAt,
      source: 'MOCK_FIXTURE',
      disclaimer:
        'Running in Offline / Corridor Simulation mode. Connect a Google Routes API Key in Settings for live traffic measurements.',
    };
  }
}

interface CorridorDefinition {
  name: string;
  generateRoutes: (now: Date) => RouteOption[];
}

function matchCorridor(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }): CorridorDefinition | null {
  // Mumbai <-> Pune
  if (
    isNear(origin, 19.05, 72.85, 0.4) && isNear(dest, 18.53, 73.85, 0.4) ||
    isNear(origin, 18.53, 73.85, 0.4) && isNear(dest, 19.05, 72.85, 0.4)
  ) {
    return {
      name: 'Mumbai - Pune Corridor',
      generateRoutes: (now) => [
        createMumbaiPuneExpresswayRoute(now),
        createMumbaiPuneOldHighwayRoute(now),
      ],
    };
  }

  // Delhi <-> Jaipur
  if (
    isNear(origin, 28.63, 77.21, 0.4) && isNear(dest, 26.91, 75.78, 0.5) ||
    isNear(origin, 26.91, 75.78, 0.5) && isNear(dest, 28.63, 77.21, 0.4)
  ) {
    return {
      name: 'Delhi - Jaipur Corridor',
      generateRoutes: (now) => [
        createDelhiJaipurNh48Route(now),
        createDelhiJaipurDelhiMumbaiExpRoute(now),
      ],
    };
  }

  // Bengaluru <-> Mysuru
  if (
    isNear(origin, 12.92, 77.50, 0.4) && isNear(dest, 12.30, 76.65, 0.4) ||
    isNear(origin, 12.30, 76.65, 0.4) && isNear(dest, 12.92, 77.50, 0.4)
  ) {
    return {
      name: 'Bengaluru - Mysuru Corridor',
      generateRoutes: (now) => [
        createBengaluruMysuruExpresswayRoute(now),
        createBengaluruMysuruKanakapuraRoute(now),
      ],
    };
  }

  // Pune <-> Nashik
  if (
    isNear(origin, 18.53, 73.84, 0.4) && isNear(dest, 19.99, 73.78, 0.5) ||
    isNear(origin, 19.99, 73.78, 0.5) && isNear(dest, 18.53, 73.84, 0.4)
  ) {
    return {
      name: 'Pune - Nashik Corridor',
      generateRoutes: (now) => [
        createPuneNashikNh60Route(now),
        createPuneNashikSangamnerRoute(now),
      ],
    };
  }

  return null;
}

function isNear(coord: { lat: number; lng: number }, lat: number, lng: number, threshold = 0.3): boolean {
  return Math.abs(coord.lat - lat) < threshold && Math.abs(coord.lng - lng) < threshold;
}

// -------------------------------------------------------------
// Mumbai <-> Pune Corridor Routes
// -------------------------------------------------------------
function createMumbaiPuneExpresswayRoute(now: Date): RouteOption {
  // Approximate waypoints along Yashwantrao Chavan Mumbai-Pune Expressway
  const polyline: [number, number][] = [
    [19.0596, 72.8295], // Bandra
    [19.0430, 72.8800], // Chembur
    [19.0180, 73.0100], // Vashi
    [18.9800, 73.1100], // Kalamboli (Expressway start)
    [18.9300, 73.2000], // Rasayani
    [18.8200, 73.3100], // Khalapur Toll
    [18.7700, 73.3800], // Khandala Ghat
    [18.7500, 73.4100], // Lonavala
    [18.7000, 73.5500], // Kamshet
    [18.6600, 73.6800], // Talegaon Toll
    [18.6000, 73.7600], // Dehu Road / Ravet
    [18.5900, 73.7800], // Wakad
    [18.5362, 73.8940], // Koregaon Park Pune
  ];

  const staticDurationSeconds = 7500; // 2 hr 05 min baseline
  const durationSeconds = 9600;       // 2 hr 40 min with traffic
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  const trafficSegments: TrafficSegment[] = [
    {
      id: 'mp-seg-1',
      startPoint: [18.7700, 73.3800],
      endPoint: [18.7500, 73.4100],
      polyline: [
        [18.7700, 73.3800],
        [18.7600, 73.3950],
        [18.7500, 73.4100],
      ],
      congestionLevel: 'HEAVY',
      roadName: 'Khandala Bhor Ghat Section',
      lengthMeters: 4500,
      durationSeconds: 1200,
      delaySeconds: 780, // +13 min delay
      source: 'MOCK_FIXTURE',
      lastUpdated: now.toISOString(),
      description: 'Slow-moving heavy commercial trucks crawling on steep gradient before Amrutanjan point.',
    },
    {
      id: 'mp-seg-2',
      startPoint: [18.6000, 73.7600],
      endPoint: [18.5900, 73.7800],
      polyline: [
        [18.6000, 73.7600],
        [18.5950, 73.7700],
        [18.5900, 73.7800],
      ],
      congestionLevel: 'MODERATE',
      roadName: 'Wakad Bridge & Hinjawadi Flyover Junction',
      lengthMeters: 2800,
      durationSeconds: 720,
      delaySeconds: 360, // +6 min delay
      source: 'MOCK_FIXTURE',
      lastUpdated: now.toISOString(),
      description: 'Evening IT commute bottleneck at Hinjawadi phase entrance.',
    },
  ];

  return {
    id: 'route-mumbai-pune-exp',
    name: 'via Mumbai - Pune Expressway',
    summary: 'Fastest route via Mumbai-Pune Expressway (NE 1)',
    isRecommended: true,
    distanceMeters: 148000, // 148 km
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Fastag Toll: ₹320 at Khalapur & Talegaon Plazas',
    encodedPolyline: '',
    polyline,
    trafficSegments,
    warnings: ['Heavy vehicle crawling warning in Khandala Ghats'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

function createMumbaiPuneOldHighwayRoute(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [19.0596, 72.8295], // Bandra
    [19.0430, 72.8800], // Chembur
    [19.0600, 73.0000], // Vashi
    [19.0300, 73.0800], // CBD Belapur
    [18.9900, 73.1200], // Panvel City
    [18.8900, 73.2300], // Chowk
    [18.7900, 73.3400], // Khopoli
    [18.7600, 73.4100], // Lonavala Town (Old NH)
    [18.7300, 73.4900], // Karla
    [18.7100, 73.6100], // Vadgaon
    [18.6400, 73.7800], // Pimpri Chinchwad
    [18.5700, 73.8400], // Shivaji Nagar
    [18.5362, 73.8940], // Koregaon Park Pune
  ];

  const staticDurationSeconds = 11400; // 3 hr 10 min
  const durationSeconds = 13800;       // 3 hr 50 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  const trafficSegments: TrafficSegment[] = [
    {
      id: 'mp-old-1',
      startPoint: [18.9900, 73.1200],
      endPoint: [18.8900, 73.2300],
      polyline: [
        [18.9900, 73.1200],
        [18.8900, 73.2300],
      ],
      congestionLevel: 'SLOW',
      roadName: 'Panvel - Khopoli Junction (Old NH 48)',
      lengthMeters: 6200,
      durationSeconds: 1500,
      delaySeconds: 600,
      source: 'MOCK_FIXTURE',
      lastUpdated: now.toISOString(),
      description: 'Local market traffic and traffic signals in Panvel market area.',
    },
  ];

  return {
    id: 'route-mumbai-pune-old-nh',
    name: 'via Old Mumbai - Pune Hwy (NH 48)',
    summary: 'Alternative route via Panvel, Khopoli & Lonavala town',
    isRecommended: false,
    distanceMeters: 162000, // 162 km
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Lower toll but multiple urban choke points and speed limits',
    encodedPolyline: '',
    polyline,
    trafficSegments,
    warnings: ['Frequent urban speed breakers and signal delays through towns'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

// -------------------------------------------------------------
// Delhi <-> Jaipur Corridor Routes
// -------------------------------------------------------------
function createDelhiJaipurNh48Route(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [28.6315, 77.2167], // CP
    [28.5800, 77.1600], // Dhaula Kuan
    [28.5000, 77.0800], // Cyber Hub Gurgaon
    [28.4300, 77.0000], // Kherki Daula
    [28.3500, 76.9200], // Manesar
    [28.2800, 76.8500], // Bilaspur
    [28.1400, 76.6200], // Dharuhera
    [28.0000, 76.4200], // Bawal
    [27.7000, 76.2000], // Behror
    [27.4000, 75.9500], // Shahpura
    [26.9800, 75.8000], // Amer / Jaipur entrance
    [26.9124, 75.7873], // MI Road Jaipur
  ];

  const staticDurationSeconds = 14400; // 4 hours
  const durationSeconds = 16800;       // 4 hr 40 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-delhi-jaipur-nh48',
    name: 'via Delhi - Jaipur Hwy (NH 48)',
    summary: 'Standard route via Gurgaon, Manesar & Shahpura',
    isRecommended: true,
    distanceMeters: 268000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Fastag Toll: Kherki Daula, Shahjahanpur & Manoharpur',
    encodedPolyline: '',
    polyline,
    trafficSegments: [
      {
        id: 'dj-seg-1',
        startPoint: [28.4300, 77.0000],
        endPoint: [28.3500, 76.9200],
        polyline: [
          [28.4300, 77.0000],
          [28.3500, 76.9200],
        ],
        congestionLevel: 'HEAVY',
        roadName: 'Kherki Daula Toll & Manesar Industrial Belt',
        lengthMeters: 8000,
        durationSeconds: 1800,
        delaySeconds: 900,
        source: 'MOCK_FIXTURE',
        lastUpdated: now.toISOString(),
        description: 'Toll bottleneck and industrial truck crossing near IMT Manesar.',
      },
    ],
    warnings: ['Highway flyover construction near Dharuhera bypass'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

function createDelhiJaipurDelhiMumbaiExpRoute(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [28.6315, 77.2167],
    [28.4500, 77.3000], // Faridabad / Sohna
    [28.2500, 77.1000], // Sohna cloverleaf
    [27.9000, 76.8000], // Nuh / Dausa section
    [27.1500, 76.4000], // Bandikui / Dausa interchange
    [26.9124, 75.7873], // Jaipur
  ];

  const staticDurationSeconds = 12600; // 3 hr 30 min
  const durationSeconds = 13800;       // 3 hr 50 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-delhi-jaipur-dme',
    name: 'via Delhi-Mumbai Expressway (NE 4)',
    summary: 'High-speed access-controlled corridor via Sohna & Dausa',
    isRecommended: false, // In test scenario, slightly longer bypass distance
    distanceMeters: 295000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Fastag Distance-based automated tolling (~₹460)',
    encodedPolyline: '',
    polyline,
    trafficSegments: [],
    warnings: ['Check fuel levels; food plazas spaced every 50 km'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

// -------------------------------------------------------------
// Bengaluru <-> Mysuru Expressway
// -------------------------------------------------------------
function createBengaluruMysuruExpresswayRoute(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [12.9177, 77.4838], // Kengeri
    [12.8200, 77.3500], // Bidadi
    [12.7200, 77.2500], // Ramanagara
    [12.6300, 77.1500], // Channapatna
    [12.5200, 76.9000], // Maddur
    [12.4500, 76.7500], // Mandya
    [12.3800, 76.7000], // Srirangapatna
    [12.3052, 76.6552], // Mysuru
  ];

  const staticDurationSeconds = 6600; // 1 hr 50 min
  const durationSeconds = 7800;       // 2 hr 10 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-blr-mys-exp',
    name: 'via Bengaluru-Mysuru Expressway (NH 275)',
    summary: 'Access-controlled 10-lane expressway via Mandya bypass',
    isRecommended: true,
    distanceMeters: 132000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Fastag Toll: Kaniminike & Gananguru Plazas (~₹320)',
    encodedPolyline: '',
    polyline,
    trafficSegments: [
      {
        id: 'bm-seg-1',
        startPoint: [12.9177, 77.4838],
        endPoint: [12.8200, 77.3500],
        polyline: [
          [12.9177, 77.4838],
          [12.8200, 77.3500],
        ],
        congestionLevel: 'MODERATE',
        roadName: 'NICE Road Junction to Kaniminike Toll',
        lengthMeters: 5500,
        durationSeconds: 900,
        delaySeconds: 420,
        source: 'MOCK_FIXTURE',
        lastUpdated: now.toISOString(),
        description: 'Toll plaza queueing during weekend outbound rush.',
      },
    ],
    warnings: ['Speed cameras active (100 km/h speed limit strictly enforced)'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

function createBengaluruMysuruKanakapuraRoute(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [12.9177, 77.4838],
    [12.7500, 77.4500], // Kanakapura
    [12.5000, 77.2000], // Malavalli
    [12.4000, 76.9000], // Bannur
    [12.3052, 76.6552], // Mysuru
  ];

  const staticDurationSeconds = 9600; // 2 hr 40 min
  const durationSeconds = 11400;      // 3 hr 10 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-blr-mys-kanakapura',
    name: 'via Kanakapura & Malavalli (NH 948)',
    summary: 'Scenic 2-lane route via Kanakapura with minimal tolls',
    isRecommended: false,
    distanceMeters: 146000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: false,
    tollNote: 'Toll-free route, 2-lane passing required',
    encodedPolyline: '',
    polyline,
    trafficSegments: [],
    warnings: ['Two-lane undivided highway with village crossings'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

// -------------------------------------------------------------
// Pune <-> Nashik Corridor
// -------------------------------------------------------------
function createPuneNashikNh60Route(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [18.5314, 73.8446], // Shivajinagar Pune
    [18.6300, 73.8400], // Bhosari
    [18.7500, 73.8500], // Chakan Chowk
    [18.9800, 73.9000], // Manchar
    [19.1200, 73.9800], // Narayangaon
    [19.4500, 74.1500], // Sangamner
    [19.7500, 73.9500], // Sinnar
    [19.9975, 73.7898], // Nashik Dwarka
  ];

  const staticDurationSeconds = 13200; // 3 hr 40 min
  const durationSeconds = 16200;       // 4 hr 30 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-pune-nashik-nh60',
    name: 'via Pune - Nashik Hwy (NH 60)',
    summary: 'Direct route via Chakan, Narayangaon & Sangamner',
    isRecommended: true,
    distanceMeters: 212000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: true,
    tollNote: 'Fastag Toll at Chalakwadi & Hivargaon Plazas',
    encodedPolyline: '',
    polyline,
    trafficSegments: [
      {
        id: 'pn-seg-1',
        startPoint: [18.7500, 73.8500],
        endPoint: [18.9800, 73.9000],
        polyline: [
          [18.7500, 73.8500],
          [18.9800, 73.9000],
        ],
        congestionLevel: 'HEAVY',
        roadName: 'Chakan MIDC & Shikrapur Cross Junction',
        lengthMeters: 9200,
        durationSeconds: 2100,
        delaySeconds: 1200, // +20 min delay
        source: 'MOCK_FIXTURE',
        lastUpdated: now.toISOString(),
        description: 'Heavy industrial traffic and bottleneck at Chakan 4-way signal.',
      },
    ],
    warnings: ['Chakan traffic flyover work in progress, expect lane merges'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

function createPuneNashikSangamnerRoute(now: Date): RouteOption {
  const polyline: [number, number][] = [
    [18.5314, 73.8446],
    [18.6800, 73.9200], // Alandi bypass
    [18.9800, 74.0500], // Khed
    [19.3500, 74.3000], // Otur
    [19.9975, 73.7898], // Nashik
  ];

  const staticDurationSeconds = 14400; // 4 hours
  const durationSeconds = 16800;       // 4 hr 40 min
  const additionalDelaySeconds = calculateAdditionalDelay(durationSeconds, staticDurationSeconds);

  return {
    id: 'route-pune-nashik-alt',
    name: 'via Khed & Otur Bypass',
    summary: 'Bypasses central Chakan traffic via eastern rural roads',
    isRecommended: false,
    distanceMeters: 228000,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: false,
    encodedPolyline: '',
    polyline,
    trafficSegments: [],
    warnings: ['Narrow rural roads with sharp curves'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };
}

// -------------------------------------------------------------
// Dynamic Generative Fallback for any two coordinates
// -------------------------------------------------------------
function generateDynamicRoutes(
  origin: { lat: number; lng: number; name: string },
  dest: { lat: number; lng: number; name: string },
  distanceMeters: number,
  now: Date
): RouteOption[] {
  // Road network factor: road travel is typically 1.25x to 1.35x straight line distance
  const roadDistance = Math.round(distanceMeters * 1.3);

  // Speed: average 60 km/h baseline (16.6 m/s)
  const staticDurationSeconds = Math.round(roadDistance / 16.6);

  // Realistic Indian urban/inter-city delay (18% - 30% extra delay)
  const additionalDelaySeconds = Math.round(staticDurationSeconds * 0.22);
  const durationSeconds = staticDurationSeconds + additionalDelaySeconds;

  // Generate a smooth 5-point polyline between origin and destination
  const polyline: [number, number][] = [
    [origin.lat, origin.lng],
    [
      origin.lat + (dest.lat - origin.lat) * 0.25 + 0.005,
      origin.lng + (dest.lng - origin.lng) * 0.25 - 0.005,
    ],
    [
      origin.lat + (dest.lat - origin.lat) * 0.5 - 0.004,
      origin.lng + (dest.lng - origin.lng) * 0.5 + 0.006,
    ],
    [
      origin.lat + (dest.lat - origin.lat) * 0.75 + 0.003,
      origin.lng + (dest.lng - origin.lng) * 0.75 - 0.003,
    ],
    [dest.lat, dest.lng],
  ];

  const primaryRoute: RouteOption = {
    id: 'dyn-route-1',
    name: `Direct Highway Route to ${dest.name}`,
    summary: `Primary arterial corridor (${Math.round(roadDistance / 1000)} km)`,
    isRecommended: true,
    distanceMeters: roadDistance,
    durationSeconds,
    staticDurationSeconds,
    additionalDelaySeconds,
    estimatedArrivalTime: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    hasTolls: roadDistance > 40000,
    tollNote: roadDistance > 40000 ? 'Estimated toll plaza along state highway' : undefined,
    encodedPolyline: '',
    polyline,
    trafficSegments: [
      {
        id: 'dyn-seg-1',
        startPoint: polyline[1],
        endPoint: polyline[2],
        polyline: [polyline[1], polyline[2]],
        congestionLevel: 'MODERATE',
        roadName: `Main Highway Junction near ${origin.name}`,
        lengthMeters: Math.round(roadDistance * 0.25),
        durationSeconds: Math.round(additionalDelaySeconds * 1.5),
        delaySeconds: additionalDelaySeconds,
        source: 'MOCK_FIXTURE',
        lastUpdated: now.toISOString(),
        description: 'Moderate traffic density and slow vehicle movement along junction.',
      },
    ],
    warnings: [],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };

  // Alternative route (+12% distance, slightly different delay)
  const altDistance = Math.round(roadDistance * 1.12);
  const altStatic = Math.round(altDistance / 16.6);
  const altDelay = Math.round(altStatic * 0.15); // slightly less delay but longer path
  const altDuration = altStatic + altDelay;

  const altPolyline: [number, number][] = [
    [origin.lat, origin.lng],
    [
      origin.lat + (dest.lat - origin.lat) * 0.3 - 0.015,
      origin.lng + (dest.lng - origin.lng) * 0.3 + 0.015,
    ],
    [
      origin.lat + (dest.lat - origin.lat) * 0.7 - 0.012,
      origin.lng + (dest.lng - origin.lng) * 0.7 + 0.012,
    ],
    [dest.lat, dest.lng],
  ];

  const altRoute: RouteOption = {
    id: 'dyn-route-2',
    name: `Ring Road / Bypass Route`,
    summary: `Outer bypass avoiding central bottlenecks`,
    isRecommended: false,
    distanceMeters: altDistance,
    durationSeconds: altDuration,
    staticDurationSeconds: altStatic,
    additionalDelaySeconds: altDelay,
    estimatedArrivalTime: new Date(now.getTime() + altDuration * 1000).toISOString(),
    hasTolls: altDistance > 50000,
    encodedPolyline: '',
    polyline: altPolyline,
    trafficSegments: [],
    warnings: ['Slightly longer distance via bypass'],
    source: 'MOCK_FIXTURE',
    dataConfidence: 'HISTORICAL_ESTIMATE',
    lastUpdated: now.toISOString(),
  };

  return [primaryRoute, altRoute];
}
