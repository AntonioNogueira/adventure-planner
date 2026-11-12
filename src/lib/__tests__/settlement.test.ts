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
