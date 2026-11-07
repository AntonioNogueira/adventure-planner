import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { detectDefaults, detectCountry, translate, formatters, localizeDistanceText } from '../settings';
import { PT, PT_BR } from '../i18n';

describe('detectDefaults', () => {
  it('uses the region of the browser language', () => {
    expect(detectDefaults(['pt-PT'], 'Europe/Lisbon')).toEqual({ units: 'metric', currency: 'EUR', language: 'pt-PT' });
    expect(detectDefaults(['pt-BR'], 'America/Sao_Paulo')).toEqual({ units: 'metric', currency: 'BRL', language: 'pt-BR' });
    expect(detectDefaults(['en-GB'], 'Europe/London')).toEqual({ units: 'metric', currency: 'GBP', language: 'en' });
    expect(detectDefaults(['en-US'], 'America/New_York')).toEqual({ units: 'imperial', currency: 'USD', language: 'en' });
    expect(detectDefaults(['de-DE'], 'Europe/Berlin')).toEqual({ units: 'metric', currency: 'EUR', language: 'en' });
  });
  it('falls back to the time zone when the language has no region', () => {
    expect(detectCountry(['en'], 'Europe/London')).toBe('GB');
    expect(detectDefaults(['pt'], 'America/Sao_Paulo')).toMatchObject({ language: 'pt-BR', currency: 'BRL' });
    expect(detectDefaults(['pt'], 'Europe/Lisbon')).toMatchObject({ language: 'pt-PT', currency: 'EUR' });
    expect(detectDefaults(['en'], 'America/Chicago')).toMatchObject({ units: 'imperial', currency: 'USD' });
    expect(detectDefaults(['fr'], 'Europe/Paris')).toMatchObject({ currency: 'EUR', units: 'metric', language: 'en' });
  });
});

describe('translate', () => {
  it('translates and fills placeholders, falling back to English', () => {
    expect(translate('pt-PT', 'Day {n}', { n: 3 })).toBe('Dia 3');
    expect(translate('pt-BR', 'Save')).toBe('Salvar');
    expect(translate('pt-PT', 'Save')).toBe('Guardar');
    expect(translate('en', 'Day {n}', { n: 3 })).toBe('Day 3');
    expect(translate('pt-PT', 'Something new')).toBe('Something new');
  });

  // Every literal text passed to t()/tr() in the app has a Portuguese entry, with the same placeholders.
  it('has a Portuguese translation for every text in the code', () => {
    const files: string[] = [];
    const walk = (dir: string) => readdirSync(dir).forEach(f => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (f !== '__tests__') walk(p); } else if (/\.tsx?$/.test(f) && !p.endsWith('i18n.ts')) files.push(p);
    });
    walk(join(__dirname, '..', '..'));
    const keys = new Set<string>();
    const pattern = /\b(?:t|tr)\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(pattern)) keys.add(Function(`return ${m[1]}`)());
    }
    expect(keys.size).toBeGreaterThan(200);
    const missing = [...keys].filter(k => !(k in PT));
    expect(missing).toEqual([]);
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join();
    const mismatched = [...keys].filter(k => placeholders(PT[k]) !== placeholders(k) || placeholders(PT_BR[k]) !== placeholders(k));
    expect(mismatched).toEqual([]);
  });
});

describe('units', () => {
  it('formats distances, heights and speeds in the chosen units', () => {
    const metric = formatters({ units: 'metric', currency: 'EUR', language: 'en' });
    const imperial = formatters({ units: 'imperial', currency: 'USD', language: 'en' });
    expect(metric.dist(67.4)).toBe('67.4 km');
    expect(imperial.dist(100)).toBe('62.1 mi');
    expect(imperial.elev(1000)).toBe('3,281 ft');
    expect(imperial.speed(90)).toBe('56 mph');
    expect(metric.speed(90)).toBe('90 km/h');
    expect(formatters({ units: 'metric', currency: 'EUR', language: 'pt-PT' }).dist(67.4)).toBe('67,4 km');
  });
  it('rewrites distances inside stored text', () => {
    expect(localizeDistanceText('67.4 km · 47 min', 'imperial', 'en-US')).toBe('41.9 mi · 47 min');
    expect(localizeDistanceText('161 km', 'metric', 'pt-PT')).toBe('161 km');
    expect(localizeDistanceText('40.6 km', 'metric', 'pt-BR')).toBe('40,6 km');
  });
});
