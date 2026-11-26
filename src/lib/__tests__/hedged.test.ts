import { describe, it, expect, vi } from 'vitest';
import { hedged } from '../../../server/plan-api';

const after = <T,>(ms: number, value: T, fail = false) => () => new Promise<T>((res, rej) => setTimeout(() => (fail ? rej(new Error(String(value))) : res(value)), ms));

describe('hedged', () => {
  it('uses the first answer when it comes quickly', async () => {
    const second = vi.fn(after(10, 'b'));
    expect(await hedged([after(10, 'a'), second], 100)).toBe('a');
    expect(second).not.toHaveBeenCalled();
  });
  it('starts the next attempt after the stagger and takes whichever answers first', async () => {
    expect(await hedged([after(500, 'slow'), after(20, 'fast')], 50)).toBe('fast');
  });
  it('starts the next attempt at once when one fails', async () => {
    const t0 = Date.now();
    expect(await hedged([after(10, 'x', true), after(10, 'ok')], 1000)).toBe('ok');
    expect(Date.now() - t0).toBeLessThan(500);
  });
  it('fails only when every attempt failed', async () => {
    await expect(hedged([after(5, 'e1', true), after(5, 'e2', true)], 20)).rejects.toThrow('e1');
  });
});
