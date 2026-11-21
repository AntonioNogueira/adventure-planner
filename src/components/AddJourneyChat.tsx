// "Add your journey": a chat at the bottom of the Inspiration map. The traveller shares a link to their blog, sends a
// document or describes the route; after each turn the AI's version is drawn on the globe (only theirs shows). When
// they're happy they tick the responsibility box and send it: it's saved for review, screened, and the admin decides.
import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Paperclip, Send, X } from 'lucide-react';
import { auth } from '../firebase';
import { authFetch } from '../lib/account';
import { useSettings } from '../lib/settings';
import type { Journey } from '../lib/inspiration';
import { buildJourney, JourneyDraft } from '../lib/journeyBuild';
import { ChatTurn, saveSubmission } from '../lib/inspirationStore';
import { cn } from '../lib/utils';

const COLORS = ['#0f766e', '#c2410c', '#1d4ed8', '#be185d', '#4338ca', '#15803d', '#a16207', '#7e22ce'];
const MAX_FILE = 10 * 1024 * 1024;

interface Props {
  preview: Journey | null;
  onPreview: (journey: Journey | null) => void;
  onClose: () => void;
  /** Opens the login dialog (sending needs an account). */
  onLogin: () => void;
}

const readBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

const AddJourneyChat: React.FC<Props> = ({ preview, onPreview, onClose, onLogin }) => {
  const { t, locale } = useSettings();
  const [messages, setMessages] = useState<ChatTurn[]>(() => [{ role: 'assistant', text: t('How would you like to add your journey? You can share a link to your blog, send me a document, or describe the route to me.') }]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);
  const [color] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const list = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if ((!text && !file) || busy) return;
    setProblem('');
    const isLink = /^https?:\/\/\S+$/i.test(text);
    const said = text || t('(sent {file})', { file: file?.name || '' });
    const history: ChatTurn[] = [...messages, { role: 'user', text: file && text ? `${text} (${t('sent {file}', { file: file.name })})` : said }];
    setMessages(history);
    setInput('');
    const sending = file;
    setFile(null);
    setBusy(isLink ? t('Reading your page…') : sending ? t('Reading your document…') : t('Thinking…'));
    try {
      if (sending && sending.size > MAX_FILE) throw new Error(t('That file is too big (10 MB at most).'));
      const payload: Record<string, unknown> = { messages: history.slice(1), draft, language: locale };
      if (isLink) payload.url = text;
      if (sending) payload.file = { fileName: sending.name, mimeType: sending.type || 'application/octet-stream', data: await readBase64(sending) };
      const res = await authFetch('/api/journey-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${res.status}`);
      if (isLink) setMaterials(m => [...m, text]);
      if (sending) setMaterials(m => [...m, `document: ${sending.name}`]);
      const next = data.journey as JourneyDraft;
      setDraft(next);
      setReady(Boolean(data.ready));
      let note = '';
      if (next?.stops?.length) {
        setBusy(t('Drawing it on the map…'));
        const { journey, skipped } = await buildJourney(next, step => setBusy(t('Building the map: {step}…', { step })), color);
        onPreview({ ...journey, id: 'my-journey' });
        if (skipped.length) note = ' ' + t('(Not found on the map: {places}.)', { places: skipped.join(', ') });
      }
      setMessages(m => [...m, { role: 'assistant', text: (data.reply || t('Here it is on the map.')) + note }]);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    if (!preview || !agreed) return;
    const user = auth.currentUser;
    if (!user) { onLogin(); setProblem(t('Log in (or create an account) to send your journey, then press Send again.')); return; }
    setProblem('');
    setBusy(t('Sending…'));
    try {
      const id = await saveSubmission({ ...preview, id: `sub-${Date.now()}` }, messages, materials, user.uid, user.email || undefined);
      // The first screening and the email to the admin run on the server; the journey is saved either way.
      await authFetch('/api/submit-journey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
      setSent(true);
      setMessages(m => [...m, { role: 'assistant', text: t('Thank you! Your journey was sent for review. We check every journey before it appears on the map; this usually takes a few days.') }]);
    } catch (err) {
      setProblem(`${t("Couldn't send it")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="absolute inset-x-2 bottom-2 z-20 mx-auto flex max-h-[62dvh] max-w-[640px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-[#fffcf4] shadow-2xl md:bottom-4 md:left-[392px] md:right-4">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{t('Add your journey')}</p>
        <button onClick={() => { onPreview(null); onClose(); }} aria-label={t('Close')} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={15} /></button>
      </div>
      <div ref={list} className="min-h-[90px] flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m, i) => (
          <div key={i} className={cn('max-w-[85%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 text-xs leading-relaxed',
            m.role === 'user' ? 'ml-auto bg-emerald-700 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200')}>{m.text}</div>
        ))}
        {busy && <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Loader2 size={12} className="animate-spin" />{busy}</p>}
        {problem && <p className="text-[11px] text-red-600">{problem}</p>}
      </div>
      {preview && !sent && (
        <div className="space-y-1.5 border-t border-slate-200 bg-emerald-50/60 px-3 py-2">
          <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-slate-700">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-emerald-700" />
            <span>{t('I confirm this is my own journey (or I have the right to share it), that the facts are true to the best of my knowledge, and that I am responsible for the text and material I send.')}</span>
          </label>
          <button onClick={submit} disabled={!agreed || Boolean(busy)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
            <Check size={13} />{ready ? t('Send for review') : t('Send for review as it is')}
          </button>
        </div>
      )}
      {!sent && (
        <div className="flex items-end gap-1.5 border-t border-slate-200 px-2 py-2">
          <input ref={fileInput} type="file" accept=".pdf,.txt,.md,.gpx,.kml,.html,image/*" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
          <button onClick={() => fileInput.current?.click()} aria-label={t('Attach a document')} title={t('Attach a document')} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Paperclip size={16} /></button>
          <div className="min-w-0 flex-1">
            {file && <p className="mb-1 flex items-center gap-1 text-[10.5px] text-slate-600"><Paperclip size={11} />{file.name}<button onClick={() => setFile(null)} aria-label={t('Remove')} className="text-slate-400 hover:text-slate-700"><X size={11} /></button></p>}
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} aria-label={t('Message')}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t('A link, or tell me where you went…')}
              className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none" />
          </div>
          <button onClick={send} disabled={Boolean(busy) || (!input.trim() && !file)} aria-label={t('Send')}
            className="rounded-md bg-emerald-700 p-2 text-white hover:bg-emerald-800 disabled:opacity-40"><Send size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default AddJourneyChat;
