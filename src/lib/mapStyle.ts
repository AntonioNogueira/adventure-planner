// The map imagery shared by the trip map and the Inspiration map: OpenTopoMap with a faded, printed-sheet look.
import type { StyleSpecification } from 'maplibre-gl';

export const OSM_CREDIT = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TOPO_PAINT = { 'raster-saturation': -0.38, 'raster-contrast': -0.08, 'raster-brightness-min': 0.05, 'raster-hue-rotate': -4 };

export const raster = (tiles: string[], attribution: string, maxzoom: number, paint: Record<string, number>): StyleSpecification => ({
  version: 8,
  sources: { base: { type: 'raster', tiles, tileSize: 256, attribution, maxzoom } },
  layers: [{ id: 'base', type: 'raster', source: 'base', paint }],
});

export const TOPO_STYLE = raster(['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
  `${OSM_CREDIT}, SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`, 17, TOPO_PAINT);
