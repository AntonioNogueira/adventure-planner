// Journeys sent by travellers with "Add your journey" on the Inspiration map.
//   POST /api/journey-chat     one turn of the chat that turns a link, a document or a description into a journey
//   POST /api/submit-journey   after the traveller saved it (Firestore submissions/{id}) and ticked the box: the first
//                              screening (a short report), then an email to the admin with a private review link
//   POST /api/screen-journey   admins: run the screening again from the review screen
// The routes live in plan-api.ts (they use its AI providers); prompts, checks, Firestore reads and the email are here.
import fs from 'fs';
import path from 'path';
import type { Caller } from './auth';

export interface SubmissionEnv {
  /** Resend (resend.com) API key for the admin email; without it, submissions wait in the review queue in the app. */
  RESEND_API_KEY?: string;
  /** Who gets "new journey to review" emails (comma-separated). */
  ADMIN_EMAIL?: string;
  /** Sender, e.g. "Munditrails <journeys@munditrails.com>"; default Resend's test sender (can only email the account owner). */
  EMAIL_FROM?: string;
  /** The app's public address for links in emails, e.g. https://adventure-planner-otj3.onrender.com (default: the request's host). */
  PUBLIC_URL?: string;
}

export interface ChatTurn { role: 'user' | 'assistant'; text: string }

export function buildJourneyChatPrompt(messages: ChatTurn[], draft: unknown, language: string, material: string): string {
  const talk = messages.slice(-14).map(m => `${m.role === 'user' ? 'Traveller' : 'You'}: ${m.text.slice(0, 3000)}`).join('\n');
  return `You help a traveller add a journey they made to a public map of inspiring adventures (overland trips by motorcycle,
bicycle, on foot, 4x4, etc.). They can share a link to their blog, send a document, or describe the route; you turn it
into a journey drawn on the map, and refine it with them turn by turn. The map shows them your latest version after each turn.

Conversation so far:
${talk || '(none)'}

Current version of the journey (JSON, empty if none yet):
${draft ? JSON.stringify(draft).slice(0, 20000) : '{}'}
${material ? '\nThe traveller just shared the attached material (a page or a document): read the journey from it.\n' : ''}
Answer with:
- reply: a short, friendly message (1-4 sentences) in the traveller's language (${language || 'the language they write in'}).
  Say what you drew and ask for the single most useful missing or doubtful thing (the order of places, where it started or
  ended, dates, the vehicle, a title, what happened at a stop). When the journey is complete enough, tell them to check
  it on the map and, if they're happy, tick the box and send it for review.
- ready: true when the journey has a title, who travelled, and at least 3 stops in travel order with findable places.
- journey: the full journey, keeping everything from the current version unless the traveller changed it:
  - title, who, when ("" if unknown), vehicle ("" if unknown), kind ("moto", "bike", "walk", "4x4" or "other"),
  - summary: 2-3 sentences in your own words,
  - sourceLabel: e.g. "Told by the traveller", or the blog's name,
  - stops in travel order (3 to 40): name (short label), place (a geocodable modern place with its country, e.g.
    "Khorog, Tajikistan"; for a road or region, the town in its middle), date ("" if unknown), by (how they got there
    from the previous stop: "ride", "walk", "truck", "bus", "train", "ferry", "boat" or "flight"; the first stop "ride"),
    text (1-3 sentences in your own words about that stop, from what the traveller said).
Only use what the traveller or their material says; never invent places, dates or events. If there is nothing to draw
yet, return an empty stops list and ask how they'd like to share the journey.`;
}

export function buildScreeningPrompt(sub: SubmissionData, checks: Check[]): string {
  return `You are the first screener for journeys that travellers send to a public map of inspiring adventures. An admin
makes the final decision; your job is a short, honest report to help them.

Journey as submitted (JSON):
${JSON.stringify(sub.journey).slice(0, 30000)}

What the traveller said in the chat that built it:
${(sub.messages || []).filter(m => m.role === 'user').map(m => `- ${m.text.slice(0, 1500)}`).join('\n').slice(0, 12000) || '(nothing)'}

Material they shared: ${(sub.materials || []).join('; ') || 'none'}
Automatic checks already done: ${checks.map(c => `${c.check}: ${c.result} (${c.note})`).join('; ')}

Check and report:
- plausibility: do the places, their order, the distances, the dates and the vehicle fit together (e.g. no 1,000 km a day by bicycle,
  no road where none exists, seasons that make sense)?
- consistency between the chat, the material and the journey;
- signs the text was written by an AI rather than the traveller (generic, polished phrases with no concrete personal detail);
- whether it seems to copy a famous published journey or claims to be someone else's trip;
- anything unsuitable for a public map (advertising, offensive content, personal data about other people, dangerous advice).
Answer with verdict ("looks genuine", "needs a closer look" or "doubtful"), aiWritten ("unlikely", "possible" or "likely"),
checks (3-7 items: check, result "ok"/"warning"/"problem", note in one sentence) and summary (2-3 sentences for the admin).`;
}

export const screeningJsonSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['looks genuine', 'needs a closer look', 'doubtful'] },
    aiWritten: { type: 'string', enum: ['unlikely', 'possible', 'likely'] },
    checks: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, result: { type: 'string', enum: ['ok', 'warning', 'problem'] }, note: { type: 'string' } }, required: ['check', 'result', 'note'], additionalProperties: false } },
    summary: { type: 'string' },
  },
  required: ['verdict', 'aiWritten', 'checks', 'summary'],
  additionalProperties: false,
};

