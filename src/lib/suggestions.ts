// Combining Places suggestions with the user's own bookings (pure, unit-tested).
import { InterestCategory } from '../types';

const sameCategory = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Only the bookings, dropping categories that are left empty. */
export function keepReservations(cats: InterestCategory[] = []): InterestCategory[] {
  return cats
    .map(c => ({ ...c, items: c.items.filter(i => i.source === 'reservation') }))
    .filter(c => c.items.length > 0);
}

/** Fresh suggestions replace old ones, but the user's bookings always stay (listed first). */
export function mergeSuggestions(cats: InterestCategory[], fresh: InterestCategory[]): InterestCategory[] {
  const merged = fresh.map(f => {
    const mine = cats.find(c => sameCategory(c.category, f.category));
    return { category: f.category, items: [...(mine?.items.filter(i => i.source === 'reservation') || []), ...f.items] };
  });
  for (const kept of keepReservations(cats)) {
    if (!merged.some(m => sameCategory(m.category, kept.category))) merged.push(kept);
  }
  return merged;
}
