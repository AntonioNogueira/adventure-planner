// "Check map services": asks each service the planner depends on a small question, from this browser, and shows
// which answer, how fast, and which don't. For finding out where a slow or failed plan got stuck.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Copy, Loader2, RefreshCw, X, XCircle, AlertTriangle } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { SERVICES } from '../lib/services';
import { SERVICE_NAMES, SERVICE_ROLES, ServiceId, report } from '../lib/serviceHealth';
import { lastPlan } from '../lib/planTimer';

interface Result { id: string; service: ServiceId; label: string; status: 'checking' | 'ok' | 'slow' | 'down'; ms?: number; note?: string }

const SLOW_MS = 4000;

/** The questions: tiny, one per service (and per Overpass server). */
function probes(): { id: string; service: ServiceId; label: string; run: () => Promise<Response> }[] {
  const t = (ms: number) => AbortSignal.timeout(ms);
  return [
    { id: 'ai', service: 'ai', label: SERVICE_NAMES.ai, run: () => fetch('/api/health', { signal: t(60000) }) },
    { id: 'photon', service: 'photon', label: 'Photon', run: () => fetch(`${SERVICES.photon}/api/?q=Lisbon&limit=1`, { signal: t(8000) }) },
    { id: 'nominatim', service: 'nominatim', label: 'Nominatim', run: () => fetch(`${SERVICES.nominatim}/search?q=Lisbon&format=jsonv2&limit=1`, { signal: t(10000) }) },
    ...SERVICES.overpass.map((url, i) => ({
      id: `overpass-${i}`, service: 'overpass' as ServiceId, label: `Overpass (${new URL(url).host})`,
      run: () => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent('[out:json][timeout:8];node(around:500,38.7139,-9.1394)[amenity=cafe];out 1;')}`, signal: t(15000) }),
    })),
    { id: 'osrm', service: 'osrm', label: 'OSRM', run: () => fetch(`${SERVICES.osrm}/routed-bike/route/v1/driving/-9.14,38.71;-9.10,38.72?overview=false`, { signal: t(15000) }) },
    { id: 'valhalla', service: 'valhalla', label: 'Valhalla', run: () => fetch(`${SERVICES.valhalla}/height`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shape: [{ lat: 38.71, lon: -9.14 }, { lat: 38.72, lon: -9.1 }] }), signal: t(15000) }) },
    { id: 'brouter', service: 'brouter', label: 'BRouter', run: () => fetch(`${SERVICES.brouter}?lonlats=-9.14,38.71|-9.10,38.72&profile=trekking&alternativeidx=0&format=geojson`, { signal: t(20000) }) },
  ];
}

export function reportText(results: Result[]): string {
  const plan = lastPlan();
  return [`Map services check, ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    ...results.map(r => `${r.label}: ${r.status}${r.ms != null ? ` (${(r.ms / 1000).toFixed(1)} s)` : ''}${r.note ? ` - ${r.note}` : ''}`),
    ...(plan.stages.length ? ['', `Last plan: ${(plan.totalMs / 1000).toFixed(0)} s`, ...plan.stages.map(s => `  ${s.label}: ${(s.ms / 1000).toFixed(1)} s`)] : []),
  ].join('\n');
}

const ServiceCheck: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useSettings();
  const [results, setResults] = useState<Result[]>([]);
  const [copied, setCopied] = useState(false);

  const run = () => {
    const list = probes();
    setResults(list.map(p => ({ id: p.id, service: p.service, label: p.label, status: 'checking' })));
    list.forEach(async p => {
      const started = Date.now();
      let status: Result['status'] = 'down', note: string | undefined;
      try {
        const res = await p.run();
        const ms = Date.now() - started;
        if (p.id === 'ai') {
          const data = await res.json().catch(() => ({}));
          status = data.ok ? (ms > 20000 ? 'slow' : 'ok') : 'down';
          note = data.ok ? data.provider : data.busy ? t('busy (servers overloaded)') : data.error;
        } else if (res.ok) status = ms > SLOW_MS ? 'slow' : 'ok';
        else note = `HTTP ${res.status}`;
      } catch (err) {
        note = err instanceof DOMException && err.name === 'TimeoutError' ? t('no answer (timed out)') : t('unreachable');
      }
      const ms = Date.now() - started;
      if (p.service !== 'overpass') report(p.service, status !== 'down', ms, note);
      setResults(rs => rs.map(r => (r.id === p.id ? { ...r, status, ms, note } : r)));
    });
  };
  useEffect(run, []);

  const done = results.length > 0 && results.every(r => r.status !== 'checking');
  const down = results.filter(r => r.status === 'down');
  const overpassUp = results.some(r => r.service === 'overpass' && r.status !== 'down');
  const icon = (r: Result) => r.status === 'checking' ? <Loader2 size={15} className="animate-spin text-slate-400" />
    : r.status === 'ok' ? <CheckCircle2 size={15} className="text-emerald-600" />
    : r.status === 'slow' ? <AlertTriangle size={15} className="text-amber-500" /> : <XCircle size={15} className="text-red-600" />;

  // Over the whole page (not inside the menu, whose blur effect would trap it).
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-label={t('Map services')} onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800">{t('Map services')}</h2>
          <button onClick={onClose} aria-label={t('Close')} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <p className="mb-3 text-xs text-slate-600">{t('What the planner depends on, checked now from this device.')}</p>
        <ul className="divide-y text-xs">
          {results.map(r => (
            <li key={r.id} className="flex items-start gap-2 py-1.5">
              <span className="mt-0.5">{icon(r)}</span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800">{r.label}</span>
                <span className="text-slate-500"> · {t(SERVICE_ROLES[r.service])}</span>
                {r.note && <span className="block truncate text-[10.5px] text-slate-500">{r.note}</span>}
              </span>
              {r.ms != null && <span className="tabular-nums text-slate-500">{(r.ms / 1000).toFixed(1)} s</span>}
            </li>
          ))}
        </ul>
        {lastPlan().stages.length > 0 && (
          <div className="mt-3 rounded-md border border-slate-200 p-2 text-[11px]">
            <p className="mb-1 font-semibold text-slate-700">{t('Last plan: {s} s in total', { s: (lastPlan().totalMs / 1000).toFixed(0) })}</p>
            <ul className="space-y-0.5 text-slate-600">
              {lastPlan().stages.map((st, i) => (
                <li key={i} className="flex justify-between gap-2"><span>{t(st.label)}</span><span className={st.ms > 20000 ? 'font-semibold text-red-600' : st.ms > 8000 ? 'text-amber-600' : ''}>{(st.ms / 1000).toFixed(1)} s</span></li>
              ))}
            </ul>
          </div>
        )}
        {done && (
          <p className="mt-3 rounded-md bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-700">
            {down.length === 0 ? t('Everything is answering.')
              : [
                down.some(r => r.service === 'ai') && t('The AI is not answering: planning from a message will fail until it does (often a few minutes at busy times).'),
                down.some(r => r.service === 'photon') && t('Photon is down: place names come from Nominatim instead (slower).'),
                !overpassUp && t('No Overpass server answered: places near stops come from Photon or Nominatim (fewer details).'),
                down.some(r => ['osrm', 'valhalla', 'brouter'].includes(r.service)) && t('A routing service is down: some routes may fail or fall back to another router.'),
              ].filter(Boolean).join(' ')}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={run} disabled={!done} className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"><RefreshCw size={12} />{t('Check again')}</button>
          <button onClick={() => { navigator.clipboard?.writeText(reportText(results)).then(() => setCopied(true)).catch(() => {}); }} disabled={!done}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Copy size={12} />{copied ? t('Copied') : t('Copy report')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ServiceCheck;
