"""Turn results.json + costs.json into the CSV tables the report uses."""
import csv, json, statistics as st

R = json.load(open('./results.json'))
C = json.load(open('./costs.json'))
D = './'

def write(name, rows):
    with open(D + name, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

def pct(x): return None if x is None else round(100 * x)

# 1. Speed by service: median and slowest call, Google vs OpenStreetMap services.
samples = {}
def add(service, side, rec):
    samples.setdefault((service, side), []).append(rec)
for t in R:
    for g in t['geocode']:
        add('Place-name search', 'Google', g['google']); add('Place-name search', 'OpenStreetMap', g['osm'])
    for l in t['legs']:
        road = 'Off-road day route' if t['offroad'] else 'Road day route'
        add(road, 'Google', l['google']); add(road, 'OpenStreetMap', l['osm'])
    for s in t['places']:
        for cat in ['stay', 'food', 'shop', 'sights']:
            add('Places near a stop', 'Google', s[cat]['google']); add('Places near a stop', 'OpenStreetMap', s[cat]['osm'])
speed = []
for (service, side), recs in samples.items():
    ok = [r['ms'] for r in recs if r['ok']]
    speed.append({'service': service, 'provider': side, 'median_ms': round(st.median(ok)) if ok else None,
                  'slowest_ms': max(ok) if ok else None, 'calls': len(recs), 'failed': sum(not r['ok'] for r in recs)})
order = ['Place-name search', 'Road day route', 'Off-road day route', 'Places near a stop']
speed.sort(key=lambda r: (order.index(r['service']), r['provider']))
write('speed.csv', speed)

# 2. Routes per trip: distance, time, unpaved share, failures.
routes = []
for t in R:
    def tot(side, key):
        vals = [l[side][key] for l in t['legs'] if l[side]['ok'] and l[side].get(key) is not None]
        return round(sum(vals), 1) if len(vals) == len(t['legs']) else None
    def unp(side):
        num = den = 0
        for l in t['legs']:
            x = l[side]
            if x['ok'] and x.get('unpaved') is not None and x.get('km'): num += x['unpaved'] * x['km']; den += x['km']
        return round(100 * num / den) if den else None
    routes.append({'trip': t['label'], 'kind': 'Off-road' if t['offroad'] else 'Road', 'osm_engine': 'BRouter' if t['offroad'] else 'OSRM',
                   'google_km': tot('google', 'km'), 'osm_km': tot('osm', 'km'),
                   'google_hours': None if tot('google', 'min') is None else round(tot('google', 'min') / 60, 1),
                   'osm_hours': None if tot('osm', 'min') is None else round(tot('osm', 'min') / 60, 1),
                   'google_unpaved_pct': unp('google'), 'osm_unpaved_pct': unp('osm'),
                   'google_failed_days': sum(not l['google']['ok'] for l in t['legs']), 'osm_failed_days': sum(not l['osm']['ok'] for l in t['legs']),
                   'days': len(t['legs'])})
write('routes.csv', routes)

# 3. Places: per category, results found and how many carry details people use to choose.
places = []
for cat, label in [('stay', 'Places to stay'), ('food', 'Restaurants & cafés'), ('shop', 'Bike / moto / outdoor shops'), ('sights', 'Sights')]:
    g = [s[cat]['google'] for t in R for s in t['places']]
    o_raw = [s[cat]['osm'] for t in R for s in t['places']]
    # A search the free server refused (503) was retried slowly once: count what it then found.
    o = [{**x, **x['retry']} if not x['ok'] and x.get('retry') else x for x in o_raw]
    gm = lambda k: round(100 * st.mean([x.get(k, 0) for x in g if x['ok']])) if any(x['ok'] for x in g) else None
    places.append({'category': label, 'stops': len(g),
                   'google_found_avg': round(st.mean([x.get('n', 0) for x in g if x['ok']]), 1),
                   'osm_found_avg': round(st.mean([x.get('n', 0) for x in o if x['ok']]), 1),
                   'google_empty_stops': sum(1 for x in g if not x['ok'] or x.get('n', 0) == 0),
                   'osm_empty_stops': sum(1 for x in o if not x['ok'] or x.get('n', 0) == 0),
                   'osm_refused_first_try': sum(1 for x in o_raw if not x['ok']),
                   'google_rating_pct': gm('rating'), 'google_price_pct': gm('price'), 'google_website_pct': gm('web'),
                   'google_hours_pct': gm('hours'), 'google_photo_pct': gm('photo')})
write('places.csv', places)

# 4. Place-name search accuracy (distance from the town centre).
geo = []
for t in R:
    for g in t['geocode']:
        geo.append({'place': g['q'], 'google_off_km': g['google']['offKm'], 'osm_off_km': g['osm']['offKm']})
write('geocode.csv', geo)

# 5. Costs and profit by users.
names = {'A': 'All Google', 'B': 'All OpenStreetMap', 'C': 'Hybrid (Google map, Google stays)'}
write('profit.csv', [{'monthly_users': r['mau'], 'version': names[r['version']], 'cost_eur': r['cost'], 'google_fees_eur': r['google'],
                      'revenue_eur': r['rev_mid'], 'profit_low_eur': r['profit_low'], 'profit_mid_eur': r['profit_mid'], 'profit_high_eur': r['profit_high']} for r in C['rows']])
write('versions.csv', [{'version': names[v], 'fees_per_trip_usd': C['per_trip'][v],
                        'breakeven_users_mid': C['breakeven'][v]['mid'] or ''} for v in 'ABC'])
print(open(D + 'speed.csv').read()); print(open(D + 'routes.csv').read()); print(open(D + 'places.csv').read())
