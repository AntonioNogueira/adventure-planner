// Admin only: turn a blog post or a book passage into a journey on the Inspiration map.
// Paste a link or text → the AI reads the journey (server) → places found, roads routed, photos picked (browser)
// → check and edit it on the map → publish for everyone.
import React, { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { authFetch } from '../lib/account';
import { useSettings } from '../lib/settings';
import type { Journey } from '../lib/inspiration';
import { buildJourney, JourneyDraft } from '../lib/journeyBuild';
import { publishJourney } from '../lib/inspirationStore';

const COLORS = ['#0f766e', '#c2410c', '#1d4ed8', '#be185d', '#4338ca', '#15803d', '#a16207', '#7e22ce'];

interface Props {
  uid: string;
  /** The journey being checked, drawn on the map (null to clear). */
  preview: Journey | null;
  onPreview: (journey: Journey | null) => void;
  onPublished: (journey: Journey) => void;
  onClose: () => void;
}

const ImportJourney: React.FC<Props> = ({ uid, preview, onPreview, onPublished, onClose }) => {
  const { t } = useSettings();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const read = async () => {
    const text = input.trim();
    if (!text) return;
    setProblem('');
    setSkipped([]);
    setBusy(t('Reading the story…'));
    try {
      const isLink = /^https?:\/\/\S+$/i.test(text);
      const res = await authFetch('/api/import-journey', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLink ? { url: text } : { text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${res.status}`);
      const draft = data.journey as JourneyDraft;
      const { journey, skipped: lost } = await buildJourney(draft, step => setBusy(t('Building the map: {step}…', { step })), color);
      setSkipped(lost);
      onPreview(journey);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy('');
    }
  };

  const edit = (change: Partial<Journey>) => preview && onPreview({ ...preview, ...change });
  const editStop = (i: number, text: string) => preview && onPreview({ ...preview, stops: preview.stops.map((s, k) => (k === i ? { ...s, text } : s)) });

  const publish = async () => {
    if (!preview) return;
    setBusy(t('Publishing…'));
    setProblem('');
    try {
      await publishJourney(preview, uid);
      onPublished(preview);
    } catch (err) {
      setProblem(`${t("Couldn't publish")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy('');
    }
  };

  const field = 'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none';
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-emerald-800"><Upload size={15} />{t('Import a journey')}</h2>
        <button onClick={() => { onPreview(null); onClose(); }} aria-label={t('Close')} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={15} /></button>
      </div>
      <p className="text-[10.5px] text-slate-500">{t('Only you see this. The AI summarises the story in its own words, with at most a short quote per stop; check it before publishing.')}</p>

      {!preview && (
        <>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={7} aria-label={t('Link or text')}
            placeholder={t('Paste a link to a blog post or article, or paste a passage from a book…')} className={field} />
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] text-slate-500">{t('Colour')}</span>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} aria-label={c} className="h-4 w-4 rounded-full border-2" style={{ background: c, borderColor: c === color ? '#111' : 'transparent' }} />
            ))}
          </div>
          <button onClick={read} disabled={Boolean(busy) || !input.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
            {busy ? <><Loader2 size={13} className="animate-spin" />{busy}</> : t('Read it and draw it on the map')}
          </button>
        </>
      )}

      {problem && <p className="text-xs text-red-600">{problem}</p>}

      {preview && (
        <div className="space-y-2">
          {skipped.length > 0 && <p className="text-[10.5px] text-amber-700">{t('Not found on the map (left out): {places}', { places: skipped.join(', ') })}</p>}
          <input value={preview.title} onChange={(e) => edit({ title: e.target.value })} aria-label={t('Title')} className={`${field} font-bold`} />
          <div className="grid grid-cols-2 gap-1.5">
            <input value={preview.who} onChange={(e) => edit({ who: e.target.value })} aria-label={t('Who')} placeholder={t('Who')} className={field} />
            <input value={preview.when} onChange={(e) => edit({ when: e.target.value })} aria-label={t('When')} placeholder={t('When')} className={field} />
          </div>
          <input value={preview.vehicle} onChange={(e) => edit({ vehicle: e.target.value })} aria-label={t('Vehicle')} placeholder={t('Vehicle')} className={field} />
          <textarea value={preview.summary} onChange={(e) => edit({ summary: e.target.value })} rows={3} aria-label={t('Summary')} className={field} />
          <p className="text-[10.5px] text-slate-500">{preview.sources.map(s => s.label).join(' · ')}</p>
          <ol className="space-y-1.5">
            {preview.stops.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[9px] font-bold" style={{ borderColor: preview.color, color: preview.color }}>{i + 1}</span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800">{s.name} <span className="font-normal text-slate-400">· {s.place}{s.date ? ` · ${s.date}` : ''}</span></p>
                  <textarea value={s.text} onChange={(e) => editStop(i, e.target.value)} rows={2} aria-label={t('Text for {place}', { place: s.name })} className={field} />
                </div>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <button onClick={() => onPreview(null)} disabled={Boolean(busy)} className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{t('Discard')}</button>
            <button onClick={publish} disabled={Boolean(busy)} className="flex flex-[2] items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
              {busy ? <><Loader2 size={13} className="animate-spin" />{busy}</> : t('Publish to the Inspiration map')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportJourney;
