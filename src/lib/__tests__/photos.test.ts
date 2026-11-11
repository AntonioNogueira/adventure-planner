import { describe, expect, it } from 'vitest';
import { fitWithin, isEmptyStory } from '../photos';

describe('story photos', () => {
  it('shrinks the long side to 1600 px, keeping the shape, and never enlarges', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('treats a story with no text and no photos that can be shown as empty', () => {
    expect(isEmptyStory(undefined)).toBe(true);
    expect(isEmptyStory({ text: '  ', photos: [] })).toBe(true);
    // A photo waiting in another browser session can't be shown any more.
    expect(isEmptyStory({ text: '', photos: [{ pendingId: 'photo-gone' }] })).toBe(true);
    expect(isEmptyStory({ text: '', photos: [{ url: 'https://example.com/a.jpg' }] })).toBe(false);
    expect(isEmptyStory({ text: 'Best coffee in town', photos: [] })).toBe(false);
  });
});
