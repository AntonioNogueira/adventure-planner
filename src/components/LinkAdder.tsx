import React, { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { useSettings } from '../lib/settings';

/** "Add a link": paste a Booking/Airbnb share, a Google Maps place or a post; it's read and added to the trip. */
const LinkAdder: React.FC<{ onAdd: (url: string) => void; busy?: boolean; compact?: boolean; short?: boolean }> = ({ onAdd, busy, compact, short }) => {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const valid = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const submit = () => { if (!valid) return; onAdd(url.trim()); setUrl(''); setOpen(false); };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={busy}
        className={compact
          ? 'inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline disabled:opacity-50'
          : 'flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-emerald-300 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'}>
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
        {busy ? t('Reading…') : short ? t('Add a link') : t('Add a link (Booking, Google Maps, a post…)')}
      </button>
    );
  }
  return (
    <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input autoFocus type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        placeholder={t('Paste a link…')} aria-label={t('Paste a link…')}
        className="h-8 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-2 text-xs focus:border-emerald-500 focus:outline-none" />
      <button type="submit" disabled={!valid} className="h-8 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-40">{t('Add')}</button>
      <button type="button" onClick={() => setOpen(false)} aria-label={t('Close')} className="h-8 px-1 text-xs text-muted-foreground">✕</button>
    </form>
  );
};

export default LinkAdder;
