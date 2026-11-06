import { describe, expect, it } from 'vitest';
import { pickHighlight, townName } from '../wiki';

describe('townName', () => {
  it('keeps only the town', () => {
    expect(townName('Tavira, Portugal')).toBe('Tavira');
    expect(townName('Near Alcoutim, Portugal')).toBe('Alcoutim');
  });
});

describe('pickHighlight', () => {
  const pages = [
    { title: 'Roman Bridge (Tavira)', index: 1, extract: 'A bridge.', thumbnail: { source: 'bridge.jpg' } },
    { title: 'Tavira', index: 3, extract: 'Tavira is a town in the Algarve.', thumbnail: { source: 'tavira.jpg' }, fullurl: 'https://en.wikipedia.org/wiki/Tavira' },
    { title: 'Some street', index: 0, extract: 'A street.' },
  ];
  it("prefers the town's own article", () => {
    expect(pickHighlight(pages, 'Tavira')).toEqual({
      title: 'Tavira', extract: 'Tavira is a town in the Algarve.', image: 'tavira.jpg', url: 'https://en.wikipedia.org/wiki/Tavira',
    });
  });
  it('falls back to the nearest article with a picture', () => {
    expect(pickHighlight(pages, 'Cabanas')?.title).toBe('Roman Bridge (Tavira)');
  });
  it('returns null without pictures', () => {
    expect(pickHighlight([{ title: 'X', extract: 'x' }], 'X')).toBeNull();
  });
});