export interface Check { check: string; result: 'ok' | 'warning' | 'problem'; note: string }
export interface ScreeningReport { verdict: string; aiWritten: string; checks: Check[]; summary: string; at: string; provider?: string }

export interface SubmissionData {
  journey: { title?: string; who?: string; stops?: { name: string; at?: [number, number]; date?: string }[]; legs?: { by: string; km: number }[]; km?: number; sources?: { label: string; url: string }[] };
  messages?: ChatTurn[];
  materials?: string[];
  acknowledged?: boolean;
  email?: string;
}
export interface Submission { id: string; createdBy: string; title: string; status: string; data: SubmissionData }

/** submissions/{id}, read with the caller's own token (Firestore rules: its author or an admin). */
export async function readSubmission(id: string, caller: Caller, projectId: string, databaseId: string): Promise<Submission | null> {
  if (!/^[\w-]{6,64}$/.test(id)) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents/submissions/${id}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${caller.token}` } });
  if (!res.ok) return null;
  const f = (await res.json()).fields || {};
  let data: SubmissionData;
  try { data = JSON.parse(f.data?.stringValue || '{}'); } catch { return null; }
  return { id, createdBy: f.createdBy?.stringValue || '', title: f.title?.stringValue || '', status: f.status?.stringValue || '', data };
}

/** Checks that need no AI: size, distance and pace, the source link, and whether the title is already on the map. */
export function automaticChecks(sub: SubmissionData, linkStatus: Record<string, boolean>): Check[] {
  const j = sub.journey || {};
  const stops = j.stops || [];
  const checks: Check[] = [];
  checks.push(stops.length >= 3
    ? { check: 'Stops', result: 'ok', note: `${stops.length} stops placed on the map.` }
    : { check: 'Stops', result: 'problem', note: `Only ${stops.length} stops.` });
  const km = Math.round(j.km || (j.legs || []).reduce((n, l) => n + (l.km || 0), 0));
  const longest = Math.max(0, ...(j.legs || []).map(l => (['ride', 'walk', 'truck', 'bus'].includes(l.by) ? l.km : 0)));
  checks.push({ check: 'Distance', result: longest > 3000 ? 'warning' : 'ok', note: `${km.toLocaleString('en')} km in all; longest overland leg ${Math.round(longest).toLocaleString('en')} km.` });
  for (const [url, ok] of Object.entries(linkStatus)) checks.push({ check: 'Source link', result: ok ? 'ok' : 'warning', note: `${url} ${ok ? 'opens' : 'could not be opened'}.` });
  if (!sub.acknowledged) checks.push({ check: 'Declaration', result: 'problem', note: 'The traveller did not tick the responsibility box.' });
  // Same title as a journey already on the map?
  try {
    const index = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'dist/inspiration/index.json'), 'utf8')) as { title: string }[];
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = norm(j.title || '');
    const twin = t.length > 5 && index.find(x => norm(x.title).includes(t) || t.includes(norm(x.title)));
    if (twin) checks.push({ check: 'Already on the map', result: 'warning', note: `The title looks like "${twin.title}".` });
  } catch { /* no index */ }
  return checks;
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** The "new journey to review" email: the report and a private link to the preview (admins only can open it). */
export async function emailAdmin(env: SubmissionEnv, sub: Submission, report: ScreeningReport, link: string): Promise<boolean> {
  const to = (env.ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(s => /^[^@\s]+@[^@\s]+$/.test(s));
  if (!env.RESEND_API_KEY || !to.length) return false;
  const j = sub.data.journey || {};
  const colour = { ok: '#15803d', warning: '#b45309', problem: '#b91c1c' } as const;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:600px">
<h2 style="margin:0 0 4px">${esc(sub.title)}</h2>
<p style="margin:0 0 12px;color:#555">${esc(j.who || '')} · ${(j.stops || []).length} stops · sent by ${esc(sub.data.email || sub.createdBy)}</p>
<p><b>First screening:</b> ${esc(report.verdict)} · AI-written: ${esc(report.aiWritten)}</p>
<p>${esc(report.summary)}</p>
<ul>${report.checks.map(c => `<li><b style="color:${colour[c.result] || '#333'}">${esc(c.result)}</b> ${esc(c.check)}: ${esc(c.note)}</li>`).join('')}</ul>
<p><a href="${esc(link)}" style="display:inline-block;background:#047857;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Open the preview and decide</a></p>
<p style="color:#888;font-size:12px">Only admins can open this link (log in with your admin account). Nothing is public until you publish it.</p></div>`;
  const text = `${sub.title}\n${report.verdict} · AI-written: ${report.aiWritten}\n${report.summary}\n\n${report.checks.map(c => `- ${c.result} ${c.check}: ${c.note}`).join('\n')}\n\nReview: ${link}`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM || 'Munditrails <onboarding@resend.dev>', to, subject: `Journey to review: ${sub.title}`, html, text }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) console.warn('[submissions] email failed', res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (err) {
    console.warn('[submissions] email failed', String(err));
    return false;
  }
}
