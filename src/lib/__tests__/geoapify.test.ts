import { describe, it, expect } from 'vitest';
import { geoapifyElement } from '../geoapify';
import { classify } from '../overpass';

describe('geoapifyElement', () => {
  it('keeps the raw OSM tags and id', () => {
    const e = geoapifyElement({ properties: { name: 'Casa Azul', lat: 38.7, lon: -9.1, categories: ['accommodation.guest_house'],
      datasource: { sourcename: 'openstreetmap', raw: { osm_id: 123, osm_type: 'w', tourism: 'guest_house', name: 'Casa Azul', website: 'https://x.pt' } } } })!;
    expect(e).toMatchObject({ type: 'way', id: 123, lat: 38.7, lon: -9.1 });
    expect(e.tags).toMatchObject({ tourism: 'guest_house', name: 'Casa Azul', website: 'https://x.pt' });
    expect(e.tags!.osm_id).toBeUndefined();
    expect(classify(e.tags!)).toBe('stay');
  });
  it('makes tags from the category asked for when there are no raw tags', () => {
    const e = geoapifyElement({ geometry: { coordinates: [-9.1, 38.7] }, properties: { name: 'Bike Shop', categories: ['commercial', 'commercial.outdoor_and_sport', 'commercial.outdoor_and_sport.bicycle'], street: 'Rua A', city: 'Lisboa' } },
      ['commercial.outdoor_and_sport.bicycle'])!;
    expect(e.tags).toMatchObject({ shop: 'bicycle', name: 'Bike Shop', 'addr:street': 'Rua A', 'addr:city': 'Lisboa' });
    expect(classify(e.tags!)).toBe('shop');
  });
  it('names water points and toilets by their kind', () => {
    const e = geoapifyElement({ properties: { lat: 1, lon: 2, categories: ['amenity.drinking_water'] } })!;
    expect(classify(e.tags!)).toBe('water');
  });
});
