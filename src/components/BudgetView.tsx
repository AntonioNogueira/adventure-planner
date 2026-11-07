import React, { useMemo } from 'react';
import { Wallet, Download, Plus, X, BedDouble } from 'lucide-react';
import { RouteInfo } from '../types';
import { ScheduleDay } from '../lib/schedule';
import { BudgetSettings, BudgetStop, computeBudget, budgetCsv } from '../lib/budget';
import { cn } from '../lib/utils';
import { useSettings } from '../lib/settings';

interface BudgetViewProps {
  routeInfo: RouteInfo | null;
  schedule: ScheduleDay[];
  settings: BudgetSettings;
  onChange: (settings: BudgetSettings) => void;
}

import { CURRENCIES } from '../lib/settings';

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number; hint?: string }> = ({ label, value, onChange, suffix, step = 1, hint }) => (
  <label className="flex flex-col gap-1 text-xs" title={hint}>
    <span className="font-semibold text-slate-600">{label}</span>
    <span className="flex items-center rounded-md border border-emerald-100 bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
      <input
        type="number" min={0} step={step} value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-9 w-full min-w-0 rounded-md bg-transparent px-2 text-sm outline-none"
      />
      {suffix && <span className="shrink-0 pr-2 text-[11px] text-slate-400">{suffix}</span>}
    </span>
  </label>
);

