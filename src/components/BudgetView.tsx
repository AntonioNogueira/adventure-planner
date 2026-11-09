import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, Download, Plus, X, BedDouble } from 'lucide-react';
import { RouteInfo } from '../types';
import { ScheduleDay } from '../lib/schedule';
import { BudgetSettings, BudgetStop, BudgetRow, DayField, computeBudget, budgetCsv } from '../lib/budget';
import { cn } from '../lib/utils';
import { Vehicle, VEHICLES, VEHICLE_LABELS } from '../lib/fuel';
import { roadData } from '../lib/osmRoads';
import { LatLng } from '../lib/geo';
import { useSettings } from '../lib/settings';

interface BudgetViewProps {
  routeInfo: RouteInfo | null;
  schedule: ScheduleDay[];
  settings: BudgetSettings;
  onChange: (settings: BudgetSettings) => void;
  /** Each day's path, to measure km on toll roads (moto/car). */
  legPaths: LatLng[][];
  /** Off-road trip (a little more fuel per km). */
  offroad?: boolean;
  /** Moto/car trips: what they travel in (fuel and tolls). */
  vehicle?: Vehicle;
  onVehicleChange: (vehicle: Vehicle) => void;
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

/** A number the app can estimate: empty shows the estimate (marked "auto"); typing overrides it. */
const EstimateField: React.FC<{ label: string; value?: number; estimate: number; onChange: (v: number | undefined) => void; suffix?: string; step?: number; hint?: string; autoLabel: string }> = ({ label, value, estimate, onChange, suffix, step = 1, hint, autoLabel }) => (
  <label className="flex flex-col gap-1 text-xs" title={hint}>
    <span className="flex items-center justify-between gap-1 font-semibold text-slate-600">
      {label}
      {value === undefined
        ? <span className="rounded-sm bg-emerald-100 px-1 text-[9px] font-bold uppercase text-emerald-800">{autoLabel}</span>
        : <button type="button" onClick={(e) => { e.preventDefault(); onChange(undefined); }} className="text-[10px] font-semibold text-emerald-700 hover:underline">↺ {autoLabel}</button>}
    </span>
    <span className="flex items-center rounded-md border border-emerald-100 bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
      <input
        type="number" min={0} step={step} value={value ?? ''} placeholder={String(estimate)}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0))}
        className="h-9 w-full min-w-0 rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-slate-500"
      />
      {suffix && <span className="shrink-0 pr-2 text-[11px] text-slate-400">{suffix}</span>}
    </span>
  </label>
);

/** A table amount you can type over; ↺ goes back to the estimate. */
const Cell: React.FC<{ value: number; edited?: boolean; onChange: (v: number | undefined) => void; label: string; resetLabel: string }> = ({ value, edited, onChange, label, resetLabel }) => {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? String(Math.round(value * 100) / 100);
  return (
    <span className="inline-flex items-center justify-end gap-0.5">
      {edited && (
        <button type="button" onClick={() => { setDraft(null); onChange(undefined); }} title={resetLabel} aria-label={resetLabel}
          className="text-[10px] text-emerald-700 hover:text-emerald-900">↺</button>
      )}
      <input
        type="number" inputMode="decimal" min={0} step="any" value={shown} aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft !== null) { onChange(draft === '' ? undefined : Math.max(0, Number(draft) || 0)); setDraft(null); } }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
        className={cn('w-[4.5rem] rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-right tabular-nums hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none',
          edited ? 'font-semibold text-emerald-900' : 'border-b-emerald-100')}
      />
    </span>
  );
};

