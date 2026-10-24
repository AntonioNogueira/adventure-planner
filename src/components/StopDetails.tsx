import React from 'react';
import { Home, Utensils, Tent, Wrench, Camera, Coffee, ShoppingBag, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { InterestCategory } from '../types';
import { cn } from '../lib/utils';

export type StopKind = 'start' | 'stop' | 'end';

// Full class names (no string interpolation) so Tailwind can detect and generate them.
const THEMES: Record<StopKind, {
  card: string; badge: string; title: string; tile: string; tileBorder: string;
  icon: string; category: string; link: string; meta: string;
}> = {
  start: {
    card: 'border-blue-100 bg-blue-50/30',
    badge: 'bg-blue-600',
    title: 'text-blue-950',
    tile: 'bg-white/70',
    tileBorder: 'border-blue-100',
    icon: 'text-blue-600',
    category: 'text-blue-800',
    link: 'text-blue-700',
    meta: 'text-blue-700',
  },
  stop: {
    card: 'border-emerald-100 bg-emerald-50/30',
    badge: 'bg-emerald-600',
    title: 'text-emerald-950',
    tile: 'bg-white/70',
    tileBorder: 'border-emerald-100',
    icon: 'text-emerald-600',
    category: 'text-emerald-800',
    link: 'text-emerald-700',
    meta: 'text-emerald-700',
  },
  end: {
    card: 'border-red-100 bg-red-50/30',
    badge: 'bg-red-600',
    title: 'text-red-950',
    tile: 'bg-white/70',
    tileBorder: 'border-red-100',
    icon: 'text-red-600',
    category: 'text-red-800',
    link: 'text-red-700',
    meta: 'text-red-700',
  },
};

export const InterestIcon = ({ category, className }: { category: string, className?: string }) => {
  const cat = category.toLowerCase();
  if (cat.includes('accommodation') || cat.includes('stay') || cat.includes('hotel') || cat.includes('hostel')) return <Home size={13} className={className} />;
  if (cat.includes('restaurant') || cat.includes('food') || cat.includes('eat') || cat.includes('cafe')) return <Utensils size={13} className={className} />;
  if (cat.includes('camp')) return <Tent size={13} className={className} />;
  if (cat.includes('bike') || cat.includes('moto') || cat.includes('repair')) return <Wrench size={13} className={className} />;
  if (cat.includes('scenic') || cat.includes('view') || cat.includes('photo') || cat.includes('point')) return <Camera size={13} className={className} />;
  if (cat.includes('coffee') || cat.includes('drink')) return <Coffee size={13} className={className} />;
  if (cat.includes('shop') || cat.includes('store') || cat.includes('market')) return <ShoppingBag size={13} className={className} />;
  return <Info size={13} className={className} />;
};

interface StopDetailsProps {
  kind: StopKind;
  badge: string;
  title: string;
  location: string;
  interests: InterestCategory[];
  distanceFromPrev?: string;
  distanceToNext?: string;
  compact?: boolean;
}

const StopDetails: React.FC<StopDetailsProps> = ({
  kind, badge, title, location, interests, distanceFromPrev, distanceToNext, compact,
}) => {
  const t = THEMES[kind];
  return (
    <div className={cn('rounded-xl border p-3 font-sans', t.card, compact && 'border-0 bg-transparent p-1')}>
      <div className={cn('mb-2 flex items-center gap-2 font-semibold', t.title)}>
        <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white', t.badge)}>
          {badge}
        </div>
        <span className="truncate text-sm" title={location}>{title}: {location}</span>
      </div>

      {(distanceFromPrev || distanceToNext) && (
        <div className={cn('mb-2 flex items-center gap-4 text-xs font-medium', t.meta)}>
          {distanceFromPrev && (
            <span className="flex items-center gap-1"><ArrowLeft size={12} />{distanceFromPrev}</span>
          )}
          {distanceToNext && (
            <span className="flex items-center gap-1">{distanceToNext}<ArrowRight size={12} /></span>
          )}
        </div>
      )}

      {interests.length > 0 ? (
        <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
          {interests.slice(0, 4).map((cat, idx) => (
            <div key={idx} className={cn('min-w-0 rounded-lg p-2', t.tile)}>
              <div className={cn('mb-1 flex items-center gap-1.5 border-b pb-1', t.tileBorder)}>
                <InterestIcon category={cat.category} className={cn('shrink-0', t.icon)} />
                <span className={cn('text-[11px] font-bold uppercase tracking-wide', compact ? 'min-w-0 leading-tight [overflow-wrap:anywhere]' : 'truncate', t.category)}>
                  {cat.category}
                </span>
              </div>
              <ul className="space-y-1">
                {cat.items.slice(0, compact ? 3 : 5).map((item, i) => (
                  <li key={i} className="text-xs leading-snug">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${location}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.description || item.name}
                      className={cn('block truncate font-medium hover:underline', t.link)}
                    >
                      {item.name}
                    </a>
                    {!compact && item.description && (
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">{item.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-1 text-xs italic text-muted-foreground">No recommendations for this stop yet.</p>
      )}
    </div>
  );
};

export default StopDetails;
