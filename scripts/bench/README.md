# Google vs OpenStreetMap benchmark

Times and compares the services behind the two map stacks on 8 test trips (road, bike, bikepacking,
hiking, adventure motorcycle; PT, ES, IT, US, BE/NL, MA), then estimates monthly cost and profit.

```
cd scripts/bench
GKEY=<Google Maps key> NODE_USE_ENV_PROXY=1 node bench.mjs   # writes results.json (≈10 min)
python3 costs.py                                              # writes costs.json
python3 tables.py                                             # writes the CSV tables
```

The free public servers (Photon, OSRM, BRouter, Valhalla) are fair use: run it rarely.
Results from 9 Nov 2026 are summarised in docs/BUSINESS.md, section 10.
