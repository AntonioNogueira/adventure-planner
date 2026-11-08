import { describe, expect, it } from 'vitest';
import { countryOf, kmByCountry, estimatedFuelPrice, estimatedTollRate } from '../fuel';
import { RouteLeg } from '../../types';

const leg = (from: string, to: string, km: number): RouteLeg => ({ from, to, distance: '', duration: '', distanceMeters: km * 1000 });

describe('countryOf', () => {
  it('reads the country from place names in several languages', () => {
    expect(countryOf('Tavira, Portugal')).toBe('PT');
    expect(countryOf('Granada, España')).toBe('ES');
    expect(countryOf('Florianópolis, Brasil')).toBe('BR');
    expect(countryOf('Moab, UT')).toBe('US');
    expect(countryOf('Moab, Utah, USA')).toBe('US');
    expect(countryOf('Near Alcoutim, Portugal')).toBe('PT');
    expect(countryOf('Somewhere')).toBeUndefined();
  });
});

describe('fuel and toll estimates', () => {
  const legs = [leg('Tavira, Portugal', 'Huelva, Spain', 100), leg('Huelva, Spain', 'Sevilla, Spain', 100)];
  it('splits km by country', () => {
    expect(kmByCountry(legs)).toEqual([{ country: 'ES', km: 150 }, { country: 'PT', km: 50 }]);
  });
  it('weights the price per litre by km, in the budget currency', () => {
    expect(estimatedFuelPrice(legs, 'EUR')).toBe(Math.round((150 * 1.55 + 50 * 1.74) / 200 * 100) / 100);
    expect(estimatedFuelPrice([leg('A, USA', 'B, USA', 100)], 'USD')).toBe(Math.round(0.82 * 1.08 * 100) / 100);
    expect(estimatedFuelPrice([leg('A', 'B', 100)], 'EUR')).toBeNull();
  });
  it('uses typical toll rates (0 where there are no per-km tolls)', () => {
    expect(estimatedTollRate([leg('Lisboa, Portugal', 'Porto, Portugal', 300)], 'EUR')).toBe(0.08);
    expect(estimatedTollRate([leg('Bern, Switzerland', 'Zürich, Switzerland', 100)], 'EUR')).toBe(0);
  });
});
