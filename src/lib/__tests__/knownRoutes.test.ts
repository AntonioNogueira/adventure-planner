import { describe, expect, it } from 'vitest';
import { applyKnownRoute, findKnownRoute } from '../../../server/knownRoutes';

describe('routes the Mappa Mundi knows', () => {
  it('finds the Ecopista do Dão with its real line', () => {
    const r = findKnownRoute('ecopista do dao by bicycle')!;
    expect(r.id).toBe('ecopista-do-dao');
    expect(r.places[0]).toMatch(/Viseu/);
    expect(r.places[r.places.length - 1]).toMatch(/Santa Comba/);
  });

  it('knows other names (EN2, Camino Francés)', () => {
    expect(findKnownRoute('the EN2 on my motorbike in 4 days')?.id).toBe('estrada-nacional-2');
    expect(findKnownRoute('walking the Camino Frances in May')?.id).toBe('camino-frances');
    expect(findKnownRoute('Porto to Lisbon by bike')).toBeNull();
  });

  it('puts the line back when the AI went elsewhere, keeps it when the AI used it', () => {
    const r = findKnownRoute('ecopista do dao')!;
    const wrong = { origin: 'Viseu, Portugal', destination: 'Aveiro, Portugal', route: [] };
    expect(applyKnownRoute(wrong, r)).toBe(true);
    expect(wrong.destination).toMatch(/Santa Comba/);
    const reversed = { origin: 'Santa Comba Dão, Portugal', destination: 'Viseu, Portugal', route: [] };
    expect(applyKnownRoute(reversed, r)).toBe(false);
  });
});

describe('known route spellings', () => {
  it('finds the Tour du Mont Blanc however it is written', async () => {
    const { findKnownRoute } = await import('../../../server/knownRoutes');
    for (const q of ['tour de mont blanc bikepacking', 'TMB on foot', 'Tour du Mont-Blanc'])
      expect(findKnownRoute(q)?.id).toBe('tour-du-mont-blanc');
  });
});
