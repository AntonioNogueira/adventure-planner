import { afterEach, describe, expect, it, vi } from 'vitest';
import { maptilerPlaceAt, maptilerSearch, pickMapTiler } from '../maptiler';
import { resetHealth, report } from '../serviceHealth';
import { geocodeAddress } from '../geocode';

const silves = { place_type: ['municipality'], text: 'Silves', center: [-8.4396, 37.1894], context: [{ id: 'region.1', text: 'Faro' }, { id: 'country.2', text: 'Portugal' }] };
const street = { place_type: ['road'], text: 'Rua de Silves', center: [-9.1, 38.7] };

describe('MapTiler villages', () => {
  afterEach(() => { vi.unstubAllGlobals(); resetHealth(); });
  it('names the village (municipal district), not the hamlet next to the point', async () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { maptilerKey: 'testkey123' } });
    // What MapTiler answers near Melides: the village at the district level, a hamlet at the smallest.
    const melides = { place_type: ['municipal_district'], text: 'Melides', center: [-8.7286, 38.1473], context: [{ id: 'country.15', text: 'Portugal' }] };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify({ features: String(url).includes('types=municipal_district') ? [melides] : [] }))));
    expect(await maptilerPlaceAt({ lat: 38.15, lng: -8.73 })).toEqual({ name: 'Melides, Portugal', at: { lat: 38.1473, lng: -8.7286 } });
  });
});

describe('MapTiler parish unions', () => {
  afterEach(() => { vi.unstubAllGlobals(); resetHealth(); });
  it('names the seat village of a union of parishes', async () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { maptilerKey: 'testkey123' } });
    const union = { place_type: ['municipal_district'], text: 'Longueira/Almograve', center: [-8.7928, 37.6529], context: [{ id: 'country.15', text: 'Portugal' }] };
    const seat = { place_type: ['place'], text: 'Almograve', center: [-8.7928, 37.6529] };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify({ features: String(url).includes('types=municipal_district') ? [union] : [seat] }))));
    expect(await maptilerPlaceAt({ lat: 37.65, lng: -8.79 })).toEqual({ name: 'Almograve, Portugal', at: { lat: 37.6529, lng: -8.7928 } });
  });
  it('takes the first name when no village sits at the centre', async () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { maptilerKey: 'testkey123' } });
    const union = { place_type: ['municipal_district'], text: 'Lagoa e Carvoeiro', center: [-8.4541, 37.1363], context: [{ id: 'country.15', text: 'Portugal' }] };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify({ features: String(url).includes('types=municipal_district') ? [union] : [] }))));
    expect((await maptilerPlaceAt({ lat: 37.11, lng: -8.46 }))?.name).toBe('Lagoa, Portugal');
  });
});

describe('MapTiler (second place-name service)', () => {
  afterEach(() => { vi.unstubAllGlobals(); resetHealth(); });
  const withKey = () => vi.stubGlobal('window', { __APP_CONFIG__: { maptilerKey: 'testkey123' } });

  it('prefers a town over a street of the same name', () => {
    expect(pickMapTiler([street, silves] as any)).toEqual({ lat: 37.1894, lng: -8.4396 });
  });

  it('finds a town and names the village at a point, with its centre', async () => {
    withKey();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ features: [silves] })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await maptilerSearch('Silves, Portugal')).toEqual({ lat: 37.1894, lng: -8.4396 });
    expect(await maptilerPlaceAt({ lat: 37.2, lng: -8.45 })).toEqual({ name: 'Silves, Portugal', at: { lat: 37.1894, lng: -8.4396 } });
    expect(String((fetchMock.mock.calls as any)[1][0])).toContain('types=municipal_district,locality');
    expect(String((fetchMock.mock.calls as any)[0][0])).toContain('key=testkey123');
  });

  it('answers for Photon when Photon is down', async () => {
    withKey();
    report('photon', false, 6000, 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('maptiler')
      ? new Response(JSON.stringify({ features: [silves] }))
      : new Response('down', { status: 503 }))));
    expect(await geocodeAddress('Silves, Portugal (maptiler test)')).toEqual({ lat: 37.1894, lng: -8.4396 });
  });
});
