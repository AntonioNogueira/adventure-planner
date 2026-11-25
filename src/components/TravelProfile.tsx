// "Your travel profile" in Settings: what the planner has learned about how you travel, one line per travel style
// (gravel bike, adventure motorcycle, campervan with the family…), used as defaults for new trips. Each style can be
// corrected (daily distance, where you sleep, who you travel with, budget) or forgotten on its own.
import React, { useState, useSyncExternalStore } from 'react';
import { Pencil, X } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { editStyle, forgetNote, forgetProfile, forgetStyle, getProfile, hasProfile, onProfileChange, stylesByRecent, StyleHabits } from '../lib/profile';

const STYLE_LABELS: Record<string, string> = {
  bike: 'Bike', 'bike-road': 'Road bike', 'bike-gravel': 'Gravel bike', 'bike-mtb': 'Mountain bike', 'bike-emtb': 'e-MTB', 'bike-touring': 'Touring bike',
  'walk-day': 'Day hikes', 'walk-trek': 'Trekking',
  'moto-adventure': 'Adventure motorcycle', 'moto-enduro': 'Enduro motorcycle', 'moto-touring': 'Touring motorcycle', 'moto-road': 'Road motorcycle',
  car: 'Car', '4x4': '4x4 / overland', camper: 'Campervan', drive: 'Driving',
};
const LODGING_LABELS: Record<string, string> = { camping: 'camping', hostel: 'hostels', hotel: 'hotels' };
const PARTY_LABELS: Record<string, string> = { solo: 'on your own', couple: 'as a couple', family: 'with the family', group: 'with a group' };
const BUDGET_LABELS: Record<string, string> = { shoestring: 'on a shoestring', mid: 'mid-range', comfort: 'comfort' };

export function styleLabel(key: string, t: (s: string) => string) {
  const [base, tag] = key.split('+');
  return `${t(STYLE_LABELS[base] || base)}${tag === 'family' ? ` · ${t('with the family')}` : ''}`;
}

const Select: React.FC<{ value?: string; options: Record<string, string>; onChange: (v: string) => void; label: string }> = ({ value, options, onChange, label }) => {
  const { t } = useSettings();
  return (
    <select aria-label={label} value={value || ''} onChange={e => onChange(e.target.value)} className="h-6 rounded border border-emerald-200 bg-white px-1 text-[10.5px]">
      <option value="">{label}: {t('any')}</option>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
    </select>
  );
};

const StyleLine: React.FC<{ id: string; h: StyleHabits }> = ({ id, h }) => {
  const { t, dist, toDist, fromDist, distUnit } = useSettings();
  const [editing, setEditing] = useState(false);
  const family = id.endsWith('+family');
  const facts = [h.vehicleModel, h.dailyKm && t('{d} a day', { d: dist(h.dailyKm, 0) }), h.lodging && t(LODGING_LABELS[h.lodging] || h.lodging),
    !family && h.party && t(PARTY_LABELS[h.party] || h.party), h.budgetStyle && t(BUDGET_LABELS[h.budgetStyle] || h.budgetStyle)].filter(Boolean).join(' · ');
  // The daily distance is stored in km; shown and typed in the traveller's unit.
  const shownKm = h.dailyKm ? Math.round(toDist(h.dailyKm)) : '';
  return (
    <div className="text-slate-600">
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">{styleLabel(id, t)}</span>
          {' · '}{facts || t('learning…')}
          <span className="text-slate-400"> ({h.trips === 1 ? t('1 trip') : t('{n} trips', { n: h.trips })})</span>
        </p>
        <button onClick={() => setEditing(v => !v)} aria-pressed={editing} title={t('Correct these habits')} aria-label={t('Correct these habits')}
          className="rounded p-0.5 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"><Pencil size={11} /></button>
        <button onClick={() => { if (window.confirm(t('Forget your {style} habits?', { style: styleLabel(id, t) }))) forgetStyle(id); }}
          title={t('Forget this one')} aria-label={t('Forget this one')} className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={11} /></button>
      </div>
      {editing && (
        <div className="mt-1 flex flex-wrap items-center gap-1 rounded bg-white/70 p-1">
          <label className="flex items-center gap-1 text-[10.5px]">
            <input type="number" min={0} max={2000} inputMode="numeric" defaultValue={shownKm} aria-label={t('Distance a day')}
              onBlur={e => { const n = Number(e.target.value); editStyle(id, { dailyKm: n > 0 ? Math.round(fromDist(n)) : undefined }); }}
              className="h-6 w-14 rounded border border-emerald-200 bg-white px-1" />
            {t('{unit} a day', { unit: distUnit })}
          </label>
          <Select label={t('Sleep')} value={h.lodging} options={LODGING_LABELS} onChange={v => editStyle(id, { lodging: v || undefined })} />
          {!family && <Select label={t('With')} value={h.party} options={PARTY_LABELS} onChange={v => editStyle(id, { party: v || undefined })} />}
          <Select label={t('Budget')} value={h.budgetStyle} options={BUDGET_LABELS} onChange={v => editStyle(id, { budgetStyle: v || undefined })} />
          {h.mode === 'DRIVING' && (
            <input defaultValue={h.vehicleModel || ''} placeholder={t('Model, e.g. BMW R 1300 GS')} aria-label={t('Vehicle model')}
              onBlur={e => editStyle(id, { vehicleModel: e.target.value.trim().slice(0, 60) || undefined })}
              className="h-6 w-40 rounded border border-emerald-200 bg-white px-1 text-[10.5px]" />
          )}
        </div>
      )}
    </div>
  );
};

const TravelProfile: React.FC = () => {
  const { t } = useSettings();
  const profile = useSyncExternalStore(onProfileChange, getProfile, getProfile);
  if (!hasProfile(profile)) {
    return <p className="text-[10px] text-muted-foreground">{t('Your travel profile: the planner learns how you like to travel from your trips (one set of habits for each bike, vehicle or way of travelling) and uses it next time.')}</p>;
  }
  return (
    <div className="space-y-1 rounded-md bg-emerald-50/60 p-2 text-[11px]">
      <p className="font-semibold text-slate-700">{t('Your travel profile')}</p>
      {stylesByRecent(profile).map(([id, h]) => <StyleLine key={id} id={id} h={h} />)}
      {profile.notes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.notes.map(n => (
            <span key={n} className="inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10.5px] text-slate-600">
              “{n}”
              <button onClick={() => forgetNote(n)} aria-label={t('Forget this one')} className="text-slate-400 hover:text-red-600"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <button onClick={() => { if (window.confirm(t('Forget everything the planner has learned about how you travel?'))) forgetProfile(); }}
        className="font-semibold text-red-600 hover:underline">{t('Forget my profile')}</button>
    </div>
  );
};

export default TravelProfile;
