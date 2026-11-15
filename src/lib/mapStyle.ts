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

/** The Inspiration globe: NASA Blue Marble satellite imagery when zoomed out (public domain, free for any use),
 *  fading into the topographic map as you zoom in to a journey. */
export const BLUE_MARBLE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';
export const GLOBE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    sat: { type: 'raster', tiles: [BLUE_MARBLE], tileSize: 256, maxzoom: 8, attribution: 'Imagery: <a href="https://earthdata.nasa.gov/gibs">NASA Blue Marble (GIBS)</a>' },
    base: { type: 'raster', tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 17,
      attribution: `${OSM_CREDIT}, SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)` },
  },
  layers: [
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 1, 6.5, 0], 'raster-saturation': -0.1 } },
    { id: 'base', type: 'raster', source: 'base', minzoom: 4, paint: { ...TOPO_PAINT, 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 6.5, 1] } },
  ],
};
