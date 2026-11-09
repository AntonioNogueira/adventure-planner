import { describe, expect, it } from 'vitest';
import { pickHighlight, pickTownPage, townName } from '../wiki';

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

describe('the town\'s own article', () => {
  const at = { lat: 38.7223, lng: -9.1393 };   // Lisbon
  const lisbon = { title: 'Lisbon', extract: 'Lisbon is the capital of Portugal.', thumbnail: { source: 'l.jpg' }, coordinates: [{ lat: 38.7253, lon: -9.15 }] };
  it('uses the article named after the town when it is near the stop', () => {
    expect(pickTownPage([lisbon], at)?.title).toBe('Lisbon');
  });
  it('ignores a same-name article elsewhere, a disambiguation page or one without a picture', () => {
    const beja = { title: 'Beja', extract: 'Beja is a city in Tunisia.', thumbnail: { source: 'b.jpg' }, coordinates: [{ lat: 36.73, lon: 9.18 }] };
    expect(pickTownPage([beja], { lat: 38.0151, lng: -7.8632 })).toBeNull();
    expect(pickTownPage([{ ...lisbon, pageprops: { disambiguation: '' } }], at)).toBeNull();
    expect(pickTownPage([{ ...lisbon, thumbnail: undefined }], at)).toBeNull();
    expect(pickTownPage([{ title: 'Nowhere', missing: '' }], at)).toBeNull();
  });
  it('never falls back to a whole province or district', () => {
    const pages = [
      { title: 'Baixo Alentejo Province', index: 1, extract: 'A former province.', thumbnail: { source: 'p.jpg' } },
      { title: 'Lousal Mine', index: 2, extract: 'An old mine.', thumbnail: { source: 'm.jpg' } },
    ];
    expect(pickHighlight(pages, 'Grândola')?.title).toBe('Lousal Mine');
    expect(pickHighlight([pages[0]], 'Grândola')).toBeNull();
  });
});
