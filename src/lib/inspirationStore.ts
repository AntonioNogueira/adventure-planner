// Journeys published with the import tool live in Firestore (collection "inspiration", readable by everyone, written
// only by admins: see firestore.rules). Each document keeps the journey as JSON text (Firestore can't store the
// nested coordinate lists directly).
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { unwrapJourney, unwrapLine, type Journey, type JourneySummary } from './inspiration';
import { simplify } from './journeyBuild';

/** Admins are marked by a document admins/{uid}, created by hand in the Firebase console. */
export async function checkAdmin(uid: string): Promise<boolean> {
  try { return (await getDoc(doc(db, 'admins', uid))).exists(); } catch { return false; }
}

export function summarize(j: Journey): JourneySummary {
  const { stops, legs, imported: _i, ...meta } = j;
  return { ...meta, stopCount: stops.length, cover: stops.find(s => s.photo)?.photo || null, overview: unwrapLine(simplify(legs.flatMap(l => l.line), 0.3)) };
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
