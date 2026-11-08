// Who is calling: verifies a Firebase Authentication ID token (sent as "Authorization: Bearer <token>")
// with Google's public keys, so no service-account secret is needed. Also reads the caller's plan from
// their Firestore user document, with their own token (the security rules let users read only their own).
import { createPublicKey, createVerify, JsonWebKey } from 'crypto';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export interface Caller { uid: string; email?: string; token: string }

let keys: { at: number; maxAge: number; byKid: Map<string, JsonWebKey> } | null = null;

async function publicKeys(fetchImpl: typeof fetch): Promise<Map<string, JsonWebKey>> {
  if (keys && Date.now() - keys.at < keys.maxAge) return keys.byKid;
  const res = await fetchImpl(JWKS_URL);
  if (!res.ok) throw new Error(`Google keys ${res.status}`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600) * 1000;
  const body = await res.json() as { keys: (JsonWebKey & { kid: string })[] };
  keys = { at: Date.now(), maxAge, byKid: new Map(body.keys.map(k => [k.kid, k])) };
  return keys.byKid;
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/** The caller of a verified token, or null (missing, expired, wrong project or bad signature). */
export async function verifyIdToken(
  token: string, projectId: string,
  opts: { fetchImpl?: typeof fetch; keys?: Map<string, JsonWebKey>; now?: number } = {},
): Promise<Caller | null> {
  try {
    const [h, p, sig] = token.split('.');
    if (!h || !p || !sig) return null;
    const header = JSON.parse(b64url(h).toString('utf8'));
    const claims = JSON.parse(b64url(p).toString('utf8'));
    if (header.alg !== 'RS256' || !header.kid) return null;
    const jwk = (opts.keys || await publicKeys(opts.fetchImpl || fetch)).get(header.kid);
    if (!jwk) return null;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${h}.${p}`);
    if (!verifier.verify(createPublicKey({ key: jwk, format: 'jwk' }), b64url(sig))) return null;
    const now = Math.floor((opts.now ?? Date.now()) / 1000);
    if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!claims.sub || claims.exp < now || claims.iat > now + 300) return null;
    return { uid: claims.sub, email: claims.email, token };
  } catch {
    return null;
  }
}

/** The caller's users/{uid} document fields we need (plan, planUntil), or null. Cached for 5 minutes. */
const planCache = new Map<string, { at: number; record: { plan?: string; planUntil?: string } | null }>();

export async function readPlanRecord(caller: Caller, projectId: string, databaseId: string, fetchImpl: typeof fetch = fetch) {
  const hit = planCache.get(caller.uid);
  if (hit && Date.now() - hit.at < 300_000) return hit.record;
  let record: { plan?: string; planUntil?: string } | null = null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents/users/${caller.uid}`;
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${caller.token}` } });
    if (res.ok) {
      const fields = (await res.json()).fields || {};
      record = {
        plan: fields.plan?.stringValue,
        planUntil: fields.planUntil?.timestampValue || fields.planUntil?.stringValue,
      };
    }
  } catch { /* no record: Free */ }
  planCache.set(caller.uid, { at: Date.now(), record });
  return record;
}
