"""Monthly cost and profit per version at different user counts (estimates, EUR ~= USD here).

Calls per planned trip come from the app's code for a typical 3-day trip with 2 overnight stops
(4 points get place suggestions: 2 overnight stops, start, end).
Google list prices per 1,000 calls (Maps Platform pricing from March 2025) and free calls per month per SKU:
Essentials 10,000 free, Pro 5,000 free, Enterprise 1,000 free.
"""
import json

PRICE = {  # per call, free calls per month
    'maps_load':    (0.007, 10000),   # Dynamic Maps (Essentials)
    'geocode':      (0.005, 10000),   # Geocoding (Essentials)
    'directions':   (0.005, 10000),   # Directions / Routes (Essentials)
    'elevation':    (0.005, 10000),   # Elevation (Essentials)
    'places_ent':   (0.035, 1000),    # Nearby/Text Search Enterprise (rating, price level, hours)
    'places_pro':   (0.032, 5000),    # Nearby/Text Search Pro
    'photo':        (0.007, 1000),    # Place Photos (Enterprise)
}

POINTS, NIGHTS = 4, 2
CALLS = {
    # A: everything Google. Stay + food ask for price fields (Enterprise); shops + sights Pro; overnight-town search Pro.
    'A': {'maps_load': 2, 'geocode': 5, 'directions': 3, 'elevation': 2,
          'places_ent': POINTS * 2, 'places_pro': POINTS * 2 + NIGHTS, 'photo': 5},
    # B: everything OpenStreetMap (no Google calls).
    'B': {},
    # C: Google map + Google Places for places to stay only (ratings/prices where people book); OSM for the rest.
    'C': {'maps_load': 2, 'places_ent': POINTS, 'places_pro': NIGHTS, 'photo': 3},
}

TRIPS_PER_MAU = 1.5          # trips planned per monthly active user
AI_PER_TRIP = 0.003          # Gemini Flash-Lite, a few calls per trip
REV_PER_MAU = {'low': 0.11, 'mid': 0.18, 'high': 0.26}   # affiliate + subscriptions (docs/BUSINESS.md)

def fixed(version, mau):
    """Hosting and map services that don't scale per call (EUR/month)."""
    base = 25 + 5            # app hosting + domain/email
    if version == 'A':
        return base
    # B and C need production OpenStreetMap services (routing, place data, geocoding; B also map tiles):
    # paid plans (Stadia/MapTiler) or own servers. Grows in steps with traffic.
    osm = 40 if mau <= 2000 else 90 if mau <= 20000 else 180
    if version == 'B':
        osm += 0 if mau <= 2000 else 30 if mau <= 20000 else 80   # map tiles
    return base + osm

def google_cost(version, trips):
    total = 0.0
    for sku, per_trip in CALLS[version].items():
        price, free = PRICE[sku]
        total += max(0, per_trip * trips - free) * price
    return total

def per_trip_list(version):
    return sum(PRICE[s][0] * n for s, n in CALLS[version].items())

rows = []
for mau in [500, 1000, 5000, 20000, 50000]:
    trips = mau * TRIPS_PER_MAU
    for v in 'ABC':
        cost = fixed(v, mau) + google_cost(v, trips) + AI_PER_TRIP * trips
        rev = {k: r * mau for k, r in REV_PER_MAU.items()}
        rows.append({'mau': mau, 'version': v, 'cost': round(cost), 'google': round(google_cost(v, trips)),
                     'rev_mid': round(rev['mid']), 'profit_low': round(rev['low'] - cost),
                     'profit_mid': round(rev['mid'] - cost), 'profit_high': round(rev['high'] - cost)})

def breakeven(v, key='mid'):
    for mau in range(100, 200001, 100):
        trips = mau * TRIPS_PER_MAU
        cost = fixed(v, mau) + google_cost(v, trips) + AI_PER_TRIP * trips
        if REV_PER_MAU[key] * mau >= cost:
            return mau
    return None

out = {'per_trip': {v: round(per_trip_list(v), 3) for v in 'ABC'}, 'rows': rows,
       'breakeven': {v: {k: breakeven(v, k) for k in REV_PER_MAU} for v in 'ABC'}}
print(json.dumps(out, indent=1))
json.dump(out, open('./costs.json', 'w'), indent=1)
