// Combining place suggestions with the traveller's own items: bookings and places they marked (pure, unit-tested).
import { InterestCategory, InterestItem } from '../types';
import { categoryId } from './places';

// Old and new names of a category are the same category ("Accommodations" and "Stay").
const sameCategory = (a: string, b: string) => categoryId(a) === categoryId(b);
/** The traveller's own: bookings and places marked on the map. They're never replaced by suggestions. */
export const isOwn = (i: InterestItem) => i.source === 'reservation' || i.source === 'mine';

/** Only the traveller's own items, dropping categories that are left empty. */
export function keepReservations(cats: InterestCategory[] = []): InterestCategory[] {
  return cats
    .map(c => ({ ...c, items: c.items.filter(isOwn) }))
    .filter(c => c.items.length > 0);
}

/** Fresh suggestions replace old ones, but bookings and marked places always stay (listed first). */
export function mergeSuggestions(cats: InterestCategory[], fresh: InterestCategory[]): InterestCategory[] {
  const merged = fresh.map(f => {
    const mine = cats.filter(c => sameCategory(c.category, f.category)).flatMap(c => c.items.filter(isOwn));
    return { category: f.category, items: [...mine, ...f.items] };
  });
  for (const kept of keepReservations(cats)) {
    if (!merged.some(m => sameCategory(m.category, kept.category))) merged.push(kept);
  }
  return merged;
}
