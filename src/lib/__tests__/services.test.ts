import { describe, expect, it } from 'vitest';
import { resolveServices, PUBLIC_SERVICES } from '../services';
import { photonElement, classify, toItem } from '../overpass';

describe('service addresses', () => {
  it('uses the free public servers when nothing is set', () => {
    expect(resolveServices()).toEqual(PUBLIC_SERVICES);
    expect(resolveServices({ overpass: '' }).overpass).toEqual(PUBLIC_SERVICES.overpass);
  });
  it('takes own servers from the settings, in order, without trailing slashes', () => {
    const s = resolveServices({ overpass: 'https://osm.example.com/api/interpreter/, https://backup.example.com/api/interpreter', photon: 'https://photon.example.com/' });
    expect(s.overpass).toEqual(['https://osm.example.com/api/interpreter', 'https://backup.example.com/api/interpreter']);
    expect(s.photon).toBe('https://photon.example.com');
    expect(s.brouter).toBe(PUBLIC_SERVICES.brouter);
    expect(resolveServices({ overpass: ['https://a.example.com'] }).overpass).toEqual(['https://a.example.com']);
  });
});

describe('places from Photon (fallback)', () => {
  const hotel = { geometry: { coordinates: [-7.91, 38.57] as [number, number] },
    properties: { osm_type: 'W', osm_id: '42', osm_key: 'tourism', osm_value: 'guest_house', name: 'Casa dos Teles', street: 'Rua X', city: 'Évora' } };
  it('reads a Photon place like an Overpass one', () => {
    const e = photonElement(hotel)!;
    expect(e).toMatchObject({ type: 'way', id: 42, lat: 38.57, lon: -7.91 });
    expect(classify(e.tags!)).toBe('stay');
    const item = toItem(e, 'stay')!;
    expect(item).toMatchObject({ name: 'Casa dos Teles', stayKind: 'guesthouse', placeId: 'osm:way/42' });
    expect(item.description).toContain('Évora');
  });
  it('skips places without a name', () => {
    expect(photonElement({ ...hotel, properties: { ...hotel.properties, name: undefined } })).toBeNull();
  });
});
