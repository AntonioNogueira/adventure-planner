import { describe, expect, it } from 'vitest';
import { automaticChecks, buildJourneyChatPrompt } from '../../../server/submissions';
import { isJumpLeg, landPieces } from '../inspiration';

describe('journey submissions', () => {
  it('flags a missing declaration, too few stops and a link that does not open', () => {
    const checks = automaticChecks({ journey: { title: 'x', stops: [{ name: 'A' }, { name: 'B' }], legs: [{ by: 'ride', km: 100 }] }, acknowledged: false }, { 'https://example.com/post': false });
    const by = (name: string) => checks.find(c => c.check === name);
    expect(by('Stops')?.result).toBe('problem');
    expect(by('Declaration')?.result).toBe('problem');
    expect(by('Source link')?.result).toBe('warning');
  });

  it('accepts a normal journey', () => {
    const checks = automaticChecks({ journey: { title: 'My ride', stops: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], legs: [{ by: 'ride', km: 400 }, { by: 'ride', km: 500 }] }, acknowledged: true }, {});
    expect(checks.every(c => c.result === 'ok')).toBe(true);
  });

  it('asks the AI to keep to what the traveller said', () => {
    const p = buildJourneyChatPrompt([{ role: 'user', text: 'Lisbon to Fes by motorbike' }], null, 'pt', '');
    expect(p).toContain('Lisbon to Fes by motorbike');
    expect(p).toMatch(/never invent/i);
  });
});

describe('journey lines', () => {
  it('leaves out long sea and unknown legs, but keeps a journey that is only a crossing', () => {
    const legs = [
      { by: 'ride', km: 800, line: [[0, 0], [1, 1]] as [number, number][] },
      { by: 'boat', km: 6000, line: [[1, 1], [10, 40]] as [number, number][] },
      { by: 'ride', km: 900, line: [[10, 40], [11, 41]] as [number, number][] },
    ];
    expect(isJumpLeg(legs[1])).toBe(true);
    expect(landPieces(legs)).toHaveLength(2);
    expect(landPieces([legs[1]])).toHaveLength(1);
  });
});
