# Own place server (Overpass)

The app's places (stays, food, shops, sights and overnight towns) come from OpenStreetMap through an Overpass server.
The free public ones are fair use: they are often busy and some refuse cloud traffic, which makes places slow or
missing. This folder runs your own, so answers come back in well under a second.

Nothing here has been run yet; try it on a test server first.

## What you need

- A Linux server with Docker, e.g. Hetzner, OVH or Contabo:
  - **one country** (Portugal, Spain…): 4–8 GB RAM, 40–80 GB disk, about €8–15 a month;
  - **all of Europe**: 16 GB RAM, about 250 GB SSD, about €40–60 a month.
- A name for it (`places.yourdomain.com`) pointing at the server's IP address (an A record at your domain registrar).

## Start it

```
git clone https://github.com/AntonioNogueira/adventure-planner && cd adventure-planner/deploy/places-server
DOMAIN=places.yourdomain.com \
APP_ORIGIN=https://yourdomain.com \
OVERPASS_PLANET_URL=https://download.geofabrik.de/europe/portugal-latest.osm.pbf \
OVERPASS_DIFF_URL=https://download.geofabrik.de/europe/portugal-updates/ \
docker compose up -d
docker compose logs -f overpass   # the first import takes from ~30 minutes (a country) to a day (Europe)
```

Leave out `OVERPASS_PLANET_URL` and `OVERPASS_DIFF_URL` for all of Europe. Updates are applied every hour.

Test it:
```
curl -s https://places.yourdomain.com/api/interpreter --data-urlencode 'data=[out:json];node[tourism=hotel](around:3000,38.57,-7.91);out 3;'
```

## Use it in the app

In Render → the service → Environment, set:

```
OVERPASS_URL=https://places.yourdomain.com/api/interpreter,https://overpass-api.de/api/interpreter
```

The app tries the servers in that order, so the public one is only a backup. If no Overpass server answers,
places come from Photon (names and positions, no website or stars), so they never go missing.

## The other services

The same settings move the rest off the free public servers when traffic grows:
`PHOTON_URL` (place names), `OSRM_URL` (road routes), `VALHALLA_URL` (surfaces, voice directions, heights),
`BROUTER_URL` (off-road). Each project publishes Docker images: Photon (komoot/photon), OSRM (osrm/osrm-backend),
Valhalla (ghcr.io/gis-ops/docker-valhalla), BRouter (abrensch/brouter). A paid alternative for map tiles,
place names and routes is a hosted OpenStreetMap service such as MapTiler or Stadia Maps.
