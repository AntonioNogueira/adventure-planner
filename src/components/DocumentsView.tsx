import React, { useMemo, useRef } from 'react';
import { FileText, Mail, Image as ImageIcon, Paperclip, Loader2, ExternalLink, X, FolderOpen, Link2 } from 'lucide-react';
import { RouteInfo, StopRef, InterestItem } from '../types';
import { ACCEPTED_FILES, attachmentUrl } from '../lib/attachments';
import { useSettings } from '../lib/settings';
import LinkAdder from './LinkAdder';
import { cn } from '../lib/utils';

interface DocumentsViewProps {
  routeInfo: RouteInfo | null;
  onAttachFile: (ref: StopRef | null, file: File | string) => void;
  onRemoveItem: (ref: StopRef, categoryIndex: number, itemIndex: number) => void;
  attachingKey: string | null;
}

interface Doc {
  ref: StopRef;
  stopLabel: string;
  categoryIndex: number;
  itemIndex: number;
  item: InterestItem;
  url?: string;
}

const iconFor = (type: string, name: string) =>
  type === 'text/uri-list' ? Link2 : /image/.test(type) ? ImageIcon : /rfc822|message|\.eml$/i.test(type + name) ? Mail : FileText;

/** All attached files of the trip in one place, grouped by stop in route order. */
const DocumentsView: React.FC<DocumentsViewProps> = ({ routeInfo, onAttachFile, onRemoveItem, attachingKey }) => {
  const { t, date: formatDate } = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const docs = useMemo(() => {
    if (!routeInfo) return [];
    const stops: { ref: StopRef; label: string; interests: RouteInfo['originInterests'] }[] = [
      { ref: { kind: 'start' }, label: routeInfo.origin, interests: routeInfo.originInterests },
      ...routeInfo.waypoints.map((wp, i) => ({ ref: { kind: 'stop' as const, index: i }, label: wp.location, interests: wp.interests })),
      { ref: { kind: 'end' }, label: routeInfo.destination, interests: routeInfo.destinationInterests },
    ];
    const out: Doc[] = [];
    stops.forEach(s => (s.interests || []).forEach((cat, categoryIndex) => cat.items.forEach((item, itemIndex) => {
      if (item.source !== 'reservation' || !item.reservation) return;
      out.push({ ref: s.ref, stopLabel: s.label, categoryIndex, itemIndex, item, url: attachmentUrl(item.reservation.fileId) || item.reservation.fileUrl || item.reservation.url });
    })));
    return out;
  }, [routeInfo]);

  const busy = attachingKey !== null;
  const addButton = (
    <>
      <input ref={input} type="file" accept={ACCEPTED_FILES} className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onAttachFile(null, file);
        e.target.value = '';
      }} />
      <button onClick={() => input.current?.click()} disabled={busy || !routeInfo}
        className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
        {busy ? t('Reading…') : t('Add document')}
      </button>
      {routeInfo && <div className="w-full sm:w-72"><LinkAdder busy={busy} onAdd={(url) => onAttachFile(null, url)} /></div>}
    </>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">{t('Documents')}</p>
          <p className="text-sm text-muted-foreground">
            {docs.length ? (docs.length === 1 ? t('1 file attached to this trip') : t('{n} files attached to this trip', { n: docs.length })) : t('Bookings, tickets and confirmations for this trip')}
          </p>
        </div>
        {addButton}
      </div>

      {!routeInfo && (
        <p className="pt-16 text-center text-sm text-muted-foreground">{t('Plan a route first, then add your bookings here.')}</p>
      )}

      {routeInfo && !docs.length && (
        <div className="rounded-xl border-2 border-dashed border-violet-200 bg-white p-10 text-center text-sm text-muted-foreground">
          <FolderOpen className="mx-auto mb-2 text-violet-500" size={32} />
          {t("No documents yet. Add a booking PDF, confirmation email or screenshot: it's read automatically and placed on the matching stop.")}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map(d => {
          const r = d.item.reservation!;
          const Icon = iconFor(r.fileType || '', r.fileName || '');
          const isImage = /image/.test(r.fileType || '') && d.url;
          return (
            <div key={`${d.stopLabel}-${d.categoryIndex}-${d.itemIndex}`} className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
              {isImage ? (
                <img src={d.url} alt={r.fileName} className="h-28 w-full object-cover" />
              ) : (
                <a href={r.url || d.url || undefined} target="_blank" rel="noopener noreferrer"
                  className={cn('flex h-16 items-center gap-2 bg-violet-50 px-3 text-violet-700', (r.url || d.url) && 'hover:bg-violet-100')}>
                  <Icon size={22} />
                  <span className="truncate text-xs font-medium" title={r.url || r.fileName}>{r.fileName}{r.url ? ' ↗' : ''}</span>
                </a>
              )}
              <div className="flex flex-1 flex-col gap-1 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{d.item.name}</p>
                  <button
                    onClick={() => { if (window.confirm(t('Remove {name} from the trip?', { name: d.item.name }))) onRemoveItem(d.ref, d.categoryIndex, d.itemIndex); }}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={t('Remove {name}', { name: d.item.name })}
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className="text-muted-foreground">{d.stopLabel.split(',')[0]}</p>
                {(r.checkInDate || r.checkIn) && (
                  <p>{r.checkInDate ? formatDate(r.checkInDate) : r.checkIn}{(r.checkOutDate || r.checkOut) && <> → {r.checkOutDate ? formatDate(r.checkOutDate) : r.checkOut}</>}</p>
                )}
                {r.confirmation && <p>{t('Confirmation')} <b>{r.confirmation}</b></p>}
                {r.price ? <p>{r.price} {r.currency}</p> : null}
                <div className="mt-auto pt-1">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline">
                      <ExternalLink size={12} /> {t('Open file')}
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{t('File kept on the device it was added from; save the trip to keep it online.')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsView;
