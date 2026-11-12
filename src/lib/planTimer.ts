// How long each stage of the last plan took (AI, finding places, first route, elevation, places to stay, villages,
// final route), so a slow plan shows where the time went: in the console and in the map services check.

export interface Stage { label: string; ms: number }
let stages: Stage[] = [];
let startedAt = 0;
let last = 0;

/** A new plan starts (clears the previous one's stages). */
export function startPlan() { stages = []; startedAt = last = Date.now(); }

/** The stage that just finished. */
export function stageDone(label: string) {
  const now = Date.now();
  if (!startedAt) startedAt = last = now;
  stages.push({ label, ms: now - last });
  last = now;
  console.info(`[plan] ${label}: ${((now - stages[stages.length - 1].ms - startedAt) / 1000).toFixed(1)}–${((now - startedAt) / 1000).toFixed(1)} s`);
}

/** The last plan's stages and total time. */
export function lastPlan(): { stages: Stage[]; totalMs: number } {
  return { stages: [...stages], totalMs: stages.reduce((n, s) => n + s.ms, 0) };
}
