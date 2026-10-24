import React, { useRef } from 'react';
import { Home, Utensils, Tent, Wrench, Camera, Coffee, ShoppingBag, Info, ArrowLeft, ArrowRight, X, Paperclip, Loader2, FileText, MapPin } from 'lucide-react';
import { InterestCategory, StopKind } from '../types';
import { cn } from '../lib/utils';
import { ACCEPTED_FILES, attachmentUrl } from '../lib/attachments';

export type { StopKind } from '../types';

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
  /** Editing: remove one item, or attach a reservation file to this stop. */
  onRemoveItem?: (categoryIndex: number, itemIndex: number) => void;
  onAttachFile?: (file: File) => void;
  attaching?: boolean;
}

const mapsLink = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const StopDetails: React.FC<StopDetailsProps> = ({
  kind, badge, title, location, interests, distanceFromPrev, distanceToNext, compact,
  onRemoveItem, onAttachFile, attaching,
}) => {
  const t = THEMES[kind];
  const fileInput = useRef<HTMLInputElement>(null);

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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {interests.map((cat, catIdx) => {
            // Reservations first, then suggestions (fewer in the compact map popup).
            const indexed = cat.items.map((item, itemIdx) => ({ item, itemIdx }));
            const reservations = indexed.filter(({ item }) => item.source === 'reservation');
            const suggestions = indexed.filter(({ item }) => item.source !== 'reservation').slice(0, compact ? 3 : 5);
            return (
              <div key={catIdx} className={cn('min-w-0 rounded-lg p-2', t.tile)}>
                <div className={cn('mb-1 flex items-center gap-1.5 border-b pb-1', t.tileBorder)}>
                  <InterestIcon category={cat.category} className={cn('shrink-0', t.icon)} />
                  <span className={cn('truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-wide', t.category)} title={cat.category}>
                    {cat.category}
                  </span>
                </div>
                <ul className="space-y-1">
                  {[...reservations, ...suggestions].map(({ item, itemIdx }) => {
                    const r = item.reservation;
                    const fileUrl = attachmentUrl(r?.fileId);
                    return (
                      <li
                        key={itemIdx}
                        className={cn('group relative text-xs leading-snug', r && 'rounded-md border border-violet-200 bg-violet-50/70 p-1.5')}
                      >
                        <div className="flex items-start gap-1 pr-4">
                          {r && <Paperclip size={11} className="mt-0.5 shrink-0 text-violet-600" />}
                          <a
                            href={r?.address ? mapsLink(r.address) : item.url || mapsLink(`${item.name} ${location}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={item.description || item.name}
                            className={cn('block min-w-0 truncate font-medium hover:underline', r ? 'text-violet-800' : t.link)}
                          >
                            {item.name}
                          </a>
                        </div>
                        {r ? (
                          <div className="mt-0.5 space-y-0.5 text-[11px] text-violet-900/80">
                            {(r.checkIn || r.checkOut) && <p>{[r.checkIn, r.checkOut].filter(Boolean).join(' → ')}</p>}
                            {r.confirmation && <p>Ref: <span className="font-semibold">{r.confirmation}</span></p>}
                            {!compact && r.notes && <p className="line-clamp-2">{r.notes}</p>}
                            <div className="flex flex-wrap gap-x-2">
                              {fileUrl ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-violet-700 hover:underline">
                                  <FileText size={10} />{r.fileName}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-0.5" title="Files are kept until the page is closed; booking details are saved with the trip">
                                  <FileText size={10} />{r.fileName}
                                </span>
                              )}
                              {r.address && (
                                <a href={mapsLink(r.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-violet-700 hover:underline">
                                  <MapPin size={10} />Map
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          !compact && item.description && (
                            <span className="line-clamp-2 text-[11px] text-muted-foreground">{item.description}</span>
                          )
                        )}
                        {onRemoveItem && (
                          <button
                            onClick={() => onRemoveItem(catIdx, itemIdx)}
                            aria-label={`Remove ${item.name}`}
                            title="Remove"
                            className="absolute right-0 top-0 rounded p-0.5 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-1 text-xs italic text-muted-foreground">No recommendations for this stop yet.</p>
      )}

      {onAttachFile && (
        <>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_FILES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachFile(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={attaching}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-violet-300 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-60"
          >
            {attaching ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
            {attaching ? 'Reading reservation…' : 'Add reservation (PDF, email, image)'}
          </button>
        </>
      )}
    </div>
  );
};

export default StopDetails;
