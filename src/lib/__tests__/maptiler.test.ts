import { afterEach, describe, expect, it, vi } from 'vitest';
import { maptilerPlaceAt, maptilerSearch, pickMapTiler } from '../maptiler';
import { resetHealth, report } from '../serviceHealth';
import { geocodeAddress } from '../geocode';

const silves = { place_type: ['municipality'], text: 'Silves', center: [-8.4396, 37.1894], context: [{ id: 'region.1', text: 'Faro' }, { id: 'country.2', text: 'Portugal' }] };
const street = { place_type: ['road'], text: 'Rua de Silves', center: [-9.1, 38.7] };

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
