import { afterEach, describe, expect, it, vi } from 'vitest';
import { report, isDown, downServices, resetHealth, trackedFetch } from '../serviceHealth';
import { photon } from '../geocode';

describe('service health', () => {
  afterEach(() => { resetHealth(); vi.unstubAllGlobals(); });

  it('skips a service after a timeout, or after two quick errors, until it answers again', () => {
    report('photon', false, 6000, 'TimeoutError signal timed out');
    expect(isDown('photon')).toBe(true);
    report('overpass', false, 200, 'HTTP 504');
    expect(isDown('overpass')).toBe(false);
    report('overpass', false, 200, 'HTTP 504');
    expect(downServices().sort()).toEqual(['overpass', 'photon']);
    report('photon', true, 300);
    expect(isDown('photon')).toBe(false);
  });

  it("doesn't wait on Photon when it's down: lookups fail at once (callers use Nominatim)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    report('photon', false, 6000, 'TimeoutError');
    const started = Date.now();
    await expect(photon('/api/?q=Silves')).rejects.toThrow(/unavailable/);
    expect(Date.now() - started).toBeLessThan(100);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts "no route here" as up, and 5xx or network errors as down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no route', { status: 400 })));
    await trackedFetch('osrm', 'https://x');
    expect(isDown('osrm')).toBe(false);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    await expect(trackedFetch('brouter', 'https://x')).rejects.toThrow();
    await expect(trackedFetch('brouter', 'https://x')).rejects.toThrow();
    expect(isDown('brouter')).toBe(true);
  });
});
