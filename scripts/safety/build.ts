// Writes public/safety/latest.json: the overland safety informer's data (see server/safety.ts), saved with the app
// so it still shows when the server can't reach the sources. The server refreshes it on its own (incidents and
// hazards every 3 hours, advice every 12); this copy is only the fallback and the seed for the advice areas.
//   NODE_USE_ENV_PROXY=1 node scripts/safety/build.ts        (reads GEMINI_API_KEY from the environment or .env.local)
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { areasGeminiSchema, areasPrompt, buildSafety, type AreaReader, type SafetyData } from '../../server/safety.ts';

const file = new URL('../../public/safety/latest.json', import.meta.url);
const local = existsSync('.env.local') ? Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').map(l => l.match(/^(\w+)=(.*)$/)).filter(Boolean).map(m => [m![1], m![2].trim()])) : {};
const key = process.env.GEMINI_API_KEY || local.GEMINI_API_KEY;
const readAreas: AreaReader | undefined = key ? async (country, text) => {
  const ai = new GoogleGenAI({ apiKey: key });
  const res = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || local.GEMINI_MODEL || 'gemini-flash-lite-latest',
    contents: areasPrompt(country, text),
    config: { responseMimeType: 'application/json', responseSchema: areasGeminiSchema },
  });
  const areas = JSON.parse(res.text || '{}').areas;
  return Array.isArray(areas) ? areas : [];
} : undefined;

let previous: SafetyData | null = null;
try { previous = JSON.parse(readFileSync(file, 'utf8')); if (!previous?.areas) previous = null; } catch { /* first run */ }
const data = await buildSafety({ readAreas, previous, adviceToo: true });
writeFileSync(file, JSON.stringify(data));
const shown = data.countries.filter(c => (c.level >= 2 || c.recent) && !c.areas).length;
console.log(`${data.countries.length} countries (${shown} country pins), ${data.areas.length} advice areas, ${data.incidents.length} incidents, ${data.events.length} hazards`);
