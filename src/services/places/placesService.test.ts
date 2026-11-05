import { describe, it, expect } from 'vitest';
import { placesService } from './placesService';

describe('PlacesService Maharashtra Coverage', () => {
  it('searches for famous Maharashtra hill stations and getaways', async () => {
    const lonavala = await placesService.searchPlaces('Lonavala');
    expect(lonavala.length).toBeGreaterThan(0);
    expect(lonavala[0].name.toLowerCase()).toContain('lonavala');

    const mahabaleshwar = await placesService.searchPlaces('Mahabaleshwar');
    expect(mahabaleshwar.length).toBeGreaterThan(0);
    expect(mahabaleshwar[0].name.toLowerCase()).toContain('mahabaleshwar');

    const alibaug = await placesService.searchPlaces('Alibaug');
    expect(alibaug.length).toBeGreaterThan(0);
    expect(alibaug[0].name.toLowerCase()).toContain('alibaug');

    const igatpuri = await placesService.searchPlaces('Igatpuri');
    expect(igatpuri.length).toBeGreaterThan(0);
    expect(igatpuri[0].name.toLowerCase()).toContain('igatpuri');
  });

  it('searches for famous Maharashtra pilgrimage sites', async () => {
    const shirdi = await placesService.searchPlaces('Shirdi');
    expect(shirdi.length).toBeGreaterThan(0);
    expect(shirdi[0].name.toLowerCase()).toContain('shirdi');

    const pandharpur = await placesService.searchPlaces('Pandharpur');
    expect(pandharpur.length).toBeGreaterThan(0);
    expect(pandharpur[0].name.toLowerCase()).toContain('pandharpur');

    const trimbak = await placesService.searchPlaces('Trimbakeshwar');
    expect(trimbak.length).toBeGreaterThan(0);
    expect(trimbak[0].name.toLowerCase()).toContain('trimbakeshwar');

    const tuljapur = await placesService.searchPlaces('Tuljapur');
    expect(tuljapur.length).toBeGreaterThan(0);
    expect(tuljapur[0].name.toLowerCase()).toContain('tuljapur');
  });

  it('searches for Maharashtra cities across all regions (Vidarbha, Marathwada, Khandesh, Western MH)', async () => {
    const nagpur = await placesService.searchPlaces('Nagpur');
    expect(nagpur.length).toBeGreaterThan(0);
    expect(nagpur[0].name.toLowerCase()).toContain('nagpur');

    const sambhajinagar = await placesService.searchPlaces('Sambhajinagar');
    expect(sambhajinagar.length).toBeGreaterThan(0);
    expect(sambhajinagar[0].name.toLowerCase()).toContain('sambhajinagar');

    const kolhapur = await placesService.searchPlaces('Kolhapur');
    expect(kolhapur.length).toBeGreaterThan(0);
    expect(kolhapur[0].name.toLowerCase()).toContain('kolhapur');

    const tadoba = await placesService.searchPlaces('Tadoba');
    expect(tadoba.length).toBeGreaterThan(0);
    expect(tadoba[0].name.toLowerCase()).toContain('tadoba');
  });

  it('reverse geocodes near a known Maharashtra landmark', async () => {
    // Near Bandra West (19.0596, 72.8295)
    const result = await placesService.reverseGeocode(19.059, 72.829);
    expect(result.name).toContain('Bandra West');
  });
});

