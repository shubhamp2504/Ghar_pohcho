import type { LocationPoint, IPlacesProvider } from '../../types/routing';

const INDIAN_PLACES_DATABASE: LocationPoint[] = [
  // Maharashtra (Mumbai / Pune / Nashik / Thane / Navi Mumbai)
  { name: 'Bandra West, Mumbai', address: 'Bandra West, Mumbai, Maharashtra', lat: 19.0596, lng: 72.8295 },
  { name: 'Andheri East, Mumbai', address: 'Andheri East, Mumbai, Maharashtra', lat: 19.1136, lng: 72.8697 },
  { name: 'CSMIA Terminal 2 (T2), Mumbai', address: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai', lat: 19.0968, lng: 72.8727 },
  { name: 'Nariman Point, South Mumbai', address: 'Nariman Point, Churchgate, Mumbai, Maharashtra', lat: 18.9256, lng: 72.8242 },
  { name: 'Borivali West, Mumbai', address: 'Borivali West, Mumbai, Maharashtra', lat: 19.2307, lng: 72.8567 },
  { name: 'Thane West', address: 'Thane West, Thane, Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Vashi, Navi Mumbai', address: 'Vashi, Navi Mumbai, Maharashtra', lat: 19.0771, lng: 72.9986 },
  { name: 'Panvel, Navi Mumbai', address: 'Panvel, Raigad, Maharashtra', lat: 18.9894, lng: 73.1175 },
  { name: 'Khandala Ghat, Lonavala', address: 'Khandala, Lonavala, Maharashtra', lat: 18.7562, lng: 73.3742 },
  { name: 'Koregaon Park, Pune', address: 'Koregaon Park, Pune, Maharashtra', lat: 18.5362, lng: 73.8940 },
  { name: 'Shivajinagar, Pune', address: 'Shivajinagar, Pune, Maharashtra', lat: 18.5314, lng: 73.8446 },
  { name: 'Wakad, Pune', address: 'Wakad, Pimpri-Chinchwad, Pune, Maharashtra', lat: 18.5987, lng: 73.7688 },
  { name: 'Hinjawadi Phase 1, Pune', address: 'Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra', lat: 18.5913, lng: 73.7389 },
  { name: 'Dwarka Circle, Nashik', address: 'Dwarka, Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Aurangabad (Chhatrapati Sambhajinagar)', address: 'Chhatrapati Sambhajinagar, Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'Kolhapur Central', address: 'Kolhapur, Maharashtra', lat: 16.7050, lng: 74.2433 },

  // Delhi-NCR & Rajasthan
  { name: 'Connaught Place, New Delhi', address: 'Connaught Place, New Delhi, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Dhaula Kuan, New Delhi', address: 'Dhaula Kuan, New Delhi, Delhi', lat: 28.5916, lng: 77.1614 },
  { name: 'IGI Airport T3, New Delhi', address: 'Indira Gandhi International Airport, New Delhi', lat: 28.5562, lng: 77.1000 },
  { name: 'Cyber City, Gurugram', address: 'DLF Cyber City, Phase 2, Gurugram, Haryana', lat: 28.4952, lng: 77.0895 },
  { name: 'Sector 62, Noida', address: 'Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh', lat: 28.6280, lng: 77.3649 },
  { name: 'Manesar Industrial Area', address: 'IMT Manesar, Gurugram, Haryana', lat: 28.3533, lng: 76.9389 },
  { name: 'MI Road, Jaipur', address: 'Mirza Ismail Road, Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Amer Fort, Jaipur', address: 'Amer, Jaipur, Rajasthan', lat: 26.9855, lng: 75.8513 },

  // Karnataka & South
  { name: 'MG Road, Bengaluru', address: 'MG Road, Bengaluru, Karnataka', lat: 12.9756, lng: 77.6066 },
  { name: 'Electronic City Phase 1, Bengaluru', address: 'Electronic City, Bengaluru, Karnataka', lat: 12.8452, lng: 77.6602 },
  { name: 'Whitefield, Bengaluru', address: 'Whitefield, Bengaluru, Karnataka', lat: 12.9698, lng: 77.7500 },
  { name: 'Kengeri Satellite Town, Bengaluru', address: 'Kengeri, Bengaluru, Karnataka', lat: 12.9177, lng: 77.4838 },
  { name: 'Mysuru Palace, Mysuru', address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka', lat: 12.3052, lng: 76.6552 },
  { name: 'Hitec City, Hyderabad', address: 'Madhapur, Hitec City, Hyderabad, Telangana', lat: 17.4435, lng: 78.3772 },
  { name: 'Gachibowli, Hyderabad', address: 'Gachibowli, Hyderabad, Telangana', lat: 17.4401, lng: 78.3489 },
  { name: 'Anna Nagar, Chennai', address: 'Anna Nagar, Chennai, Tamil Nadu', lat: 13.0850, lng: 80.2101 },

  // Gujarat
  { name: 'SG Highway, Ahmedabad', address: 'Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat', lat: 23.0338, lng: 72.5073 },
  { name: 'Alkapuri, Vadodara', address: 'Alkapuri, Vadodara, Gujarat', lat: 22.3107, lng: 73.1812 },
  { name: 'Surat Central', address: 'Ring Road, Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
];

export class PlacesService implements IPlacesProvider {
  async searchPlaces(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.toLowerCase().trim();

    const matches = INDIAN_PLACES_DATABASE.filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQuery) ||
        (p.address && p.address.toLowerCase().includes(cleanQuery))
    );

    return matches.slice(0, 6);
  }

  async reverseGeocode(lat: number, lng: number): Promise<LocationPoint> {
    // Find closest known landmark in database within ~10km, or return standard geocoded point
    let closest: LocationPoint | null = null;
    let minDist = Infinity;

    for (const place of INDIAN_PLACES_DATABASE) {
      const dist = Math.hypot(place.lat - lat, place.lng - lng);
      if (dist < minDist) {
        minDist = dist;
        closest = place;
      }
    }

    if (closest && minDist < 0.08) {
      return {
        name: `Near ${closest.name}`,
        address: closest.address,
        lat,
        lng,
      };
    }

    return {
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: 'Current detected GPS location',
      lat,
      lng,
    };
  }
}

export const placesService = new PlacesService();