const BudgetView: React.FC<BudgetViewProps> = ({ routeInfo, schedule, settings, onChange }) => {
  const { t, settings: app, distUnit, toDist, money: fmtMoney, date } = useSettings();
  const imperial = app.units === 'imperial';
  // US units for fuel: mpg and price per gallon (stored as L/100 km and per litre).
  const L_PER_GAL = 3.78541, MPG_FACTOR = 235.215;
  const stops: BudgetStop[] = useMemo(() => routeInfo ? [
    { key: 'start', label: routeInfo.origin, interests: routeInfo.originInterests || [] },
    ...routeInfo.waypoints.map((wp, i) => ({ key: `stop-${i}`, label: wp.location, interests: wp.interests || [] })),
    { key: 'end', label: routeInfo.destination, interests: routeInfo.destinationInterests || [] },
  ] : [], [routeInfo]);
  const budget = useMemo(
    () => computeBudget(settings, schedule, routeInfo?.legs || [], stops),
    [settings, schedule, routeInfo, stops],
  );

  if (!routeInfo?.legs?.length) {
    return (
      <div className="mx-auto max-w-md pt-24 text-center text-sm text-muted-foreground">
        <Wallet className="mx-auto mb-3 text-emerald-600" size={32} />
        {t('Plan a route first: the budget is built from its days, nights and distances.')}
      </div>
    );
  }

  const cur = settings.currency;
  const money = (n: number) => fmtMoney(n, cur);
  const set = (patch: Partial<BudgetSettings>) => onChange({ ...settings, ...patch });
  const motor = routeInfo.travelMode === 'DRIVING';
  const foreign = Object.entries(budget.otherCurrencies);
  const days = budget.rows.filter(r => r.kind !== 'before').length;

  const rowLabel = (r: { kind: string; label: string; nightAt?: string }) =>
    r.kind === 'before' ? t('Night before departure in {place}', { place: r.nightAt || '' })
      : r.kind === 'rest' ? t('Rest day in {place}', { place: r.label.replace(/^Rest day in /, '') }) : r.label;

  const downloadCsv = () => {
    const blob = new Blob([budgetCsv(budget, cur)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(routeInfo.name || 'trip').replace(/[^\w-]+/g, '_')}_budget.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Summary */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t('Estimated total')}</p>
          <p className="text-3xl font-bold text-emerald-950">{money(budget.totals.all)}</p>
          <p className="text-xs text-muted-foreground">
            {[days === 1 ? t('1 day') : t('{n} days', { n: days }), budget.nights === 1 ? t('1 night') : t('{n} nights', { n: budget.nights }), t('about {amount} a day', { amount: money(budget.perDay) })].join(' · ')}
            {foreign.length > 0 && <> · {t('plus booked {amounts}', { amounts: foreign.map(([c, v]) => `${v} ${c}`).join(' + ') })}</>}
          </p>
        </div>
        <button onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
          <Download size={13} /> {t('Download table (CSV)')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {([
          ['Stay', budget.totals.stay], ['Food', budget.totals.food], ['Fuel', budget.totals.fuel],
          ['Tolls', budget.totals.tolls], ['Other', budget.totals.other], ['Bookings', budget.totals.bookings], ['Extras', budget.totals.extras],
        ] as const).filter(([l, v]) => v > 0 || l === 'Stay' || l === 'Food').map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-white px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-slate-500">{t(label)}</p>
            <p className="text-sm font-bold text-slate-900">{money(value)}</p>
          </div>
        ))}
      </div>

      {/* Averages */}
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-emerald-900">{t('Your averages')}</h3>
          <label className="flex items-center gap-1.5 text-xs">
            {t('Currency')}
            <select value={cur} onChange={(e) => set({ currency: e.target.value })} className="h-8 rounded-md border border-emerald-100 bg-white px-2 text-xs">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <NumberField label={t('Stay / night')} value={settings.stayPerNight} onChange={v => set({ stayPerNight: v })} suffix={cur} hint={t('Used for nights without a booking')} />
          <NumberField label={t('Food / day')} value={settings.foodPerDay} onChange={v => set({ foodPerDay: v })} suffix={cur} />
          {motor && (imperial
            ? <NumberField label={t('Consumption')} value={settings.fuelPer100km ? Math.round(MPG_FACTOR / settings.fuelPer100km * 10) / 10 : 0} onChange={v => set({ fuelPer100km: v ? MPG_FACTOR / v : 0 })} suffix="mpg" step={0.5} />
            : <NumberField label={t('Consumption')} value={settings.fuelPer100km} onChange={v => set({ fuelPer100km: v })} suffix="L/100km" step={0.1} />)}
          {motor && (imperial
            ? <NumberField label={t('Fuel price')} value={Math.round(settings.fuelPrice * L_PER_GAL * 100) / 100} onChange={v => set({ fuelPrice: v / L_PER_GAL })} suffix={`${cur}/gal`} step={0.01} />
            : <NumberField label={t('Fuel price')} value={settings.fuelPrice} onChange={v => set({ fuelPrice: v })} suffix={`${cur}/L`} step={0.01} />)}
          {motor && <NumberField label={t('Tolls (trip)')} value={settings.tollsTotal} onChange={v => set({ tollsTotal: v })} suffix={cur} hint={routeInfo.avoid?.avoidTolls ? t('Avoid tolls is on') : t('Your estimate for the whole trip')} />}
          <NumberField label={t('Other / day')} value={settings.otherPerDay} onChange={v => set({ otherPerDay: v })} suffix={cur} hint={t('Coffee, entries, parking, tickets…')} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={settings.includeFinishNight} onChange={(e) => set({ includeFinishNight: e.target.checked })} />
          {t('Include a night at the finish ({place})', { place: routeInfo.destination.split(',')[0] })}
        </label>

        {/* One-off costs */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600">{t('One-off costs')}</p>
          {settings.extras.map((extra, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={extra.label} placeholder={t('e.g. Ferry ticket, insurance')}
                onChange={(e) => set({ extras: settings.extras.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })}
                className="h-8 min-w-0 flex-1 rounded-md border border-emerald-100 px-2 text-xs"
              />
              <input
                type="number" min={0} value={extra.amount}
                onChange={(e) => set({ extras: settings.extras.map((x, j) => j === i ? { ...x, amount: Math.max(0, Number(e.target.value) || 0) } : x) })}
                className="h-8 w-24 rounded-md border border-emerald-100 px-2 text-xs" aria-label={t('Amount')}
              />
              <button onClick={() => set({ extras: settings.extras.filter((_, j) => j !== i) })} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={t('Remove cost')}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => set({ extras: [...settings.extras, { label: '', amount: 0 }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
            <Plus size={12} /> {t('Add a cost')}
          </button>
        </div>
      </section>

      {/* Day by day */}
      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-emerald-50 text-left text-[11px] uppercase tracking-wide text-emerald-800">
            <tr>
              <th className="px-3 py-2">{t('Day')}</th>
              <th className="px-3 py-2">{t('Route')}</th>
              <th className="px-3 py-2 text-right">{distUnit}</th>
              <th className="px-3 py-2">{t('Night')}</th>
              <th className="px-3 py-2 text-right">{t('Stay')}</th>
              <th className="px-3 py-2 text-right">{t('Food')}</th>
              {motor && <th className="px-3 py-2 text-right">{t('Fuel')}</th>}
              <th className="px-3 py-2 text-right">{t('Other')}</th>
              <th className="px-3 py-2 text-right">{t('Total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {budget.rows.map(r => (
              <tr key={r.day} className={cn(r.kind !== 'ride' && 'bg-emerald-50/40')}>
                <td className="whitespace-nowrap px-3 py-2 font-semibold">
                  {r.kind !== 'ride' && <BedDouble size={11} className="mr-1 inline text-emerald-700" />}{r.kind === 'before' ? t('Before') : t('Day {n}', { n: r.day })}
                  {r.date && <span className="block text-[10px] font-normal text-muted-foreground">{date(r.date)}</span>}
                </td>
                <td className="max-w-[220px] truncate px-3 py-2" title={rowLabel(r)}>{rowLabel(r)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.km ? Math.round(toDist(r.km)) : ''}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-muted-foreground" title={r.nightAt}>{r.nightAt?.split(',')[0] || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums" title={r.stayNote}>
                  {r.stayKind === 'none' ? '—' : r.stayKind === 'covered' ? <span className="text-violet-700">{t('booked')}</span> : money(r.stay)}
                  {r.stayKind === 'booked' && <span className="ml-1 rounded bg-violet-100 px-1 text-[9px] font-bold uppercase text-violet-700">{t('booked')}</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.food ? money(r.food) : '—'}</td>
                {motor && <td className="px-3 py-2 text-right tabular-nums">{r.fuel ? money(r.fuel) : '—'}</td>}
                <td className="px-3 py-2 text-right tabular-nums">{r.other ? money(r.other) : '—'}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 text-xs">
            {budget.totals.tolls > 0 && (
              <tr><td colSpan={motor ? 8 : 7} className="px-3 py-1.5 text-right text-muted-foreground">{t('Tolls')}</td><td className="px-3 py-1.5 text-right tabular-nums">{money(budget.totals.tolls)}</td></tr>
            )}
            {budget.bookings.map((b, i) => (
              <tr key={`b${i}`}><td colSpan={motor ? 8 : 7} className="px-3 py-1.5 text-right text-muted-foreground">{t('Booked:')} {b.name} <span className="text-[10px]">({b.stop.split(',')[0]})</span></td><td className="px-3 py-1.5 text-right tabular-nums">{money(b.amount)}</td></tr>
            ))}
            {settings.extras.filter(e => e.amount > 0).map((e, i) => (
              <tr key={i}><td colSpan={motor ? 8 : 7} className="px-3 py-1.5 text-right text-muted-foreground">{e.label || t('One-off cost')}</td><td className="px-3 py-1.5 text-right tabular-nums">{money(e.amount)}</td></tr>
            ))}
            <tr className="bg-emerald-50 font-bold text-emerald-950">
              <td colSpan={motor ? 8 : 7} className="px-3 py-2 text-right">{t('Total')}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(budget.totals.all)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
      <p className="text-[11px] text-muted-foreground">
        {t("Estimates from your averages. Accommodation you've booked (attached reservations with a price) replaces the estimate for that stop; other priced bookings, like tickets, are added as they are. Your averages are saved with the trip.")}
      </p>
    </div>
  );
};

export default BudgetView;
