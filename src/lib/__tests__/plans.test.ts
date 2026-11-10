import { describe, expect, it } from 'vitest';
import { generateKeyPairSync, createSign } from 'crypto';
import { PLANS, OFFERED, UsageCounter, effectivePlan, limitsFor, parsePlanOverrides } from '../plans';
import { PT } from '../i18n';
import { verifyIdToken } from '../../../server/auth';

describe('effectivePlan', () => {
  it('is Visitor logged out and Free without a paid plan', () => {
    expect(effectivePlan(null, false)).toBe('anonymous');
    expect(effectivePlan(null, true)).toBe('free');
    expect(effectivePlan({ plan: 'nonsense' }, true)).toBe('free');
  });
  it('honours a paid plan until it ends', () => {
    const now = Date.parse('2026-06-01T00:00:00Z');
    expect(effectivePlan({ plan: 'explorer' }, true, now)).toBe('explorer');
    expect(effectivePlan({ plan: 'trip_pass', planUntil: '2026-08-01T00:00:00Z' }, true, now)).toBe('trip_pass');
    expect(effectivePlan({ plan: 'trip_pass', planUntil: '2026-05-01T00:00:00Z' }, true, now)).toBe('free');
  });
});

describe('limits', () => {
  it('can be overridden per plan', () => {
    expect(limitsFor('free').aiPlans).toBe(20);
    expect(limitsFor('free', { free: { aiPlans: 3 } })).toMatchObject({ aiPlans: 3, placeSearches: 80 });
    expect(limitsFor('explorer').savedTrips).toBeNull();
  });
  it('grants plans for testing by email', () => {
    const map = parsePlanOverrides('A@b.com=explorer, c@d.com=pro, e@f.com=bogus');
    expect(map.get('a@b.com')).toBe('explorer');
    expect(map.get('c@d.com')).toBe('pro');
    expect(map.has('e@f.com')).toBe(false);
  });
});

describe('UsageCounter', () => {
  it('counts per user per day and refuses over the limit', () => {
    const c = new UsageCounter();
    const day1 = Date.parse('2026-06-01T10:00:00Z');
    expect(c.take('u1', 'aiPlans', 2, 1, day1)).toBe(true);
    expect(c.take('u1', 'aiPlans', 2, 1, day1)).toBe(true);
    expect(c.take('u1', 'aiPlans', 2, 1, day1)).toBe(false);
    expect(c.used('u1', 'aiPlans', day1)).toBe(2);
    expect(c.take('u2', 'aiPlans', 2, 1, day1)).toBe(true);           // someone else
    expect(c.take('u1', 'placeSearches', 5, 5, day1)).toBe(true);     // another kind
    expect(c.take('u1', 'placeSearches', 5, 1, day1)).toBe(false);
    expect(c.take('u1', 'aiPlans', 2, 1, day1 + 86_400_000)).toBe(true); // next day
  });
});

describe('verifyIdToken', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const keys = new Map([['k1', { ...publicKey.export({ format: 'jwk' }), kid: 'k1' }]]);
  const now = Date.parse('2026-06-01T10:00:00Z');
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = (claims: object, kid = 'k1') => {
    const head = `${b64({ alg: 'RS256', kid })}.${b64(claims)}`;
    const sig = createSign('RSA-SHA256').update(head).sign(privateKey).toString('base64url');
    return `${head}.${sig}`;
  };
  const good = { aud: 'proj', iss: 'https://securetoken.google.com/proj', sub: 'uid1', email: 'a@b.com', iat: now / 1000 - 60, exp: now / 1000 + 3000 };

  it('accepts a valid token for the project', async () => {
    expect(await verifyIdToken(token(good), 'proj', { keys, now })).toMatchObject({ uid: 'uid1', email: 'a@b.com' });
  });
  it('rejects expired, other-project, unknown-key and tampered tokens', async () => {
    expect(await verifyIdToken(token({ ...good, exp: now / 1000 - 1 }), 'proj', { keys, now })).toBeNull();
    expect(await verifyIdToken(token({ ...good, aud: 'other' }), 'proj', { keys, now })).toBeNull();
    expect(await verifyIdToken(token(good, 'k2'), 'proj', { keys, now })).toBeNull();
    const [h, , s] = token(good).split('.');
    expect(await verifyIdToken(`${h}.${b64({ ...good, sub: 'someone-else' })}.${s}`, 'proj', { keys, now })).toBeNull();
    expect(await verifyIdToken('not-a-token', 'proj', { keys, now })).toBeNull();
  });
});

describe('plan texts', () => {
  it('are all translated', () => {
    const texts = OFFERED.flatMap(id => [PLANS[id].name, PLANS[id].price, PLANS[id].priceAlt, ...PLANS[id].features])
      .concat(PLANS.anonymous.name, 'AI plans today', 'Place searches today', 'Documents read today',
        "You've used today's AI plans on your plan.")
      .filter((s): s is string => Boolean(s));
    expect(texts.filter(s => !(s in PT))).toEqual([]);
  });
});
