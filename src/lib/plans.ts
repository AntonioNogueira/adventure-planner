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
  /** Documents read per day: a hidden safety cap. */
  documents: number;
  /** Documents (bookings, tickets, links) kept in one trip (null = unlimited): the visible limit. */
  docsPerTrip: number | null;
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
  // Free is honestly usable: planning with the AI, all editing, budget, documents, weather, GPX and sharing. The only
  // visible limit is how many trips are kept (3). The daily numbers are safety caps against bots and abuse that a
  // normal traveller doesn't reach; at one, only that service pauses until the next day (editing keeps working).
  anonymous: {
    id: 'anonymous', name: 'Visitor', price: '',
    limits: { savedTrips: 0, aiPlans: 10, placeSearches: 60, documents: 20, docsPerTrip: 5 },
    features: [],
  },
  free: {
    id: 'free', name: 'Free', price: '',
    limits: { savedTrips: 3, aiPlans: 30, placeSearches: 150, documents: 60, docsPerTrip: 20 },
    features: ['3 saved trips', 'AI trip planner', 'All editing, budget, weather and GPX', '20 documents per trip', 'Share trips by link'],
  },
  explorer: {
    id: 'explorer', name: 'Explorer', price: '€2.99 / month', priceAlt: '€19 / year',
    limits: { savedTrips: null, aiPlans: 150, placeSearches: 600, documents: 200, docsPerTrip: null },
    features: ['Unlimited saved trips and documents', 'Offline maps in the app (soon)', 'Live location for family or the group (soon)', 'Plan trips together (soon)', 'Everything in Free'],
  },
  trip_pass: {
    id: 'trip_pass', name: 'Trip Pass', price: '€4.99 once',
    limits: { savedTrips: null, aiPlans: 150, placeSearches: 600, documents: 200, docsPerTrip: null },
    features: ['Explorer for 3 months', 'One payment, no subscription', 'For the one big trip a year'],
  },
  pro: {
    id: 'pro', name: 'Pro', price: '€24 / month',
    limits: { savedTrips: null, aiPlans: 400, placeSearches: 1500, documents: 1000, docsPerTrip: null },
    features: ['For guides, clubs and tour operators', 'Group trips with several riders (soon)', 'Branded PDF itineraries (soon)', 'Everything in Explorer'],
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
