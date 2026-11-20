// Writes public/safety/latest.json: the overland safety informer's data (see server/safety.ts), saved with the
// app so it still shows when the server can't reach the sources. The server refreshes it every 12 hours on its own.
//   NODE_USE_ENV_PROXY=1 node scripts/safety/build.ts
import { writeFileSync } from 'fs';
import { buildSafety } from '../../server/safety.ts';

const data = await buildSafety();
writeFileSync(new URL('../../public/safety/latest.json', import.meta.url), JSON.stringify(data));
const by = [1, 2, 3, 4].map(l => data.countries.filter(c => c.level === l).length);
console.log(`${data.countries.length} countries (levels 1–4: ${by.join(' / ')}), ${data.events.length} disaster alerts`);
