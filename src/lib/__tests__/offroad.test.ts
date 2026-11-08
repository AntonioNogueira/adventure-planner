import { describe, expect, it } from 'vitest';
import { legPoints, ADVENTURE_MOTO_PROFILE } from '../offroad';

describe('legPoints', () => {
  it('makes one day per stop, keeping pass-through points inside the day', () => {
    const p = (n: number) => ({ lat: n, lng: n });
    const days = legPoints([
      { at: p(0), via: false }, { at: p(1), via: true }, { at: p(2), via: false }, { at: p(3), via: false },
    ]);
    expect(days).toEqual([[p(0), p(1), p(2)], [p(2), p(3)]]);
  });
});

describe('adventure motorcycle profile', () => {
  it('keeps off footpaths, closed ways and very rough tracks', () => {
    expect(ADVENTURE_MOTO_PROFILE).toContain('switch not motoraccess 10000');
    expect(ADVENTURE_MOTO_PROFILE).toContain('switch rough 10000');
    expect(ADVENTURE_MOTO_PROFILE).toMatch(/tracktype=grade4\|grade5/);
    expect(ADVENTURE_MOTO_PROFILE).not.toMatch(/highway=[^\n]*\b(path|footway|cycleway|bridleway)\b[^\n]*1\s*$/m);
  });
});
