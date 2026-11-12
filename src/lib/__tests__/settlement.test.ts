import { afterEach, describe, expect, it, vi } from 'vitest';
import { settlementAt } from '../overpass';

// Photon's answers: a village 4 km from the night's spot on the route.
const village = { type: 'FeatureCollection', features: [{ geometry: { type: 'Point', coordinates: [-8.5675, 38.1762] }, properties: { name: 'Grândola', country: 'Portugal', osm_key: 'place', osm_value: 'town' } }] };

describe('the village a night is in', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('puts the night on the village itself, not on the spot on the route', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(village))));
    const place = await settlementAt({ lat: 38.2, lng: -8.53 });
    expect(place).toEqual({ name: 'Grândola, Portugal', at: { lat: 38.1762, lng: -8.5675 } });
  });

  it('keeps the spot when there is no village nearby (it can only name the area)', async () => {
    const empty = { type: 'FeatureCollection', features: [] };
    const area = { type: 'FeatureCollection', features: [{ geometry: { type: 'Point', coordinates: [-8, 38] }, properties: { name: 'Alentejo', county: 'Beja', country: 'Portugal' } }] };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(String(url).includes('osm_tag=') ? empty : area))));
    const spot = { lat: 37.9, lng: -8.1 };
    const place = await settlementAt(spot);
    expect(place?.at).toEqual(spot);
  });
});

describe('when Photon is down', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('finds the village with Nominatim, on its centre', async () => {
    const nominatimVillage = { lat: '38.1762', lon: '-8.5675', addresstype: 'town', address: { town: 'Grândola', country: 'Portugal' } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('nominatim')
      ? new Response(JSON.stringify(nominatimVillage))
      : new Response('down', { status: 503 }))));
    const place = await settlementAt({ lat: 38.2, lng: -8.53 });
    expect(place).toEqual({ name: 'Grândola, Portugal', at: { lat: 38.1762, lng: -8.5675 } });
  }, 60000);
});

describe('when Nominatim answers with the parish', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('finds the village itself by name', async () => {
    const parish = { lat: '38.13', lon: '-8.70', addresstype: 'municipality', address: { village: 'Melides', country: 'Portugal' } };
    const village = [{ lat: '38.1473', lon: '-8.7286', addresstype: 'village' }];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('/reverse?') && String(url).includes('nominatim')
      ? new Response(JSON.stringify(parish))
      : String(url).includes('nominatim') ? new Response(JSON.stringify(village)) : new Response('down', { status: 503 }))));
    expect(await settlementAt({ lat: 38.16, lng: -8.78 })).toEqual({ name: 'Melides, Portugal', at: { lat: 38.1473, lng: -8.7286 } });
  }, 60000);
});
