// The caller's plan, limits and today's usage (from the server's /api/me), shared by every part of
// the app, plus helpers to call the API as the signed-in user and to open the plans screen.
import { useSyncExternalStore } from 'react';
import { auth } from '../firebase';
import { PlanId, Limits, UsageKind, PLANS } from './plans';

export interface AccountInfo {
  plan: PlanId;
  signedIn: boolean;
  limits: Limits;
  usage: Record<UsageKind, number>;
}

const fallback: AccountInfo = { plan: 'anonymous', signedIn: false, limits: PLANS.anonymous.limits, usage: { aiPlans: 0, placeSearches: 0, documents: 0 } };
let current: AccountInfo = fallback;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

/** fetch() with the signed-in user's Firebase ID token, so the server knows their plan. */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken().catch(() => undefined);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export async function refreshAccount() {
  try {
    const res = await authFetch('/api/me');
    if (res.ok) { current = await res.json(); emit(); }
  } catch { /* offline or no server: keep what we have */ }
}

export function useAccount(): AccountInfo {
  return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => current, () => current);
}

export function getAccount() { return current; }

/** A daily limit was reached (the server answered 402). */
export class LimitError extends Error {
  constructor(public kind: UsageKind | 'savedTrips', public limit: number, public plan: PlanId) {
    super('limit');
  }
}

/** Throws LimitError for a 402 answer; otherwise returns the response. */
export async function checkLimit(res: Response): Promise<Response> {
  if (res.status !== 402) return res;
  const data = await res.clone().json().catch(() => ({}));
  refreshAccount();
  throw new LimitError(data.kind || 'aiPlans', Number(data.limit) || 0, data.plan || current.plan);
}

/** Count place searches before loading suggestions; false when today's allowance is used up. */
export async function takePlaceSearches(amount: number): Promise<boolean> {
  try {
    const res = await authFetch('/api/usage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'placeSearches', amount }),
    });
    if (res.status === 402) { refreshAccount(); return false; }
    if (res.ok) { const data = await res.json(); current = { ...current, usage: data.usage, limits: data.limits }; emit(); }
  } catch { /* no server (static preview): don't block */ }
  return true;
}

// ---- Opening the plans screen from anywhere (planner chat, toasts, the account menu) ----

export type PlansReason = UsageKind | 'savedTrips' | null;
const openListeners = new Set<(reason: PlansReason) => void>();
export function onOpenPlans(l: (reason: PlansReason) => void) { openListeners.add(l); return () => { openListeners.delete(l); }; }
export function openPlans(reason: PlansReason = null) { openListeners.forEach(l => l(reason)); }
