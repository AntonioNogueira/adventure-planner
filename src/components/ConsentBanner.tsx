import React, { useEffect, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { getConsent, setConsent } from '../lib/affiliate';
import { useSettings } from '../lib/settings';

// Opening the privacy summary from anywhere (e.g. Settings).
const openListeners = new Set<() => void>();
export function openPrivacy() { openListeners.forEach(l => l()); }

/** What the app stores and shares, and the choice about partner tracking on booking links. */
export const PrivacyDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useSettings();
  const choice = getConsent();
  const rows: [string, string][] = [
    [t('On this device'), t('Your settings (language, units, currency), this privacy choice, and the login session.')],
    [t('In your account'), t('Saved trips, budgets and booking files (Firebase, Google Cloud in the EU/US). Only you can see them unless you share a trip.')],
    [t('Map and route services'), t('Google Maps or OpenStreetMap services, BRouter and Valhalla (routes), Wikipedia (place photos), Open-Meteo (weather). They receive the places on your route.')],
    [t('AI planner'), t('What you type in the planner is sent to the AI service (Gemini, Claude or OpenAI) to understand the trip.')],
    [t('Booking links'), t('"Check prices", "Tickets & tours" and rentals open partner sites. If you accept, the links carry our partner id so the partner can pay us a commission; their own cookies then apply on their site.')],
  ];
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('Privacy and cookies')} onClick={e => e.stopPropagation()}
        className="max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-card p-5 text-sm shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold uppercase text-emerald-950">{t('Privacy and cookies')}</h2>
          <button onClick={onClose} aria-label={t('Close')} className="rounded-full p-1 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <dl className="space-y-2 text-xs">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="font-semibold text-slate-800">{k}</dt><dd className="text-slate-600">{v}</dd></div>
          ))}
        </dl>
        <p className="text-xs text-slate-600">
          {t('Your choice for booking links:')} <b>{choice === 'accepted' ? t('partner tracking accepted') : choice === 'essential' ? t('essential only') : t('not chosen yet')}</b>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setConsent('accepted'); onClose(); }} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">{t('Accept partner links')}</button>
          <button onClick={() => { setConsent('essential'); onClose(); }} className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">{t('Essential only')}</button>
        </div>
      </div>
    </div>
  );
};

/** First-visit notice; also hosts the privacy summary when opened from Settings. */
const ConsentBanner: React.FC = () => {
  const { t } = useSettings();
  const [show, setShow] = useState(() => getConsent() === null);
  const [details, setDetails] = useState(false);
  useEffect(() => {
    const l = () => setDetails(true);
    openListeners.add(l);
    return () => { openListeners.delete(l); };
  }, []);
  const choose = (value: 'accepted' | 'essential') => { setConsent(value); setShow(false); };
  return (
    <>
      {show && (
        <div role="region" aria-label={t('Privacy and cookies')}
          className="fixed bottom-3 left-3 right-3 z-[115] max-w-md rounded-lg border bg-card p-3 text-xs shadow-2xl md:left-auto md:right-4">
          <p className="mb-2 flex items-start gap-2 text-slate-700">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />
            {t('We only store what the app needs (your settings and login). Booking links can include a partner id so we earn a small commission, at no cost to you.')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => choose('accepted')} className="rounded-md bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700">{t('Accept')}</button>
            <button onClick={() => choose('essential')} className="rounded-md border px-3 py-1.5 font-semibold hover:bg-slate-50">{t('Essential only')}</button>
            <button onClick={() => setDetails(true)} className="font-semibold text-emerald-700 hover:underline">{t('Details')}</button>
          </div>
        </div>
      )}
      {details && <PrivacyDialog onClose={() => { setDetails(false); if (getConsent()) setShow(false); }} />}
    </>
  );
};

export default ConsentBanner;
