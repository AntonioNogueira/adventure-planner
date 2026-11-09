import React, { useEffect, useRef, useState } from 'react';
import { Route as RouteIcon, Wallet, FolderOpen, Settings, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings, LANGUAGES, CURRENCIES, Units, Language } from '../lib/settings';
import { useAccount, openPlans } from '../lib/account';
import { PLANS } from '../lib/plans';
import { openPrivacy } from './ConsentBanner';
import InstallHint from './InstallHint';

export type AppView = 'route' | 'budget' | 'documents' | 'ride';

const TABS: { id: AppView; label: string; icon: typeof RouteIcon }[] = [
  { id: 'route', label: 'Route', icon: RouteIcon },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'ride', label: 'Ride', icon: Navigation },
];

/** Distance units, currency and language (defaults come from the browser's locale). */
const SettingsMenu: React.FC = () => {
  const { settings, update, t } = useSettings();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const field = 'h-8 w-full rounded-sm border border-emerald-100 bg-white px-2 text-xs';
  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t('Settings')}
        title={t('Settings')}
        className={cn('flex h-full items-center rounded-lg px-2.5 py-2 transition-all',
          open ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700')}
      >
        <Settings size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-64 space-y-3 rounded-lg border bg-card p-3 text-xs shadow-xl">
          <p className="font-bold uppercase text-emerald-800">{t('Settings')}</p>
          <div className="space-y-1">
            <p className="font-semibold text-slate-600">{t('Distance')}</p>
            <div className="grid grid-cols-2 gap-1" role="group" aria-label={t('Distance')}>
              {([['metric', t('Kilometres')], ['imperial', t('Miles')]] as [Units, string][]).map(([id, label]) => (
                <button key={id} onClick={() => update({ units: id })} aria-pressed={settings.units === id}
                  className={cn('rounded-sm border px-2 py-1.5 font-semibold',
                    settings.units === id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-100 hover:bg-emerald-50')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-600">{t('Currency')}</span>
            <select value={settings.currency} onChange={(e) => update({ currency: e.target.value })} className={field}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-600">{t('Language')}</span>
            <select value={settings.language} onChange={(e) => update({ language: e.target.value as Language })} className={field}>
              {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <p className="text-[10px] text-muted-foreground">{t('Set from your browser’s region at first; saved on this device.')}</p>
          <div className="flex items-center justify-between border-t pt-2">
            <span><span className="font-semibold text-slate-600">{t('Plan')}:</span> {t(PLANS[account.plan].name)}</span>
            <button onClick={() => { setOpen(false); openPlans(); }} className="font-semibold text-emerald-700 hover:underline">{t('See plans')}</button>
          </div>
          <button onClick={() => { setOpen(false); openPrivacy(); }} className="text-[11px] font-semibold text-emerald-700 hover:underline">{t('Privacy and cookies')}</button>
          <InstallHint compact />
        </div>
      )}
    </div>
  );
};

/** The switch above the map: Route (the map), Budget, Documents and Ride, then Settings. */
const ViewTabs: React.FC<{ view: AppView; onChange: (view: AppView) => void; documentCount: number }> = ({ view, onChange, documentCount }) => {
  const { t } = useSettings();
  return (
    <nav
      aria-label={t('Views')}
      className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 gap-1 rounded-xl border border-white/20 bg-white/90 p-1 shadow-xl backdrop-blur-md md:top-6"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-label={t(label)}
          aria-pressed={view === id}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all sm:px-3',
            view === id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700',
          )}
        >
          <Icon size={14} />
          <span className={cn(view !== id && 'hidden min-[420px]:inline')}>{t(label)}</span>
          {id === 'documents' && documentCount > 0 && (
            <span className={cn('rounded-full px-1.5 text-[10px]', view === id ? 'bg-white/25' : 'bg-violet-100 text-violet-700')}>{documentCount}</span>
          )}
        </button>
      ))}
      <span className="mx-0.5 w-px self-stretch bg-border" aria-hidden />
      <SettingsMenu />
    </nav>
  );
};

export default ViewTabs;
