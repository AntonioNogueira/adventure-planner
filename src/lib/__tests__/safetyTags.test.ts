import { describe, expect, it } from 'vitest';
import { hashtag, isTrouble, langOf, liveLinks } from '../safetyTags';

describe('safety hashtags and live links', () => {
  it('makes one-word hashtags without accents or punctuation', () => {
    expect(hashtag('South Sudan')).toBe('SouthSudan');
    expect(hashtag('DR Congo')).toBe('DRCongo');
    expect(hashtag('Côte d\'Ivoire')).toBe('CoteDIvoire');
    expect(hashtag('Myanmar (Burma)')).toBe('Myanmar');
  });

  it('knows the local language', () => {
    expect(langOf('Ecuador')).toBe('es');
    expect(langOf('Mozambique')).toBe('pt');
    expect(langOf('Mali')).toBe('fr');
    expect(langOf('Kenya')).toBe('en');
  });

  it('keeps posts about trouble on the road, in English and the local language', () => {
    expect(isTrouble('Paro nacional: bloqueo en la vía a Cuenca', 'Ecuador')).toBe(true);
    expect(isTrouble('Protesters block the highway to Nakuru', 'Kenya')).toBe(true);
    expect(isTrouble('Joint exercise Elang Strike-III concludes', 'Pakistan')).toBe(false);
    expect(isTrouble('Beautiful sunset over the dunes', 'Mauritania')).toBe(false);
  });

  it('links to X, Bluesky, Mastodon, Reddit and local-language news', () => {
    const links = liveLinks('Ecuador');
    expect(links.map(l => l.label.split(' ')[0])).toEqual(['X', 'Bluesky', 'Mastodon', 'Reddit', 'Google']);
    expect(links[0].url).toContain(encodeURIComponent('#Ecuador'));
    expect(decodeURIComponent(links[0].url)).toContain('paro');
    expect(links[4].url).toContain('hl=es-419');
    expect(decodeURIComponent(liveLinks('Kenya', 'Nakuru')[3].url)).toContain('Nakuru Kenya');
  });
});
