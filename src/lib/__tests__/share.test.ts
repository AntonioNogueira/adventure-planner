import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareOrDownload, canSendFiles } from '../gpx';

// A stand-in browser: a phone (coarse pointer) or a computer, with or without file sharing.
function device(touch: boolean, shareable = false, share = vi.fn(async (_data: unknown) => undefined)) {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: touch }) });
  vi.stubGlobal('navigator', { canShare: () => shareable, share });
  const link = { click: vi.fn(), remove: vi.fn(), href: '', download: '' };
  vi.stubGlobal('document', { createElement: () => link, body: { appendChild: vi.fn() } });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return { share, link };
}

describe('sending a GPX to another app', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('opens the share sheet on a phone that can share files', async () => {
    const { share, link } = device(true, true);
    expect(canSendFiles()).toBe(true);
    expect(await shareOrDownload('trip.gpx', '<gpx/>', 'My trip')).toBe('shared');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'My trip', files: [expect.any(File)] }));
    expect(link.click).not.toHaveBeenCalled();
  });

  it('treats closing the share sheet as cancelled, not an error', async () => {
    device(true, true, vi.fn(async () => { throw new DOMException('closed', 'AbortError'); }));
    expect(await shareOrDownload('trip.gpx', '<gpx/>', 'My trip')).toBe('cancelled');
  });

  it('downloads on a computer, or a phone that cannot share files', async () => {
    const { link } = device(false, true);
    expect(canSendFiles()).toBe(false);
    expect(await shareOrDownload('trip.gpx', '<gpx/>', 'My trip')).toBe('downloaded');
    expect(link.download).toBe('trip.gpx');
    expect(link.click).toHaveBeenCalled();
    device(true, false);
    expect(await shareOrDownload('trip.gpx', '<gpx/>', 'My trip')).toBe('downloaded');
  });
});
