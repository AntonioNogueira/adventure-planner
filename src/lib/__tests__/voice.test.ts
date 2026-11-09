import { describe, expect, it, beforeEach } from 'vitest';
import { tidy, kindOf, turnsFromManeuvers, bendTurns, nextAnnouncement, spokenDistance, warnDistances } from '../voice';
import { updateSettings } from '../settings';

beforeEach(() => updateSettings({ language: 'en', units: 'metric' }));

// North for ~1.1 km, then east for ~0.9 km (a right turn at the corner).
const corner = [
  ...Array.from({ length: 11 }, (_, i) => ({ lat: 38 + i * 0.001, lng: -8 })),
  ...Array.from({ length: 10 }, (_, i) => ({ lat: 38.01, lng: -8 + (i + 1) * 0.001 })),
];

describe('turn instructions', () => {
  it('tidies joined sentences', () => {
    expect(tidy('Saia em direção A2 Sul. Depois Vire à esquerda para A2 Sul,  Alvito.')).toBe('Saia em direção A2 Sul. Depois vire à esquerda para A2 Sul, Alvito.');
  });
  it('maps Valhalla manoeuvre types', () => {
    expect(kindOf(1)).toBeNull();
    expect(kindOf(10)).toBe('right');
    expect(kindOf(15)).toBe('left');
    expect(kindOf(26)).toBe('roundabout');
    expect(kindOf(4)).toBe('arrive');
  });
  it('places manoeuvres along the day', () => {
    const shape = corner;
    const turns = turnsFromManeuvers([
      { type: 1, length: 1.11, begin_shape_index: 0, instruction: 'Drive north.' },
      { type: 10, length: 0.88, begin_shape_index: 10, instruction: 'Turn right onto N2.', verbal_transition_alert_instruction: 'Turn right onto N2.' },
      { type: 8, length: 0.2, begin_shape_index: 15, instruction: 'Continue on N2.' },
      { type: 4, length: 0, begin_shape_index: 20, instruction: 'You have arrived.' },
    ], shape, 50);
    expect(turns.map(x => x.kind)).toEqual(['right', 'straight', 'arrive']);
    expect(turns[0].km).toBeCloseTo(51.11, 2);
    expect(turns[0].at).toEqual(shape[10]);
    expect(turns[1].quiet).toBe(true);
  });
  it('finds bends in a path when there are no instructions', () => {
    const turns = bendTurns(corner, 'Faro');
    expect(turns.map(x => x.kind)).toEqual(['right', 'arrive']);
    expect(turns[0].km).toBeCloseTo(1.11, 1);
    expect(turns[0].text).toBe('Turn right');
    expect(turns[1].text).toBe('You have arrived at Faro');
    const left = bendTurns([...corner].reverse().map(p => ({ lat: p.lat, lng: p.lng })));
    expect(left[0].kind).toBe('left');
  });
});

describe('what to say', () => {
  const turns = bendTurns(corner, 'Faro');   // right turn at ~1.11 km, arrival at ~2 km
  it('warns early, then at the turn, once each', () => {
    const said = new Set<string>();
    const at = (km: number, kmh = 40) => {
      const a = nextAnnouncement(turns, km, kmh, said, 'metric', 'en-GB');
      if (a) said.add(a.key);
      return a?.text ?? null;
    };
    expect(at(0.2)).toBeNull();                                  // 900 m away: too early at 40 km/h
    expect(at(0.7)).toBe('In 400 metres, turn right');
    expect(at(0.75)).toBeNull();                                 // already said
    expect(at(1.05)).toBe('Turn right');
    expect(at(1.08)).toBeNull();
    expect(at(1.9)).toBe('You have arrived at Faro');
  });
  it('speaks distances in the user\'s units', () => {
    expect(spokenDistance(0.42, 'metric', 'en-GB')).toBe('400 metres');
    expect(spokenDistance(0.12, 'metric', 'en-GB')).toBe('100 metres');
    expect(spokenDistance(1.5, 'metric', 'en-GB')).toBe('1.5 kilometres');
    expect(spokenDistance(0.15, 'imperial', 'en-US')).toBe('500 feet');
    expect(spokenDistance(3.2, 'imperial', 'en-US')).toBe('2 miles');
    updateSettings({ language: 'pt-PT' });
    expect(spokenDistance(1.5, 'metric', 'pt-PT')).toBe('1,5 quilómetros');
  });
  it('warns earlier at higher speed', () => {
    expect(warnDistances(120).far).toBeGreaterThan(warnDistances(15).far);
  });
});
