import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

import Anthropic from '@anthropic-ai/sdk';

// Server-side AI endpoints, run inside the Vite dev/preview server so API keys never reach the browser bundle:
//   POST /api/plan                 plan a trip from a chat request
//   POST /api/recommendations      places to stay/eat/etc. near one location (after a stop is moved)
//   POST /api/extract-reservation  read a booking PDF/email/image and return its details
// Provider order: Claude (ANTHROPIC_API_KEY), then Gemini (GEMINI_API_KEY), then OpenAI (OPENAI_API_KEY).

interface PlanEnv {
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  AI_PROVIDER?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const CATEGORIES = ['Accommodations', 'Restaurants/Cafes', 'Bike/Moto Shops', 'Points of Interest'];

function buildPrompt(request: string, history: ChatMessage[]) {
  const historyContext = history
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  return `You are an expert adventure travel planner specializing in bikepacking, adventure motorcycling, hiking and off-road expeditions.

PREVIOUS CONVERSATION CONTEXT:
${historyContext || '(none)'}

NEW REQUEST: "${request}"

CRITICAL GUIDELINES:
1. DAILY DISTANCE (most important): plan each day by the real road/trail distance, not the straight line, which is often 20-40% shorter.
   - Bikepacking (loaded bike): 50-80 km/day, never more than 90 km. Hilly terrain: aim for the low end.
   - Hiking: 15-25 km/day, never more than 30 km.
   - Adventure motorcycling: 200-350 km/day, never more than 450 km.
   - If the user states a daily distance, use it instead.
   Before answering, estimate the route distance between each pair of consecutive stops and check every day against these limits.
2. TERRAIN: Prioritize scenic secondary roads and off-road trails.
3. STOPS: Each waypoint is the overnight stop at the end of a day (except the last day, which ends at the finish).
   - If the user gives a number of days N, provide exactly N-1 waypoints.
   - If not, choose the number of days from the total distance and the daily limits above.
   - Overnight stops must be towns or villages with somewhere to sleep.
   - Never more than 20 waypoints.
4. RECOMMENDATIONS: For the START, the FINISH and EACH STOP provide exactly 4 categories (${CATEGORIES.map(c => `"${c}"`).join(', ')}) with 3 specific, real places per category, each with a one-line description.
5. CONTINUITY: If the user is refining a previous plan, keep the core route and apply the requested changes.
6. GEOLOCATION: Every origin, destination and waypoint must be a specific geocodable name such as "Moab, Utah" or "Porto, Portugal". Never use placeholders like "Home" or "My location".
7. TRAVEL MODE: BICYCLING for bike trips, WALKING for hikes, DRIVING for motorcycle/car trips. Avoid TRANSIT when there are intermediate waypoints.`;
}

const interestsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ['name'],
        },
      },
    },
    required: ['category', 'items'],
  },
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    origin: { type: Type.STRING },
    originInterests: interestsSchema,
    destination: { type: Type.STRING },
    destinationInterests: interestsSchema,
    waypoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          interests: interestsSchema,
        },
        required: ['location', 'interests'],
      },
    },
    travelMode: { type: Type.STRING, enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'] },
    adventureSummary: {
      type: Type.STRING,
      description: 'A brief summary of the adventure, including estimated days and terrain type.',
    },
  },
  required: [
    'origin', 'originInterests',
    'destination', 'destinationInterests',
    'waypoints', 'travelMode', 'adventureSummary',
  ],
};

// Plain-text description of the same shape, for providers without schema support.
const jsonShapeHint = `Respond with ONLY a JSON object of this shape:
{
  "origin": string,
  "originInterests": [{ "category": string, "items": [{ "name": string, "description": string }] }],
  "destination": string,
  "destinationInterests": [ ...same as originInterests ],
  "waypoints": [{ "location": string, "interests": [ ...same as originInterests ] }],
  "travelMode": "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT",
  "adventureSummary": string
}`;

// Plain JSON Schema for Claude structured outputs (every object closed with additionalProperties: false).
const interestsJsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      category: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, description: { type: 'string' } },
          required: ['name', 'description'],
          additionalProperties: false,
        },
      },
    },
    required: ['category', 'items'],
    additionalProperties: false,
  },
};

const planJsonSchema = {
  type: 'object',
  properties: {
    origin: { type: 'string' },
    originInterests: interestsJsonSchema,
    destination: { type: 'string' },
    destinationInterests: interestsJsonSchema,
    waypoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: { location: { type: 'string' }, interests: interestsJsonSchema },
        required: ['location', 'interests'],
        additionalProperties: false,
      },
    },
    travelMode: { type: 'string', enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'] },
    adventureSummary: { type: 'string' },
  },
  required: [
    'origin', 'originInterests',
    'destination', 'destinationInterests',
    'waypoints', 'travelMode', 'adventureSummary',
  ],
  additionalProperties: false,
};

// A file sent by the browser (base64), already split into what each provider accepts.
interface UploadedFile {
  mimeType: string;
  data: string;   // base64, for PDFs and images
  text?: string;  // decoded text, for emails and text files
}

