// A stop's story: the traveller's own text and photos, shown in the stop card and the map balloon, and edited in place.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ChevronLeft, ChevronRight, Loader2, PenLine, X } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { MAX_PHOTOS, isEmptyStory, keepPhoto, photoSrc, shrinkPhoto } from '../lib/photos';
import type { Story, StoryPhoto } from '../types';
import { cn } from '../lib/utils';

// Unsaved edits by stop: the map balloon is redrawn when new data arrives (places, a new route), which must not
// lose what the traveller is typing; the stop card and the balloon share the same draft.
const drafts = new Map<string, Story>();

interface StoryBlockProps {
  /** Identifies the stop, so an unsaved edit survives the balloon being redrawn. */
  draftKey?: string;
  story?: Story;
  /** Saving an edit; an empty story removes it. Without it the story is read-only. */
  onChange?: (story: Story | undefined) => void;
  /** The small map balloon: shorter text and smaller photos. */
  compact?: boolean;
}

/** Photos full size, one at a time (over everything, so it isn't trapped inside a map balloon). */
const Lightbox: React.FC<{ photos: StoryPhoto[]; start: number; onClose: () => void }> = ({ photos, start, onClose }) => {
  const { t } = useSettings();
  const [i, setI] = useState(start);
  const shown = photos.filter(p => photoSrc(p));
  const go = (step: number) => setI(k => (k + step + shown.length) % shown.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown.length]);
  const photo = shown[i];
  if (!photo) return null;
  return createPortal(
    <div role="dialog" aria-label={t('Photo')} onClick={onClose}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-2 bg-black/85 p-4">
      <img src={photoSrc(photo)} alt={photo.caption || ''} onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-md object-contain shadow-2xl" />
      {photo.caption && <p className="max-w-xl text-center text-sm text-white" onClick={(e) => e.stopPropagation()}>{photo.caption}</p>}
      {shown.length > 1 && (
        <div className="flex items-center gap-4 text-white" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => go(-1)} aria-label={t('Previous photo')} className="rounded-full bg-white/15 p-2 hover:bg-white/25"><ChevronLeft size={18} /></button>
          <span className="text-xs tabular-nums">{i + 1} / {shown.length}</span>
          <button onClick={() => go(1)} aria-label={t('Next photo')} className="rounded-full bg-white/15 p-2 hover:bg-white/25"><ChevronRight size={18} /></button>
        </div>
      )}
      <button onClick={onClose} aria-label={t('Close')} className="absolute right-3 top-3 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"><X size={18} /></button>
    </div>,
    document.body,
  );
};

const Editor: React.FC<{ story?: Story; draftKey?: string; onSave: (story: Story | undefined) => void; onCancel: () => void; compact?: boolean }> = ({ story, draftKey, onSave, onCancel, compact }) => {
  const { t } = useSettings();
  const draft = draftKey ? drafts.get(draftKey) : undefined;
  const [text, setText] = useState(draft?.text ?? story?.text ?? '');
  const [photos, setPhotos] = useState<StoryPhoto[]>(draft?.photos ?? story?.photos ?? []);
  useEffect(() => { if (draftKey) drafts.set(draftKey, { text, photos }); }, [draftKey, text, photos]);
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setAdding(true);
    setProblem('');
    const room = MAX_PHOTOS - photos.length;
    const picked = [...files].filter(f => f.type.startsWith('image/')).slice(0, room);
    const added: StoryPhoto[] = [];
    for (const file of picked) {
      try { added.push({ pendingId: keepPhoto(await shrinkPhoto(file)) }); } catch { setProblem(t("Couldn't read one of the photos.")); }
    }
    if (files.length > room) setProblem(t('Up to {n} photos per stop.', { n: MAX_PHOTOS }));
    setPhotos(list => [...list, ...added]);
    setAdding(false);
  };

  const save = () => {
    const next = { text: text.trim(), photos };
    onSave(isEmptyStory(next) ? undefined : next);
  };

  return (
    <div className="space-y-2 rounded-lg border border-emerald-200 bg-white p-2" onClick={(e) => e.stopPropagation()}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={compact ? 4 : 6}
        maxLength={5000}
        autoFocus
        aria-label={t('Your story for this stop')}
        placeholder={t('What is it like here? Tips, impressions, the people you met, the best coffee…')}
        className="w-full resize-y rounded-md border border-slate-200 px-2 py-1.5 text-xs leading-relaxed text-slate-800 focus:border-emerald-400 focus:outline-none"
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <div key={photo.url || photo.pendingId || i} className="space-y-0.5">
              <div className="relative">
                <img src={photoSrc(photo)} alt="" className="aspect-square w-full rounded-md object-cover" />
                <button onClick={() => setPhotos(list => list.filter((_, k) => k !== i))} aria-label={t('Remove photo')}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"><X size={12} /></button>
              </div>
              <input
                value={photo.caption || ''}
                onChange={(e) => setPhotos(list => list.map((p, k) => (k === i ? { ...p, caption: e.target.value.slice(0, 200) } : p)))}
                placeholder={t('Caption')}
                aria-label={t('Caption')}
                className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-[10px] focus:border-emerald-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
      {problem && <p className="text-[10px] text-amber-700">{problem}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
        <button onClick={() => fileInput.current?.click()} disabled={adding || photos.length >= MAX_PHOTOS}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}{t('Add photos')}
        </button>
        <span className="flex-1 text-[9px] text-slate-400">{t('Photos are uploaded when you save the trip.')}</span>
        <button onClick={onCancel} className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">{t('Cancel')}</button>
        <button onClick={save} disabled={adding} className="rounded-md bg-emerald-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{t('Save')}</button>
      </div>
    </div>
  );
};

