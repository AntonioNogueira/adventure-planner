// App settings: distance units, currency and language. Defaults come from the browser's language
// and time zone (no location permission needed); choices are remembered on this device.
import { useSyncExternalStore } from 'react';
import { PT, PT_BR } from './i18n';

export type Units = 'metric' | 'imperial';
export type Language = 'en' | 'pt-PT' | 'pt-BR';

export interface AppSettings {
  units: Units;
  currency: string;
  language: Language;
}

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'pt-PT', label: 'Português (Portugal)' },
  { id: 'pt-BR', label: 'Português (Brasil)' },
];

export const CURRENCIES = ['EUR', 'GBP', 'USD', 'BRL', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'CAD', 'AUD', 'JPY'];

// ---- Defaults from the browser's locale ----

const EURO = new Set(['PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'LU', 'IE', 'AT', 'FI', 'GR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'CY', 'HR', 'MC', 'AD', 'SM', 'VA', 'ME', 'XK']);
const COUNTRY_CURRENCY: Record<string, string> = {
  GB: 'GBP', US: 'USD', BR: 'BRL', CH: 'CHF', LI: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK',
  CA: 'CAD', AU: 'AUD', JP: 'JPY', NZ: 'NZD', MX: 'MXN', ZA: 'ZAR', IN: 'INR', AR: 'ARS', CL: 'CLP', AO: 'AOA', MZ: 'MZN',
};
/** Countries that use miles on the road (the UK uses miles too, but km is asked for here). */
const MILES = new Set(['US', 'LR', 'MM']);

const ZONE_COUNTRY: Record<string, string> = {
  'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Madrid': 'ES', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Manaus': 'BR',
  'America/Belem': 'BR', 'America/Cuiaba': 'BR', 'America/Porto_Velho': 'BR', 'America/Noronha': 'BR',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX', 'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU', 'Asia/Tokyo': 'JP', 'Africa/Luanda': 'AO', 'Africa/Maputo': 'MZ',
};

/** The country from a language tag ("pt-BR" → BR), else from the time zone. */
export function detectCountry(languages: readonly string[], timeZone = ''): string | undefined {
  for (const tag of languages) {
    const region = tag.split(/[-_]/)[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  if (ZONE_COUNTRY[timeZone]) return ZONE_COUNTRY[timeZone];
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Boise)/.test(timeZone) || timeZone.startsWith('US/')) return 'US';
  return undefined;
}

export function detectDefaults(languages: readonly string[], timeZone = ''): AppSettings {
  const country = detectCountry(languages, timeZone);
  const primary = (languages[0] || 'en').toLowerCase();
  const language: Language = primary.startsWith('pt')
    ? (primary === 'pt-br' || (country === 'BR' && !/^pt-(pt|ao|mz)/.test(primary)) ? 'pt-BR' : 'pt-PT')
    : 'en';
  const currency = country ? (EURO.has(country) ? 'EUR' : COUNTRY_CURRENCY[country] || (timeZone.startsWith('Europe/') ? 'EUR' : 'USD'))
    : timeZone.startsWith('Europe/') ? 'EUR' : 'USD';
  return { units: country && MILES.has(country) ? 'imperial' : 'metric', currency, language };
}

// ---- The store (shared by every React root, including map popups) ----

const KEY = 'adventure-planner.settings';

function browserDefaults(): AppSettings {
  if (typeof navigator === 'undefined') return { units: 'metric', currency: 'EUR', language: 'en' };
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignore */ }
  return detectDefaults(navigator.languages?.length ? navigator.languages : [navigator.language || 'en'], zone);
}

function load(): AppSettings {
  const defaults = browserDefaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') return { ...defaults, ...saved };
  } catch { /* private mode or blocked storage: defaults */ }
  return defaults;
}

let current: AppSettings = load();
const listeners = new Set<() => void>();

export function getSettings() { return current; }

export function updateSettings(patch: Partial<AppSettings>) {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* not saved; still applied */ }
  if (typeof document !== 'undefined') document.documentElement.lang = current.language;
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Settings plus formatters bound to them; re-renders when settings change. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSettings, getSettings);
  return { settings, update: updateSettings, ...formatters(settings) };
}

// ---- Translation ----

/** Translate English text (the key) to the chosen language; {name} placeholders are filled from vars. */
export function translate(language: Language, text: string, vars?: Record<string, string | number>): string {
  const table = language === 'pt-BR' ? PT_BR : language === 'pt-PT' ? PT : null;
  let out = (table && table[text]) || text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export const t = (text: string, vars?: Record<string, string | number>) => translate(current.language, text, vars);

// ---- Units ----

const KM_PER_MILE = 1.609344;
const FT_PER_M = 3.28084;

export function formatters(s: AppSettings) {
  const imperial = s.units === 'imperial';
  const locale = s.language === 'en' ? (imperial ? 'en-US' : 'en-GB') : s.language;
  const num = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  return {
    t: (text: string, vars?: Record<string, string | number>) => translate(s.language, text, vars),
    locale,
    /** Distance unit label: km or mi. */
    distUnit: imperial ? 'mi' : 'km',
    /** km → number in the chosen unit. */
    toDist: (km: number) => (imperial ? km / KM_PER_MILE : km),
    /** chosen unit → km */
    fromDist: (value: number) => (imperial ? value * KM_PER_MILE : value),
    /** "67 km" / "42 mi"; one decimal under 100. */
    dist: (km: number, digits?: number) => {
      const v = imperial ? km / KM_PER_MILE : km;
      return `${num(v, digits ?? (v < 100 ? 1 : 0))} ${imperial ? 'mi' : 'km'}`;
    },
    /** "757 m" / "2,484 ft" */
    elev: (m: number) => `${num(imperial ? m * FT_PER_M : m)} ${imperial ? 'ft' : 'm'}`,
    elevUnit: imperial ? 'ft' : 'm',
    toElev: (m: number) => (imperial ? m * FT_PER_M : m),
    /** "90 km/h" / "56 mph" */
    speed: (kmh: number) => (imperial ? `${num(kmh / KM_PER_MILE)} mph` : `${num(kmh)} km/h`),
    /** Money in the chosen (or a given) currency. */
    money: (amount: number, currency = s.currency) => {
      try {
        return amount.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: amount >= 100 ? 0 : 2 });
      } catch { return `${amount.toFixed(2)} ${currency}`; }
    },
    /** Rewrite distances inside stored text ("67.4 km · 47 min") into the chosen unit. */
    localizeText: (text: string) => localizeDistanceText(text, s.units, locale),
    /** Dates in the chosen language. */
    date: (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
  };
}

/** "67.4 km" → "41.9 mi" when imperial; also turns the decimal separator to the locale's. */
export function localizeDistanceText(text: string, units: Units, locale = 'en-GB'): string {
  return text.replace(/(\d+(?:[.,]\d+)?)\s?km\b/g, (_, n: string) => {
    const km = Number(n.replace(',', '.'));
    const v = units === 'imperial' ? km / KM_PER_MILE : km;
    return `${v.toLocaleString(locale, { maximumFractionDigits: v < 100 ? 1 : 0 })} ${units === 'imperial' ? 'mi' : 'km'}`;
  });
}
