// Live posts and local news about a place, for the Overland safety layer: the hashtag people use, the words they use
// for trouble on the road in the local language, and links to search them (X, Bluesky, Mastodon, Reddit, Google News
// in the local language). The server also uses the words to keep only relevant Mastodon posts. Pure: no network.

export type Lang = 'en' | 'es' | 'pt' | 'fr' | 'ar' | 'ru' | 'tr' | 'fa';

/** Words people post when the road is affected: unrest, closures, strikes, roadblocks, disasters. */
export const TROUBLE_WORDS: Record<Lang, string[]> = {
  en: ['protest', 'general strike', 'on strike', 'roadblock', 'road block', 'blockade', 'border closed', 'border closure', 'curfew', 'clashes', 'flood', 'flooding',
    'landslide', 'kidnapping', 'kidnapped', 'unrest', 'evacuation', 'state of emergency', 'road closed', 'riot'],
  es: ['protesta', 'paro', 'bloqueo', 'huelga', 'frontera cerrada', 'toque de queda', 'enfrentamientos', 'ataque', 'inundación', 'deslizamiento', 'derrumbe', 'secuestro', 'estado de excepción'],
  pt: ['protesto', 'greve', 'bloqueio', 'fronteira fechada', 'recolher obrigatório', 'confrontos', 'ataque', 'enchente', 'deslizamento', 'sequestro', 'manifestação'],
  fr: ['manifestation', 'grève', 'barrage', 'frontière fermée', 'couvre-feu', 'affrontements', 'attaque', 'inondation', 'glissement de terrain', 'enlèvement', 'état d’urgence'],
  ar: ['احتجاج', 'إضراب', 'حظر تجول', 'اشتباكات', 'هجوم', 'فيضان', 'إغلاق الحدود', 'اختطاف'],
  ru: ['протест', 'забастовка', 'перекрыт', 'граница закрыта', 'комендантский час', 'столкновения', 'нападение', 'наводнение', 'оползень', 'сель'],
  tr: ['protesto', 'grev', 'sınır kapalı', 'sokağa çıkma yasağı', 'çatışma', 'saldırı', 'sel', 'heyelan'],
  fa: ['اعتراض', 'اعتصاب', 'درگیری', 'سیل', 'حمله'],
};

const BY_LANG: Record<Exclude<Lang, 'en'>, string[]> = {
  es: ['Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Bolivia',
    'Paraguay', 'Chile', 'Argentina', 'Uruguay', 'Spain', 'Cuba', 'Dominican Republic', 'Equatorial Guinea'],
  pt: ['Brazil', 'Portugal', 'Angola', 'Mozambique', 'Guinea-Bissau', 'Cape Verde', 'São Tomé and Príncipe', 'Timor-Leste'],
  fr: ['France', 'Morocco', 'Algeria', 'Tunisia', 'Mauritania', 'Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Chad', 'Guinea', 'Côte d\'Ivoire', 'Togo', 'Benin',
    'Cameroon', 'Gabon', 'Congo', 'DR Congo', 'Central African Republic', 'Madagascar', 'Haiti', 'Burundi', 'Djibouti', 'Comoros', 'Belgium', 'Switzerland'],
  ar: ['Western Sahara', 'Libya', 'Egypt', 'Sudan', 'Jordan', 'Iraq', 'Syria', 'Lebanon', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Kuwait', 'Qatar',
    'Bahrain', 'Palestine', 'Somalia'],
  ru: ['Russia', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Uzbekistan', 'Turkmenistan', 'Belarus', 'Mongolia'],
  tr: ['Turkey'],
  fa: ['Iran', 'Afghanistan'],
};
const LANG_OF = new Map<string, Lang>(Object.entries(BY_LANG).flatMap(([l, names]) => names.map(n => [n, l as Lang] as const)));

/** The main local language for posts and news in a country (English when not one of the above). */
export const langOf = (country: string): Lang => LANG_OF.get(country) || 'en';

/** The hashtag people use for a place: its name in one word, without accents or punctuation (#SouthSudan, #DRCongo). */
export function hashtag(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join('');
}

/** Whether a post's text is about trouble on the road (English or the country's language). */
export function isTrouble(text: string, country: string): boolean {
  const t = text.toLowerCase();
  const words = [...TROUBLE_WORDS.en, ...(langOf(country) === 'en' ? [] : TROUBLE_WORDS[langOf(country)])];
  // Whole words at the start (so "strikes" or "protesters" count, "Elang Strike" exercise or "flooded market" talk less so).
  return words.some(w => new RegExp(`(^|[^\\p{L}])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(t));
}

const GNEWS_HL: Record<Lang, string> = { en: 'en', es: 'es-419', pt: 'pt-BR', fr: 'fr', ar: 'ar', ru: 'ru', tr: 'tr', fa: 'en' };

export interface LiveLink { label: string; url: string }

/** Search links for live posts and local news about a country, or a place in it. */
export function liveLinks(country: string, place?: string): LiveLink[] {
  const lang = langOf(country);
  const local = lang === 'en' ? [] : TROUBLE_WORDS[lang].slice(0, 4);
  const words = [...local, ...TROUBLE_WORDS.en.slice(0, local.length ? 3 : 5)];
  const tag = `#${hashtag(place || country)}`;
  const or = (ws: string[]) => `(${ws.map(w => (w.includes(' ') ? `"${w}"` : w)).join(' OR ')})`;
  const where = place ? `${place} ${country}` : country;
  return [
    { label: `X ${tag}`, url: `https://x.com/search?q=${encodeURIComponent(`${tag} ${or(words)}`)}&f=live` },
    { label: `Bluesky ${tag}`, url: `https://bsky.app/search?q=${encodeURIComponent(tag)}` },
    { label: `Mastodon ${tag}`, url: `https://mastodon.social/tags/${encodeURIComponent(hashtag(place || country).toLowerCase())}` },
    { label: 'Reddit', url: `https://www.reddit.com/search/?q=${encodeURIComponent(`${where} ${or(TROUBLE_WORDS.en.slice(0, 5))}`)}&sort=new&t=week` },
    { label: lang === 'en' ? 'Google News' : `Google News (${lang})`, url: `https://news.google.com/search?q=${encodeURIComponent(`${where} ${or(words)} when:7d`)}&hl=${GNEWS_HL[lang]}` },
  ];
}
