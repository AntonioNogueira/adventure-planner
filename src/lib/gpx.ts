// GPX 1.1 export for GPS devices and apps (Garmin, Wahoo, Komoot, OsmAnd...).

export interface GpxTrack {
  name: string;
  points: { lat: number; lng: number; ele?: number }[];
}

export interface GpxWaypoint {
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

const escapeXml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const coord = (n: number) => n.toFixed(6);

/** One track per day (or a single day); waypoints for overnight stops and bookings. */
export function buildGpx(name: string, tracks: GpxTrack[], waypoints: GpxWaypoint[] = []): string {
  const wpts = waypoints.map(w =>
    `  <wpt lat="${coord(w.lat)}" lon="${coord(w.lng)}"><name>${escapeXml(w.name)}</name>`
    + `${w.description ? `<desc>${escapeXml(w.description)}</desc>` : ''}</wpt>`
  );
  const trks = tracks.map(t => [
    `  <trk><name>${escapeXml(t.name)}</name><trkseg>`,
    ...t.points.map(p => `    <trkpt lat="${coord(p.lat)}" lon="${coord(p.lng)}">${p.ele != null ? `<ele>${p.ele.toFixed(1)}</ele>` : ''}</trkpt>`),
    '  </trkseg></trk>',
  ].join('\n'));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Adventure Planner" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <metadata><name>${escapeXml(name)}</name></metadata>`,
    ...wpts,
    ...trks,
    '</gpx>',
    '',
  ].join('\n');
}

/** A safe file name, e.g. "Cadiz-to-Silves-day-2.gpx". */
export function gpxFileName(name: string) {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'route'}.gpx`;
}

export function downloadFile(fileName: string, content: string, type = 'application/gpx+xml') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