async function runClaude(env: PlanEnv, prompt: string, schema: Record<string, unknown>, file?: UploadedFile) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const content: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
  if (file?.text) {
    content.push({ type: 'text', text: `ATTACHED FILE CONTENT:\n${file.text}` });
  } else if (file?.mimeType === 'application/pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
  } else if (file) {
    content.push({ type: 'image', source: { type: 'base64', media_type: file.mimeType as 'image/png', data: file.data } });
  }
  content.push({ type: 'text', text: prompt });

  const response = await client.beta.messages.create({
    model: env.CLAUDE_MODEL || 'claude-opus-5-5',
    max_tokens: 16000,
    // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema },
    },
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude declined the request${response.stop_details?.category ? ` (${response.stop_details.category})` : ''}`);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Claude ran out of output tokens; try a shorter trip or fewer stops');
  }
  const text = response.content.flatMap(block => (block.type === 'text' ? [block.text] : [])).join('');
  if (!text) throw new Error('Empty response from Claude');
  return JSON.parse(text);
}

// Free-tier Gemini often returns 503 (overloaded) or 429 (rate limit) for a few seconds.
// Retry briefly, then fall back to the other model, before giving up.
// Flash-Lite is the default: ~10-20 s per plan versus 30 s to several minutes for Flash when it's busy.
const GEMINI_RETRYABLE = new Set([429, 500, 503]);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runGemini(env: PlanEnv, prompt: string, responseSchema: object, file?: UploadedFile) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const models = [...new Set([
    env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    env.GEMINI_FALLBACK_MODEL || 'gemini-flash-latest',
  ])];

  let lastError: unknown;
  for (const model of models) {
    for (const delay of [0, 3000]) {
      if (delay) await sleep(delay);
      try {
        const response = await ai.models.generateContent({
          model,
          contents: file
            ? [{ role: 'user', parts: [
                file.text ? { text: `ATTACHED FILE CONTENT:\n${file.text}` } : { inlineData: { mimeType: file.mimeType, data: file.data } },
                { text: prompt },
              ] }]
            : prompt,
          // Low thinking keeps responses fast enough for an interactive planner.
          config: { responseMimeType: 'application/json', responseSchema, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
        });
        if (!response.text) throw new Error('Empty response from Gemini');
        return JSON.parse(response.text);
      } catch (err) {
        lastError = err;
        if (!(err instanceof ApiError && GEMINI_RETRYABLE.has(err.status))) throw err;
        console.warn(`[plan-api] ${model} returned ${err.status}, retrying`);
      }
    }
  }
  throw lastError;
}

// OpenAI is only used for trip planning (text in, JSON out).
async function planWithOpenAI(env: PlanEnv, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: jsonShapeHint },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');
  return JSON.parse(text);
}

interface AiTask {
  prompt: string;
  geminiSchema: object;
  claudeSchema: Record<string, unknown>;
  file?: UploadedFile;
  /** Only plain trip planning can use OpenAI's JSON mode. */
  allowOpenAI?: boolean;
}

function providers(env: PlanEnv, task: AiTask) {
  const list: { name: string; run: () => Promise<any> }[] = [];
  if (env.ANTHROPIC_API_KEY) list.push({ name: 'claude', run: () => runClaude(env, task.prompt, task.claudeSchema, task.file) });
  if (env.GEMINI_API_KEY) list.push({ name: 'gemini', run: () => runGemini(env, task.prompt, task.geminiSchema, task.file) });
  if (env.OPENAI_API_KEY && task.allowOpenAI) list.push({ name: 'openai', run: () => planWithOpenAI(env, task.prompt) });
  if (env.AI_PROVIDER) {
    const preferred = list.filter(p => p.name === env.AI_PROVIDER);
    return [...preferred, ...list.filter(p => p.name !== env.AI_PROVIDER)];
  }
  return list;
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > limit) reject(new Error('Request too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function runTask(env: PlanEnv, task: AiTask, res: ServerResponse, key: string) {
  const available = providers(env, task);
  if (available.length === 0) {
    return sendJson(res, 503, {
      error: 'No AI provider configured. Add GEMINI_API_KEY (or ANTHROPIC_API_KEY) to .env.local and restart.',
    });
  }
  const failures: string[] = [];
  for (const provider of available) {
    try {
      const result = await provider.run();
      return sendJson(res, 200, { provider: provider.name, [key]: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[plan-api] ${provider.name} failed:`, message);
      failures.push(`${provider.name}: ${message.slice(0, 200)}`);
    }
  }
  sendJson(res, 502, { error: 'All AI providers failed', details: failures });
}

const recommendationsGeminiSchema = {
  type: Type.OBJECT,
  properties: { interests: interestsSchema },
  required: ['interests'],
};
const recommendationsJsonSchema = {
  type: 'object',
  properties: { interests: interestsJsonSchema },
  required: ['interests'],
  additionalProperties: false,
};

function buildRecommendationsPrompt(location: string, travelMode: string) {
  return `You are an expert adventure travel planner. A traveller (travel mode: ${travelMode}) is stopping overnight in "${location}".
Provide exactly 4 categories (${CATEGORIES.map(c => `"${c}"`).join(', ')}) with 3 specific, real places per category in or very near ${location}, each with a one-line description.`;
}

