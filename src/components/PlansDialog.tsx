import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PLANS, OFFERED, PlanId, UsageKind } from '../lib/plans';
import { useAccount, PlansReason } from '../lib/account';
import { useSettings } from '../lib/settings';
import { CHECKOUT_URLS } from '../lib/provider';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

const REASONS: Record<Exclude<PlansReason, null>, string> = {
  aiPlans: "You've used today's AI plans on your plan.",
  placeSearches: "You've used today's place searches on your plan.",
  documents: "You've used today's document reads on your plan.",
  savedTrips: "You've saved as many trips as your plan allows.",
};

const USAGE_LABELS: Record<UsageKind, string> = {
  aiPlans: 'AI plans today',
  placeSearches: 'Place searches today',
  documents: 'Documents read today',
};

/** Plan comparison, today's usage and upgrade links (checkout links come from CHECKOUT_URL_* settings). */
const PlansDialog: React.FC<{ reason: PlansReason; savedTrips: number; onClose: () => void; onLogin: () => void }> = ({ reason, savedTrips, onClose, onLogin }) => {
  const { t } = useSettings();
  const account = useAccount();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Stripe Payment Links (and similar) accept the buyer's email and an id to match the payment to the account.
  const checkoutLink = (id: PlanId) => {
    const base = CHECKOUT_URLS[id];
    if (!base) return null;
    const url = new URL(base);
    const user = auth.currentUser;
    if (user?.email) url.searchParams.set('prefilled_email', user.email);
    if (user?.uid) url.searchParams.set('client_reference_id', user.uid);
    return url.toString();
  };

  const current = account.plan === 'anonymous' ? 'free' : account.plan;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('Plans')} onClick={e => e.stopPropagation()}
        className="max-h-full w-full max-w-4xl space-y-4 overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold uppercase text-emerald-950">{t('Plans')}</h2>
            <p className="text-xs text-muted-foreground">
              {account.signedIn
                ? t('You are on the {plan} plan.', { plan: t(PLANS[account.plan].name) })
                : t('Log in for the Free plan: saved trips and more daily plans.')}
            </p>
          </div>
          <button onClick={onClose} aria-label={t('Close')} className="rounded-full p-1.5 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {reason && (
          <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            {t(REASONS[reason])} {account.signedIn ? t('Upgrade for more, or come back tomorrow.') : t('Log in for more, or come back tomorrow.')}
          </p>
        )}

        {/* Today's usage on the current plan */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(USAGE_LABELS) as UsageKind[]).map(kind => (
            <div key={kind} className="rounded-md border bg-white px-3 py-2 text-xs">
              <p className="font-semibold uppercase text-slate-500">{t(USAGE_LABELS[kind])}</p>
              <p className="tabular-nums text-sm font-bold">{account.usage[kind]} / {account.enforced ? account.limits[kind] : '∞'}</p>
            </div>
          ))}
          <div className="rounded-md border bg-white px-3 py-2 text-xs">
            <p className="font-semibold uppercase text-slate-500">{t('Saved trips')}</p>
            <p className="tabular-nums text-sm font-bold">{savedTrips} / {account.enforced ? (account.limits.savedTrips ?? '∞') : '∞'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OFFERED.map(id => {
            const plan = PLANS[id];
            const isCurrent = account.signedIn && id === current;
            const link = checkoutLink(id);
            return (
              <div key={id} className={cn('flex flex-col rounded-lg border bg-white p-4', isCurrent && 'border-emerald-600 ring-1 ring-emerald-600')}>
                <div className="flex items-center justify-between">
                  <p className="font-bold uppercase text-emerald-900">{t(plan.name)}</p>
                  {isCurrent && <span className="rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{t('Current')}</span>}
                </div>
                <p className="mt-1 text-lg font-bold">{plan.price ? t(plan.price) : t('€0')}</p>
                {plan.priceAlt && <p className="text-xs text-muted-foreground">{t('or {price}', { price: t(plan.priceAlt) })}</p>}
                <ul className="my-3 flex-1 space-y-1 text-xs text-slate-700">
                  {plan.features.map(f => <li key={f} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0 text-emerald-600" />{t(f)}</li>)}
                </ul>
                {id === 'free' ? (
                  account.signedIn
                    ? <span className="py-2 text-center text-xs text-muted-foreground">{isCurrent ? t('Your plan') : t('Included')}</span>
                    : <button onClick={() => { onClose(); onLogin(); }} className="rounded-md bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700">{t('Log in for free')}</button>
                ) : isCurrent ? (
                  <span className="py-2 text-center text-xs text-muted-foreground">{t('Your plan')}</span>
                ) : !account.signedIn ? (
                  <button onClick={() => { onClose(); onLogin(); }} className="rounded-md border border-emerald-600 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t('Log in to upgrade')}</button>
                ) : link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-600 py-2 text-center text-xs font-bold text-white hover:bg-emerald-700">{t('Upgrade')}</a>
                ) : (
                  <span className="rounded-md border border-dashed py-2 text-center text-xs text-muted-foreground">{t('Coming soon')}</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">{t('Prices include VAT where it applies. Daily allowances reset at midnight (UTC). Paid plans are fair use.')}</p>
      </div>
    </div>
  );
};

export default PlansDialog;
