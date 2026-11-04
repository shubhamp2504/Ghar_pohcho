import type { PopularRoutePreset } from '../types/routing';

export const POPULAR_ROUTE_PRESETS: PopularRoutePreset[] = [
  {
    id: 'mumbai-pune',
    titleKey: 'Mumbai → Pune',
    highwayTag: 'Mumbai-Pune Expressway (NE 1)',
    typicalDuration: '2 hr 40 min',
    origin: {
      name: 'Bandra West, Mumbai',
      address: 'Bandra, Mumbai, Maharashtra, India',
      lat: 19.0596,
      lng: 72.8295,
    },
    destination: {
      name: 'Koregaon Park, Pune',
      address: 'Koregaon Park, Pune, Maharashtra, India',
      lat: 18.5362,
      lng: 73.8940,
    },
  },
  {
    id: 'delhi-jaipur',
    titleKey: 'Delhi → Jaipur',
    highwayTag: 'Delhi-Jaipur Highway (NH 48)',
    typicalDuration: '4 hr 30 min',
    origin: {
      name: 'Connaught Place, New Delhi',
      address: 'Connaught Place, New Delhi, Delhi, India',
      lat: 28.6315,
      lng: 77.2167,
    },
    destination: {
      name: 'MI Road, Jaipur',
      address: 'MI Road, Jaipur, Rajasthan, India',
      lat: 26.9124,
      lng: 75.7873,
    },
  },
  {
    id: 'bengaluru-mysuru',
    titleKey: 'Bengaluru → Mysuru',
    highwayTag: 'Bengaluru-Mysuru Expressway (NH 275)',
    typicalDuration: '2 hr 10 min',
    origin: {
      name: 'Kengeri, Bengaluru',
      address: 'Kengeri, Bengaluru, Karnataka, India',
      lat: 12.9177,
      lng: 77.4838,
    },
    destination: {
      name: 'Mysuru Palace, Mysuru',
      address: 'Mysuru, Karnataka, India',
      lat: 12.3052,
      lng: 76.6552,
    },
  },
  {
    id: 'pune-nashik',
    titleKey: 'Pune → Nashik',
    highwayTag: 'Pune-Nashik Highway (NH 60)',
    typicalDuration: '4 hr 15 min',
    origin: {
      name: 'Shivajinagar, Pune',
      address: 'Shivajinagar, Pune, Maharashtra, India',
      lat: 18.5314,
      lng: 73.8446,
    },
    destination: {
      name: 'Dwarka Circle, Nashik',
      address: 'Dwarka, Nashik, Maharashtra, India',
      lat: 19.9975,
      lng: 73.7898,
    },
  },
  {
    id: 'delhi-gurugram',
    titleKey: 'Delhi → Gurugram',
    highwayTag: 'Delhi-Gurgaon Expressway (NH 48)',
    typicalDuration: '55 min',
    origin: {
      name: 'Dhaula Kuan, New Delhi',
      address: 'Dhaula Kuan, New Delhi, Delhi, India',
      lat: 28.5916,
      lng: 77.1614,
    },
    destination: {
      name: 'Cyber City, Gurugram',
      address: 'DLF Cyber City, Gurugram, Haryana, India',
      lat: 28.4952,
      lng: 77.0895,
    },
  },
  {
    id: 'mumbai-airport-south',
    titleKey: 'Mumbai T2 → Nariman Point',
    highwayTag: 'Bandra-Worli Sea Link & Coastal Rd',
    typicalDuration: '50 min',
    origin: {
      name: 'CSMIA Terminal 2, Mumbai',
      address: 'Sahar, Andheri East, Mumbai, Maharashtra, India',
      lat: 19.0968,
      lng: 72.8727,
    },
    destination: {
      name: 'Nariman Point, South Mumbai',
      address: 'Nariman Point, Mumbai, Maharashtra, India',
      lat: 18.9256,
      lng: 72.8242,
    },
  },
];
