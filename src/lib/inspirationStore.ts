// Journeys published with the import tool live in Firestore (collection "inspiration", readable by everyone, written
// only by admins: see firestore.rules). Each document keeps the journey as JSON text (Firestore can't store the
// nested coordinate lists directly).
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { landPieces, unwrapJourney, unwrapLine, type Journey, type JourneySummary } from './inspiration';
import { simplify } from './journeyBuild';

/** Admins are marked by a document admins/{uid}, created by hand in the Firebase console. */
export async function checkAdmin(uid: string): Promise<boolean> {
  try { return (await getDoc(doc(db, 'admins', uid))).exists(); } catch { return false; }
}

export function summarize(j: Journey): JourneySummary {
  const { stops, legs, imported: _i, ...meta } = j;
  return { ...meta, stopCount: stops.length, cover: stops.find(s => s.photo)?.photo || null, overview: landPieces(legs).map(p => unwrapLine(simplify(p, 0.3))) };
}

/** Published journeys, newest first (none if Firestore can't be reached). */
export async function loadPublished(): Promise<Journey[]> {
  try {
    const snap = await getDocs(collection(db, 'inspiration'));
    return snap.docs
      .map(d => { try { return unwrapJourney({ ...JSON.parse(String(d.data().data)), id: d.id, imported: true } as Journey); } catch { return null; } })
      .filter((j): j is Journey => j !== null)
      .sort((a, b) => b.id.localeCompare(a.id));
  } catch { return []; }
}

export async function publishJourney(j: Journey, uid: string): Promise<void> {
  const { imported: _i, ...data } = j;
  await setDoc(doc(db, 'inspiration', j.id), { title: j.title, createdBy: uid, createdAt: Date.now(), data: JSON.stringify(data) });
}

export async function unpublishJourney(id: string): Promise<void> {
  await deleteDoc(doc(db, 'inspiration', id));
}

// ---- Journeys sent by travellers ("Add your journey"): collection "submissions", see firestore.rules ----
export interface ChatTurn { role: 'user' | 'assistant'; text: string }
export interface SubmissionReport { verdict: string; aiWritten: string; checks: { check: string; result: string; note: string }[]; summary: string; at: string }
export interface Submission {
  id: string; title: string; createdBy: string; createdAt: number; status: 'pending' | 'published' | 'rejected';
  journey: Journey; messages: ChatTurn[]; materials: string[]; email?: string;
}

/** Saves the journey for review (after the traveller ticked the box); returns its id. */
export async function saveSubmission(j: Journey, messages: ChatTurn[], materials: string[], uid: string, email?: string): Promise<string> {
  const { imported: _i, ...journey } = j;
  const ref = await addDoc(collection(db, 'submissions'), {
    title: j.title.slice(0, 190), createdBy: uid, createdAt: Date.now(), status: 'pending', acknowledged: true,
    data: JSON.stringify({ journey, messages: messages.slice(-30), materials, acknowledged: true, email }),
  });
  return ref.id;
}

function toSubmission(id: string, d: Record<string, unknown>): Submission | null {
  try {
    const data = JSON.parse(String(d.data));
    return {
      id, title: String(d.title || ''), createdBy: String(d.createdBy || ''), createdAt: Number(d.createdAt || 0),
      status: (d.status as Submission['status']) || 'pending', journey: unwrapJourney({ ...data.journey, id: `sub-${id}` } as Journey),
      messages: data.messages || [], materials: data.materials || [], email: data.email,
    };
  } catch { return null; }
}

export async function loadSubmission(id: string): Promise<Submission | null> {
  const snap = await getDoc(doc(db, 'submissions', id));
  return snap.exists() ? toSubmission(snap.id, snap.data()) : null;
}

/** Admins: journeys waiting for a decision, oldest first. */
export async function loadPendingSubmissions(): Promise<Submission[]> {
  try {
    const snap = await getDocs(query(collection(db, 'submissions'), where('status', '==', 'pending')));
    return snap.docs.map(d => toSubmission(d.id, d.data())).filter((x): x is Submission => x !== null).sort((a, b) => a.createdAt - b.createdAt);
  } catch { return []; }
}

export async function setSubmissionStatus(id: string, status: 'published' | 'rejected', uid: string): Promise<void> {
  await updateDoc(doc(db, 'submissions', id), { status, reviewedAt: Date.now(), reviewedBy: uid });
}
