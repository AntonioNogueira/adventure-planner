// Fuel and toll estimates by country: typical national averages, used when the traveller hasn't typed
// their own values. Fuel prices are a typical recent average for unleaded 95 (EUR per litre), not the
// price on the trip's date (which nobody knows yet); tolls are a typical car/motorcycle rate per km on
// toll roads (countries with a vignette instead of per-km tolls have 0). Rough by nature: the budget
// labels them as estimates and lets the traveller change them.
import { RouteLeg } from '../types';

/** EUR per litre, unleaded 95, typical recent national average. */
export const FUEL_EUR_PER_L: Record<string, number> = {
  PT: 1.74, ES: 1.55, FR: 1.82, IT: 1.86, DE: 1.76, NL: 2.02, BE: 1.72, LU: 1.56, AT: 1.62, CH: 1.88,
  GB: 1.66, IE: 1.76, DK: 1.88, SE: 1.66, NO: 2.08, FI: 1.80, PL: 1.42, CZ: 1.50, SK: 1.62, HU: 1.56,
  SI: 1.48, HR: 1.50, GR: 1.86, RO: 1.46, BG: 1.30, TR: 1.28, AD: 1.42, MC: 1.85, IS: 2.10, EE: 1.65,
  LV: 1.62, LT: 1.55, MT: 1.34, CY: 1.42, RS: 1.55, BA: 1.42, ME: 1.50, AL: 1.80, MK: 1.35,
  MA: 1.25, TN: 0.75, US: 0.82, CA: 1.10, MX: 1.20, BR: 1.05, AR: 0.95, CL: 1.20, AU: 1.15, NZ: 1.55, JP: 1.05, ZA: 1.10,
};

/** EUR per km on toll roads, typical car/motorcycle rate (0 where a vignette replaces per-km tolls). */
export const TOLL_EUR_PER_KM: Record<string, number> = {
  PT: 0.08, ES: 0.08, FR: 0.09, IT: 0.075, GR: 0.06, HR: 0.07, PL: 0.05, IE: 0.10, NO: 0.10, RS: 0.05,
  MK: 0.04, MA: 0.04, TR: 0.03, US: 0.06, BR: 0.04, MX: 0.10, CL: 0.06, AR: 0.03,
};

/** Rough exchange rates: units of each currency per euro. */
export const PER_EURO: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.85, BRL: 6.0, CHF: 0.95, SEK: 11.5, NOK: 11.7, DKK: 7.46, PLN: 4.3, CZK: 25,
  CAD: 1.5, AUD: 1.65, JPY: 160,
};

const NAMES: Record<string, string> = {
  portugal: 'PT', spain: 'ES', españa: 'ES', espanha: 'ES', france: 'FR', frança: 'FR', italy: 'IT', italia: 'IT', itália: 'IT',
  germany: 'DE', deutschland: 'DE', alemanha: 'DE', netherlands: 'NL', 'the netherlands': 'NL', nederland: 'NL', 'países baixos': 'NL',
  belgium: 'BE', bélgica: 'BE', belgique: 'BE', luxembourg: 'LU', austria: 'AT', österreich: 'AT', áustria: 'AT',
  switzerland: 'CH', suíça: 'CH', schweiz: 'CH', suisse: 'CH', 'united kingdom': 'GB', uk: 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  'reino unido': 'GB', ireland: 'IE', irlanda: 'IE', denmark: 'DK', dinamarca: 'DK', sweden: 'SE', suécia: 'SE', norway: 'NO', noruega: 'NO',
  finland: 'FI', poland: 'PL', polónia: 'PL', polônia: 'PL', czechia: 'CZ', 'czech republic': 'CZ', slovakia: 'SK', hungary: 'HU',
  slovenia: 'SI', croatia: 'HR', croácia: 'HR', greece: 'GR', grécia: 'GR', romania: 'RO', bulgaria: 'BG', turkey: 'TR', türkiye: 'TR',
  andorra: 'AD', monaco: 'MC', iceland: 'IS', estonia: 'EE', latvia: 'LV', lithuania: 'LT', malta: 'MT', cyprus: 'CY', serbia: 'RS',
  'bosnia and herzegovina': 'BA', montenegro: 'ME', albania: 'AL', 'north macedonia': 'MK', morocco: 'MA', marrocos: 'MA', maroc: 'MA',
  tunisia: 'TN', 'united states': 'US', usa: 'US', 'united states of america': 'US', 'estados unidos': 'US', canada: 'CA', mexico: 'MX',
  méxico: 'MX', brazil: 'BR', brasil: 'BR', argentina: 'AR', chile: 'CL', australia: 'AU', 'new zealand': 'NZ', japan: 'JP', 'south africa': 'ZA',
};
// US states and Brazilian states often end a name ("Moab, UT", "Paraty, RJ").
const US_STATE = /^(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]|utah|colorado|california|nevada|arizona|new mexico)$/i;

/** The country (ISO code) at the end of a place name like "Tavira, Portugal", or undefined. */
export function countryOf(name: string | undefined): string | undefined {
  const parts = (name || '').split(',').map(p => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const code = NAMES[parts[i].toLowerCase()];
    if (code) return code;
    if (US_STATE.test(parts[i])) return 'US';
  }
  return undefined;
}

export interface CountryShare { country: string; km: number }

/** Riding km per country, by the country of each day's start and end (half each). */
export function kmByCountry(legs: RouteLeg[]): CountryShare[] {
  const km = new Map<string, number>();
  let last: string | undefined;
  for (const leg of legs) {
    const from = countryOf(leg.from) || last;
    const to = countryOf(leg.to) || from;
    last = to || last;
    const d = Math.max(0, (leg.distanceMeters || 0) / 1000 - (leg.ferryKm || 0));
    const parts = [from, to].filter((c): c is string => Boolean(c));
    if (!parts.length) km.set('?', (km.get('?') || 0) + d);
    parts.forEach(c => km.set(c, (km.get(c) || 0) + d / parts.length));
  }
  return [...km.entries()].map(([country, k]) => ({ country, km: k })).sort((a, b) => b.km - a.km);
}

const convert = (eur: number, currency: string) => eur * (PER_EURO[currency.toUpperCase()] ?? 1);

/** Average fuel price per litre over the route (in `currency`), weighted by km per country; null if unknown. */
export function estimatedFuelPrice(legs: RouteLeg[], currency: string): number | null {
  const shares = kmByCountry(legs).filter(s => FUEL_EUR_PER_L[s.country]);
  const total = shares.reduce((a, s) => a + s.km, 0);
  if (!total) return null;
  const eur = shares.reduce((a, s) => a + s.km * FUEL_EUR_PER_L[s.country], 0) / total;
  return Math.round(convert(eur, currency) * 100) / 100;
}

/** Typical toll per km on toll roads over the route (in `currency`), weighted by km per country. */
export function estimatedTollRate(legs: RouteLeg[], currency: string): number {
  const shares = kmByCountry(legs).filter(s => s.country !== '?');
  const total = shares.reduce((a, s) => a + s.km, 0);
  if (!total) return 0;
  const eur = shares.reduce((a, s) => a + s.km * (TOLL_EUR_PER_KM[s.country] || 0), 0) / total;
  return Math.round(convert(eur, currency) * 1000) / 1000;
}

/** Litres per 100 km for a typical touring/adventure motorcycle; off-road riding uses a little more. */
export function estimatedConsumption(offroad = false): number {
  return offroad ? 6 : 5.2;
}
