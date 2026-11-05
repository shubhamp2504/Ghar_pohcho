export type AmenityCategory =
  | 'DHABA_FOOD'
  | 'PETROL_PUMP'
  | 'EV_CHARGER'
  | 'CLEAN_RESTROOM'
  | 'TOLL_PLAZA'
  | 'HOSPITAL';

export interface CorridorStop {
  id: string;
  name: string;
  category: AmenityCategory;
  lat: number;
  lng: number;
  brand?: string;
  highway: string;
  distanceAlongRouteKm: number;
  detourMeters: number;
  amenities: string[];
  rating: number;
  is24x7: boolean;
  notes?: string;
}