const reservationFields = ['category', 'name', 'address', 'checkIn', 'checkOut', 'confirmation', 'notes', 'stopIndex'] as const;
const reservationGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, enum: CATEGORIES },
    name: { type: Type.STRING, description: 'Name of the hotel, campsite, restaurant, shop or attraction' },
    address: { type: Type.STRING, description: 'Full street address including town and country, or the town if no address is given' },
    checkIn: { type: Type.STRING, description: 'Check-in / reservation date and time, as written, or empty' },
    checkOut: { type: Type.STRING, description: 'Check-out date, or empty' },
    confirmation: { type: Type.STRING, description: 'Booking reference / confirmation number, or empty' },
    notes: { type: Type.STRING, description: 'One short line: room/table type, guests, price or other key detail' },
    stopIndex: { type: Type.INTEGER, description: 'Index of the trip stop this booking belongs to' },
  },
  required: [...reservationFields],
};
const reservationJsonSchema = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    name: { type: 'string' },
    address: { type: 'string' },
    checkIn: { type: 'string' },
    checkOut: { type: 'string' },
    confirmation: { type: 'string' },
    notes: { type: 'string' },
    stopIndex: { type: 'integer' },
  },
  required: [...reservationFields],
  additionalProperties: false,
};

function buildReservationPrompt(fileName: string, stops: string[]) {
  return `The attached file ("${fileName}") is a booking or reservation for a trip (for example a hotel, hostel or campsite confirmation, a restaurant reservation, a bike rental or a tour ticket).
Extract the booking details. Use empty strings for anything that is not in the file.

Choose "category":
- "Accommodations" for hotels, hostels, campsites, apartments and other places to sleep
- "Restaurants/Cafes" for food and drink
- "Bike/Moto Shops" for rentals, repairs and gear
- "Points of Interest" for tours, tickets and attractions

The trip stops are:
${stops.map((stop, i) => `${i}: ${stop}`).join('\n')}
Set "stopIndex" to the stop the booking is in or nearest to.`;
}

// Emails and text files are sent as text; long base64 blocks (attachments, images) are dropped.
function decodeTextFile(base64: string) {
  const raw = Buffer.from(base64, 'base64').toString('utf8');
  return raw
    .replace(/(?:^[A-Za-z0-9+/=]{60,}\r?\n?){3,}/gm, '[binary data removed]\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .slice(0, 60_000);
}

const SUPPORTED_BINARY = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function createHandler(env: PlanEnv): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const routes = ['/api/plan', '/api/recommendations', '/api/extract-reservation'];
    if (!req.url || !routes.includes(req.url)) return next();
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

    let body: any;
    try {
      body = JSON.parse(await readBody(req, req.url === '/api/extract-reservation' ? 15_000_000 : 100_000));
    } catch {
      return sendJson(res, 400, { error: 'Invalid or too large request body' });
    }

    if (req.url === '/api/plan') {
      const request = String(body.prompt || '').trim().slice(0, 4000);
      const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-10) : [];
      if (!request) return sendJson(res, 400, { error: 'Prompt is required' });
      return runTask(env, {
        prompt: buildPrompt(request, history),
        geminiSchema: responseSchema,
        claudeSchema: planJsonSchema,
        allowOpenAI: true,
      }, res, 'plan');
    }

    if (req.url === '/api/recommendations') {
      const location = String(body.location || '').trim().slice(0, 300);
      if (!location) return sendJson(res, 400, { error: 'Location is required' });
      return runTask(env, {
        prompt: buildRecommendationsPrompt(location, String(body.travelMode || 'DRIVING')),
        geminiSchema: recommendationsGeminiSchema,
        claudeSchema: recommendationsJsonSchema,
      }, res, 'recommendations');
    }

    // /api/extract-reservation
    const fileName = String(body.fileName || 'file').slice(0, 200);
    const mimeType = String(body.mimeType || '').toLowerCase();
    const data = String(body.data || '');
    const stops: string[] = Array.isArray(body.stops) ? body.stops.map(String).slice(0, 30) : [];
    if (!data) return sendJson(res, 400, { error: 'File is required' });

    const isText = mimeType.startsWith('text/') || mimeType === 'message/rfc822' || /\.(eml|txt|html?)$/i.test(fileName);
    if (!isText && !SUPPORTED_BINARY.has(mimeType)) {
      return sendJson(res, 415, { error: 'Unsupported file. Use a PDF, an email saved as .eml, a text file or an image (PNG/JPG).' });
    }
    return runTask(env, {
      prompt: buildReservationPrompt(fileName, stops),
      geminiSchema: reservationGeminiSchema,
      claudeSchema: reservationJsonSchema,
      file: isText ? { mimeType: 'text/plain', data, text: decodeTextFile(data) } : { mimeType, data },
    }, res, 'reservation');
  };
}

export function planApi(env: PlanEnv): Plugin {
  const handler = createHandler(env);
  return {
    name: 'adventure-plan-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
