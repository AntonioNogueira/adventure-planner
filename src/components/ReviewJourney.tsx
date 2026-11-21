// Admins: review journeys sent with "Add your journey". Opened from the link in the review email (?review=<id>) or
// from the queue in the Inspiration panel. Shows the journey (drawn on the map), what the traveller said, the first
// screening report, and the decision: publish to the Inspiration map, or reject.
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { authFetch } from '../lib/account';
import { useSettings } from '../lib/settings';
import type { Journey } from '../lib/inspiration';
import { publishJourney, setSubmissionStatus, Submission, SubmissionReport } from '../lib/inspirationStore';

interface Props {
  submission: Submission;
  uid: string;
  onBack: () => void;
  onPublished: (journey: Journey) => void;
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const COLOUR: Record<string, string> = { ok: 'text-emerald-700', warning: 'text-amber-700', problem: 'text-red-700' };

const ReviewJourney: React.FC<Props> = ({ submission: sub, uid, onBack, onPublished }) => {
  const { t, locale } = useSettings();
  const [report, setReport] = useState<SubmissionReport | null>(null);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const [status, setStatus] = useState(sub.status);

  const screen = async () => {
    setBusy(t('Screening…'));
    setProblem('');
    try {
      const res = await authFetch('/api/screen-journey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sub.id }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${res.status}`);
      setReport(data.report);
    } catch (err) { setProblem(err instanceof Error ? err.message : String(err)); } finally { setBusy(''); }
  };

  const decide = async (publish: boolean) => {
    setBusy(publish ? t('Publishing…') : t('Saving…'));
    setProblem('');
    try {
      if (publish) {
        const journey: Journey = { ...sub.journey, id: `user-${slug(sub.journey.title) || 'journey'}-${sub.id.slice(0, 5).toLowerCase()}`, imported: true };
        await publishJourney(journey, uid);
        await setSubmissionStatus(sub.id, 'published', uid);
        setStatus('published');
        onPublished(journey);
      } else {
        await setSubmissionStatus(sub.id, 'rejected', uid);
        setStatus('rejected');
      }
    } catch (err) { setProblem(err instanceof Error ? err.message : String(err)); } finally { setBusy(''); }
  };

  const j = sub.journey;
  return (
    <div className="space-y-2.5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-100"><ArrowLeft size={15} />{t('All journeys')}</button>
      <div className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
        {t('Sent for review by {who} on {date}. Only admins see this.', { who: sub.email || sub.createdBy, date: new Date(sub.createdAt).toLocaleDateString(locale) })}
        {' '}<b>{t(status === 'pending' ? 'Waiting for a decision' : status === 'published' ? 'Published' : 'Rejected')}</b>
      </div>
      <div className="border-l-4 pl-2" style={{ borderColor: j.color }}>
        <h2 className="text-base font-bold leading-tight text-slate-900">{j.title}</h2>
        <p className="text-[11px] text-slate-600">{j.who} · {j.when} · {j.vehicle}</p>
        <p className="text-[11px] text-slate-500">{t('{n} stops', { n: j.stops.length })} · {Math.round(j.km || 0).toLocaleString(locale)} km</p>
      </div>
      <p className="text-xs leading-relaxed text-slate-700">{j.summary}</p>
      {sub.materials.length > 0 && <p className="text-[11px] text-slate-500">{t('Material shared')}: {sub.materials.map((m, i) => <React.Fragment key={i}>{i > 0 && ' · '}{/^https?:/.test(m) ? <a href={m} target="_blank" rel="noopener noreferrer" className="underline">{m}</a> : m}</React.Fragment>)}</p>}

      <div className="rounded-md border border-slate-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-slate-600"><ShieldCheck size={13} />{t('First screening')}</p>
          <button onClick={screen} disabled={Boolean(busy)} className="text-[11px] font-semibold text-emerald-800 hover:underline disabled:opacity-50">{report ? t('Run again') : t('Run the screening')}</button>
        </div>
        {!report && <p className="mt-1 text-[11px] text-slate-500">{t('The report was emailed when the journey was sent; run it again here to see it.')}</p>}
        {report && (
          <div className="mt-1 space-y-1 text-[11px] text-slate-700">
            <p><b>{report.verdict}</b> · {t('AI-written')}: {report.aiWritten}</p>
            <p>{report.summary}</p>
            <ul className="space-y-0.5">{report.checks.map((c, i) => <li key={i}><b className={COLOUR[c.result] || ''}>{c.result}</b> {c.check}: {c.note}</li>)}</ul>
          </div>
        )}
      </div>

      <details className="rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
        <summary className="cursor-pointer font-bold uppercase text-slate-600">{t('The conversation')}</summary>
        <div className="mt-1 space-y-1">{sub.messages.map((m, i) => <p key={i}><b>{m.role === 'user' ? t('Traveller') : 'AI'}:</b> {m.text}</p>)}</div>
      </details>

      <ol className="space-y-1">
        {j.stops.map((s, i) => (
          <li key={i} className="text-[11px] text-slate-700"><b>{i + 1}. {s.name}</b>{s.date ? ` · ${s.date}` : ''} · {s.text}</li>
        ))}
      </ol>

      {problem && <p className="text-xs text-red-600">{problem}</p>}
      {status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => decide(false)} disabled={Boolean(busy)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={13} />{t('Reject')}</button>
          <button onClick={() => decide(true)} disabled={Boolean(busy)} className="flex flex-[2] items-center justify-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
            {busy ? <><Loader2 size={13} className="animate-spin" />{busy}</> : <><CheckCircle2 size={13} />{t('Publish to the Inspiration map')}</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewJourney;