const StoryBlock: React.FC<StoryBlockProps> = ({ story, onChange, compact, draftKey }) => {
  const { t } = useSettings();
  const [editing, setEditingState] = useState(() => Boolean(draftKey && drafts.has(draftKey)));
  const setEditing = (on: boolean) => {
    if (!on && draftKey) drafts.delete(draftKey);
    setEditingState(on);
  };
  const [expanded, setExpanded] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  if (editing && onChange) {
    return <Editor story={story} draftKey={draftKey} compact={compact} onCancel={() => setEditing(false)} onSave={(s) => { onChange(s); setEditing(false); }} />;
  }
  if (isEmptyStory(story)) {
    if (!onChange) return null;
    return (
      <button onClick={() => setEditing(true)}
        className={cn('flex w-full items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 px-2 text-left font-semibold text-emerald-800 hover:bg-emerald-50',
          compact ? 'py-1 text-[10.5px]' : 'py-1.5 text-[11px]')}>
        <PenLine size={12} />{t('Write about this stop (text and photos)')}
      </button>
    );
  }
  const photos = story!.photos.filter(p => photoSrc(p));
  const long = story!.text.length > (compact ? 160 : 420);
  return (
    <div className="space-y-1.5">
      {story!.text && (
        <div>
          <p className={cn('whitespace-pre-wrap text-slate-700', compact ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed',
            long && !expanded && (compact ? 'line-clamp-3' : 'line-clamp-6'))}>{story!.text}</p>
          {long && (
            <button onClick={() => setExpanded(e => !e)} className="text-[10.5px] font-semibold text-emerald-700 hover:underline">
              {expanded ? t('Show less') : t('Read more')}
            </button>
          )}
        </div>
      )}
      {photos.length > 0 && (
        <div className={cn('grid gap-1', compact ? 'grid-cols-4' : 'grid-cols-3')}>
          {photos.slice(0, compact ? 4 : MAX_PHOTOS).map((photo, i) => (
            <button key={photo.url || photo.pendingId || i} onClick={() => setViewing(i)} title={photo.caption || t('Photo')}
              className="relative overflow-hidden rounded-md">
              <img src={photoSrc(photo)} alt={photo.caption || ''} loading="lazy" className="aspect-square w-full object-cover transition-transform hover:scale-105" />
              {compact && i === 3 && photos.length > 4 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">+{photos.length - 4}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {onChange && (
        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 hover:underline">
          <PenLine size={11} />{t('Edit story')}
        </button>
      )}
      {viewing !== null && <Lightbox photos={photos} start={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default StoryBlock;
