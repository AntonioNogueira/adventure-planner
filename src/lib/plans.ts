// Subscription plans and their limits, shared by the app and the server (server/plan-api.ts).
// Prices and numbers live here only; the server can override limits with PLAN_LIMITS (JSON).

export type PlanId = 'anonymous' | 'free' | 'explorer' | 'trip_pass' | 'pro';
export type UsageKind = 'aiPlans' | 'placeSearches' | 'documents';

export interface Limits {
  /** Saved trips (null = unlimited). */
  savedTrips: number | null;
  /** Per day (UTC). */
  aiPlans: number;
  placeSearches: number;
  documents: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** e.g. "€4.99 / month"; empty for free plans. */
  price: string;
  /** A second price option shown under the first. */
  priceAlt?: string;
  limits: Limits;
  /** Short feature lines for the plans screen (English; translated with t()). */
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  anonymous: {
    id: 'anonymous', name: 'Visitor', price: '',
    limits: { savedTrips: 0, aiPlans: 5, placeSearches: 10, documents: 2 },
    features: [],
  },
  free: {
    id: 'free', name: 'Free', price: '',
    limits: { savedTrips: 3, aiPlans: 10, placeSearches: 20, documents: 5 },
    features: ['3 saved trips', '10 AI plans a day', '20 place searches a day', 'Budget, GPX and weather', 'Share trips by link'],
  },
  explorer: {
    id: 'explorer', name: 'Explorer', price: '€2.99 / month', priceAlt: '€19 / year',
    limits: { savedTrips: null, aiPlans: 100, placeSearches: 300, documents: 200 },
    features: ['Unlimited saved trips', '100 AI plans a day', '300 place searches a day', 'Documents for every booking', 'Everything in Free'],
  },
  trip_pass: {
    id: 'trip_pass', name: 'Trip Pass', price: '€4.99 once',
    limits: { savedTrips: null, aiPlans: 100, placeSearches: 300, documents: 200 },
    features: ['Explorer for 3 months', 'One payment, no subscription', 'For the one big trip a year'],
  },
  pro: {
    id: 'pro', name: 'Pro', price: '€24 / month',
    limits: { savedTrips: null, aiPlans: 400, placeSearches: 1500, documents: 1000 },
    features: ['For guides and tour operators', '400 AI plans a day', 'Several riders per trip (soon)', 'Branded PDF itineraries (soon)'],
  },
};

/** Plans offered on the plans screen, in order. */
export const OFFERED: PlanId[] = ['free', 'explorer', 'trip_pass', 'pro'];

/** The plan in force: a paid plan with an end date that has passed falls back to Free. */
export function effectivePlan(record: { plan?: string; planUntil?: string | number } | null | undefined, signedIn: boolean, now = Date.now()): PlanId {
  if (!signedIn) return 'anonymous';
  const plan = record?.plan as PlanId | undefined;
  if (!plan || !(plan in PLANS) || plan === 'anonymous') return 'free';
  if (record?.planUntil) {
    const until = typeof record.planUntil === 'number' ? record.planUntil : Date.parse(record.planUntil);
    if (Number.isFinite(until) && until < now) return 'free';
  }
  return plan;
}

/** A plan's limits, with optional overrides ({ "free": { "aiPlans": 3 } }). */
export function limitsFor(plan: PlanId, overrides?: Partial<Record<PlanId, Partial<Limits>>>): Limits {
  return { ...PLANS[plan].limits, ...(overrides?.[plan] || {}) };
}

/** Counts per user (or visitor) per UTC day. In memory: resets when the server restarts. */
export class UsageCounter {
  private counts = new Map<string, number>();

  private key(who: string, kind: UsageKind, now: number) {
    return `${new Date(now).toISOString().slice(0, 10)}|${who}|${kind}`;
  }

  used(who: string, kind: UsageKind, now = Date.now()) {
    return this.counts.get(this.key(who, kind, now)) || 0;
  }

  /** Count `amount` uses if they fit under `limit`; returns whether they were allowed. */
  take(who: string, kind: UsageKind, limit: number, amount = 1, now = Date.now()): boolean {
    const k = this.key(who, kind, now);
    const used = this.counts.get(k) || 0;
    if (used + amount > limit) return false;
    this.counts.set(k, used + amount);
    if (this.counts.size > 50_000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    const today = new Date(now).toISOString().slice(0, 10);
    for (const k of this.counts.keys()) if (!k.startsWith(today)) this.counts.delete(k);
  }
}

/** "a@b.com=explorer, c@d.com=pro" → map of email → plan (for testing without payments). */
export function parsePlanOverrides(value = ''): Map<string, PlanId> {
  const out = new Map<string, PlanId>();
  for (const pair of value.split(',')) {
    const [email, plan] = pair.split('=').map(s => s.trim().toLowerCase());
    if (email && plan && plan in PLANS) out.set(email, plan as PlanId);
  }
  return out;
}