const BudgetView: React.FC<BudgetViewProps> = ({ routeInfo, schedule, settings, onChange, legPaths, offroad, vehicle, onVehicleChange }) => {
  const { t, settings: app, distUnit, toDist, money: fmtMoney, date } = useSettings();
  const imperial = app.units === 'imperial';
  // US units for fuel: mpg and price per gallon (stored as L/100 km and per litre).
  const L_PER_GAL = 3.78541, MPG_FACTOR = 235.215;
  const stops: BudgetStop[] = useMemo(() => routeInfo ? [
    { key: 'start', label: routeInfo.origin, interests: routeInfo.originInterests || [] },
    ...routeInfo.waypoints.map((wp, i) => ({ key: `stop-${i}`, label: wp.location, interests: wp.interests || [] })),
    { key: 'end', label: routeInfo.destination, interests: routeInfo.destinationInterests || [] },
  ] : [], [routeInfo]);
  // km on toll roads per day, from OpenStreetMap road data (one request per day, cached).
  const motorTrip = routeInfo?.travelMode === 'DRIVING';
  const [tollKm, setTollKm] = useState<number[] | null>(null);
  useEffect(() => {
    let live = true;
    setTollKm(null);
    if (!motorTrip || !legPaths.length) return;
    (async () => {
      const out: number[] = [];
      for (const path of legPaths) out.push((await roadData(path, 'DRIVING'))?.tollKm || 0);
      if (live) setTollKm(out);
    })();
    return () => { live = false; };
  }, [legPaths, motorTrip]);

  const budget = useMemo(
    () => computeBudget(settings, schedule, routeInfo?.legs || [], stops, tollKm, { offroad, motor: motorTrip, vehicle }),
    [settings, schedule, routeInfo, stops, tollKm, offroad, motorTrip, vehicle],
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
  // A typed amount for one cell of the table (undefined = back to the estimate).
  const editDay = (day: number, field: DayField, v: number | undefined) => {
    const edits = { ...(settings.dayEdits || {}) };
    const row = { ...(edits[String(day)] || {}) };
    if (v === undefined) delete row[field]; else row[field] = v;
    if (Object.keys(row).length) edits[String(day)] = row; else delete edits[String(day)];
    set({ dayEdits: edits });
  };
  const isEdited = (r: BudgetRow, f: DayField) => Boolean(r.edited?.includes(f));
  const reset = t('Back to the estimate');
  const motor = routeInfo.travelMode === 'DRIVING';
  const foreign = Object.entries(budget.otherCurrencies);
  const days = budget.rows.filter(r => r.kind !== 'before').length;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  let regionNames: Intl.DisplayNames | null = null;
  try { regionNames = new Intl.DisplayNames([app.language], { type: 'region' }); } catch { /* old browser */ }
  const countryNames = budget.fuel.countries.slice(0, 3).map(c => regionNames?.of(c) || c).join(', ');
  const auto = t('auto');

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
          <NumberField label={t('Stay / night')} value={settings.stayPerNight} onChange={v => set({ stayPerNight: v })} suffix={cur} hint={t('Used where a stop has no places to stay found and no booking')} />
          <NumberField label={t('Food / day')} value={settings.foodPerDay} onChange={v => set({ foodPerDay: v })} suffix={cur} />
          {motor && (
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">{t('Vehicle')}</span>
              <select value={vehicle || 'motorcycle'} onChange={(e) => onVehicleChange(e.target.value as Vehicle)}
                className="h-9 rounded-md border border-emerald-100 bg-white px-2 text-sm">
                {VEHICLES.map(v => <option key={v} value={v}>{t(VEHICLE_LABELS[v])}</option>)}
              </select>
            </label>
          )}
          {motor && (imperial
            ? <EstimateField label={t('Consumption')} autoLabel={auto} suffix="mpg" step={0.5}
                value={settings.fuelPer100km ? r2(MPG_FACTOR / settings.fuelPer100km) : settings.fuelPer100km === 0 ? 0 : undefined}
                estimate={r2(MPG_FACTOR / budget.fuel.per100km)} onChange={v => set({ fuelPer100km: v === undefined ? undefined : v ? MPG_FACTOR / v : 0 })}
                hint={t('Typical for the vehicle; a little more off-road')} />
            : <EstimateField label={t('Consumption')} autoLabel={auto} suffix="L/100km" step={0.1}
                value={settings.fuelPer100km} estimate={budget.fuel.per100km} onChange={v => set({ fuelPer100km: v })}
                hint={t('Typical for the vehicle; a little more off-road')} />)}
          {motor && (imperial
            ? <EstimateField label={t('Fuel price')} autoLabel={auto} suffix={`${cur}/gal`} step={0.01}
                value={settings.fuelPrice === undefined ? undefined : r2(settings.fuelPrice * L_PER_GAL)}
                estimate={r2(budget.fuel.price * L_PER_GAL)} onChange={v => set({ fuelPrice: v === undefined ? undefined : v / L_PER_GAL })}
                hint={t('Typical average price in the countries on the route')} />
            : <EstimateField label={t('Fuel price')} autoLabel={auto} suffix={`${cur}/L`} step={0.01}
                value={settings.fuelPrice} estimate={budget.fuel.price} onChange={v => set({ fuelPrice: v })}
                hint={t('Typical average price in the countries on the route')} />)}
          {motor && <EstimateField label={t('Tolls / km')} autoLabel={auto} suffix={`${cur}/km`} step={0.01}
            value={settings.tollPerKm} estimate={budget.tolls.rate} onChange={v => set({ tollPerKm: v })}
            hint={t('Per km on toll roads; toll roads are found from OpenStreetMap')} />}
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
                <td className="px-2 py-1.5 text-right tabular-nums" title={r.stayNote}>
                  {r.stayKind === 'none' && !isEdited(r, 'stay') ? '—'
                    : r.stayKind === 'covered' && !isEdited(r, 'stay') ? <span className="text-violet-700">{t('booked')}</span>
                    : <Cell value={r.stay} edited={isEdited(r, 'stay')} onChange={v => editDay(r.day, 'stay', v)} label={`${t('Stay')} · ${t('Day {n}', { n: r.day })}`} resetLabel={reset} />}
                  {r.stayKind === 'booked' && !isEdited(r, 'stay') && <span className="ml-1 rounded bg-violet-100 px-1 text-[9px] font-bold uppercase text-violet-700">{t('booked')}</span>}
                  {r.stayKind === 'places' && !isEdited(r, 'stay') && <span className="block text-[9px] text-emerald-700" title={t('Average of the places to stay suggested at this stop')}>{t('from {n} places', { n: r.stayNote || '' })}</span>}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums" title={r.foodFromPlaces ? t('From the price level of restaurants at this stop') : undefined}>
                  <Cell value={r.food} edited={isEdited(r, 'food')} onChange={v => editDay(r.day, 'food', v)} label={`${t('Food')} · ${t('Day {n}', { n: r.day })}`} resetLabel={reset} />
                  {r.foodFromPlaces && !isEdited(r, 'food') && <span className="block text-[9px] text-emerald-700">{t('local prices')}</span>}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  <Cell value={r.other} edited={isEdited(r, 'other')} onChange={v => editDay(r.day, 'other', v)} label={`${t('Other')} · ${t('Day {n}', { n: r.day })}`} resetLabel={reset} />
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 text-xs">
            {motor && (
              <tr>
                <td colSpan={7} className="px-3 py-1.5 text-right text-muted-foreground">
                  <span className="font-semibold text-slate-700">{t('Fuel')}</span>{' · '}
                  {t('{d} × {c} × {p}', {
                    d: `${Math.round(toDist(budget.fuel.km))} ${distUnit}`,
                    c: imperial ? `${r2(MPG_FACTOR / budget.fuel.per100km)} mpg` : `${budget.fuel.per100km} L/100 km`,
                    p: imperial ? `${money(budget.fuel.price * L_PER_GAL)}/gal` : `${money(budget.fuel.price)}/L`,
                  })}
                  {budget.fuel.estimatedPrice && countryNames && <span className="text-[10px]"> ({t('typical price in {countries}', { countries: countryNames })})</span>}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">
                  <Cell value={budget.totals.fuel} edited={budget.fuelEdited} onChange={v => set({ fuelOverride: v })} label={t('Fuel')} resetLabel={reset} />
                </td>
              </tr>
            )}
            {motor && (
              <tr>
                <td colSpan={7} className="px-3 py-1.5 text-right text-muted-foreground">
                  <span className="font-semibold text-slate-700">{t('Tolls')}</span>{' · '}
                  {tollKm === null
                    ? t('finding toll roads on the route…')
                    : t('{d} on toll roads × {r}/km', { d: `${Math.round(toDist(budget.tolls.km))} ${distUnit}`, r: money(budget.tolls.rate) })}
                  {(settings.tollsTotal || 0) > 0 && <> + {money(settings.tollsTotal)}</>}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">
                  {tollKm === null && !budget.tollEdited ? '…'
                    : <Cell value={budget.totals.tolls} edited={budget.tollEdited} onChange={v => set({ tollOverride: v })} label={t('Tolls')} resetLabel={reset} />}
                </td>
              </tr>
            )}
            {budget.bookings.map((b, i) => (
              <tr key={`b${i}`}><td colSpan={7} className="px-3 py-1.5 text-right text-muted-foreground">{t('Booked:')} {b.name} <span className="text-[10px]">({b.stop.split(',')[0]})</span></td><td className="px-3 py-1.5 text-right tabular-nums">{money(b.amount)}</td></tr>
            ))}
            {settings.extras.filter(e => e.amount > 0).map((e, i) => (
              <tr key={i}><td colSpan={7} className="px-3 py-1.5 text-right text-muted-foreground">{e.label || t('One-off cost')}</td><td className="px-3 py-1.5 text-right tabular-nums">{money(e.amount)}</td></tr>
            ))}
            <tr className="bg-emerald-50 font-bold text-emerald-950">
              <td colSpan={7} className="px-3 py-2 text-right">{t('Total')}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(budget.totals.all)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
      <p className="text-[11px] font-semibold text-emerald-800">{t('Type over any amount in the table to use your own; ↺ goes back to the estimate.')}</p>
      <p className="text-[11px] text-muted-foreground">
        {t("Estimates from your averages. Accommodation you've booked (attached reservations with a price) replaces the estimate for that stop; other priced bookings, like tickets, are added as they are. Your averages are saved with the trip.")}
      </p>
    </div>
  );
};

export default BudgetView;
