import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

import Anthropic from '@anthropic-ai/sdk';

// Server-side AI endpoints, run inside the Vite dev/preview server so API keys never reach the browser bundle:
//   POST /api/plan                 understand a trip request (start, finish, mode, days, places to pass)
//   POST /api/extract-reservation  read a booking PDF/email/image and return its details
// Overnight stops and place suggestions come from Google Maps/Places in the browser, not from the AI.
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

  return `You read trip requests for an adventure route planner (bikepacking, hiking, adventure motorcycling).
The app calculates the route and picks overnight towns itself with Google Maps; your job is only to understand the request.

PREVIOUS CONVERSATION:
${historyContext || '(none)'}

NEW REQUEST: "${request}"

Return:
- origin, destination: specific geocodable places, e.g. "Cádiz, Spain". If the user is changing an earlier plan, keep its start and finish unless they change them.
- travelMode: BICYCLING for bike trips, WALKING for hikes, DRIVING for motorcycle/car trips, TRANSIT only for public transport.
- days: number of days if the user gives one, otherwise 0.
- dailyKm: the daily distance if the user gives one (e.g. "about 60 km per day"), otherwise 0.
- route: places in travel order between origin and destination that the route must pass through.
  Include a place only if the user names it, or if the requested style needs it (e.g. "along the coast": 1-3 coastal towns that keep the route on the coast).
  Every place must lie between the origin and destination in the direction of travel; never add detours.
  Set overnight=true only if the user wants to sleep there. Leave the list empty if nothing is needed.
- lodging: "camping" if they want to camp, "hostel" or "hotel" if they say so, otherwise "any".
- summary: 1-2 sentences describing the trip (terrain, style, highlights). Don't invent distances.`;
}

const intentFields = ['origin', 'destination', 'travelMode', 'days', 'dailyKm', 'route', 'lodging', 'summary'];
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    origin: { type: Type.STRING },
    destination: { type: Type.STRING },
    travelMode: { type: Type.STRING, enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'] },
    days: { type: Type.INTEGER },
    dailyKm: { type: Type.INTEGER },
    route: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { place: { type: Type.STRING }, overnight: { type: Type.BOOLEAN } },
        required: ['place', 'overnight'],
      },
    },
    lodging: { type: Type.STRING, enum: ['any', 'camping', 'hostel', 'hotel'] },
    summary: { type: Type.STRING },
  },
  required: intentFields,
};

// Plain-text description of the same shape, for providers without schema support.
const jsonShapeHint = `Respond with ONLY a JSON object of this shape:
{
  "origin": string,
  "destination": string,
  "travelMode": "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT",
  "days": number,
  "dailyKm": number,
  "route": [{ "place": string, "overnight": boolean }],
  "lodging": "any" | "camping" | "hostel" | "hotel",
  "summary": string
}`;

// Plain JSON Schema for Claude structured outputs (every object closed with additionalProperties: false).
const planJsonSchema = {
  type: 'object',
  properties: {
    origin: { type: 'string' },
    destination: { type: 'string' },
    travelMode: { type: 'string', enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'] },
    days: { type: 'integer' },
    dailyKm: { type: 'integer' },
    route: {
      type: 'array',
      items: {
        type: 'object',
        properties: { place: { type: 'string' }, overnight: { type: 'boolean' } },
        required: ['place', 'overnight'],
        additionalProperties: false,
      },
    },
    lodging: { type: 'string', enum: ['any', 'camping', 'hostel', 'hotel'] },
    summary: { type: 'string' },
  },
  required: intentFields,
  additionalProperties: false,
};

// ---- Usage log: one line per AI call plus running totals, printed in the terminal ----
const usage = { calls: 0, failed: 0, inputTokens: 0, outputTokens: 0 };

function logUsage(task: string, model: string, started: number, result: { input?: number; output?: number; error?: string }) {
  usage.calls++;
  if (result.error) usage.failed++;
  usage.inputTokens += result.input || 0;
  usage.outputTokens += result.output || 0;
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const outcome = result.error ? `FAILED ${result.error}` : `ok, tokens ${result.input ?? '?'} in / ${result.output ?? '?'} out`;
  console.log(`[ai] ${task} · ${model} · ${seconds}s · ${outcome}`);
  console.log(`[ai] session total: ${usage.calls} calls (${usage.failed} failed), ${usage.inputTokens} in / ${usage.outputTokens} out tokens`);
}

// A file sent by the browser (base64), already split into what each provider accepts.
interface UploadedFile {
  mimeType: string;
  data: string;   // base64, for PDFs and images
  text?: string;  // decoded text, for emails and text files
}

async function runClaude(env: PlanEnv, task: string, prompt: string, schema: Record<string, unknown>, file?: UploadedFile) {
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

  const model = env.CLAUDE_MODEL || 'claude-opus-5-5';
  const started = Date.now();
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema },
    },
    messages: [{ role: 'user', content }],
  }).catch(err => {
    logUsage(task, model, started, { error: err instanceof Error ? err.message.slice(0, 80) : String(err) });
    throw err;
  });
  logUsage(task, model, started, { input: response.usage.input_tokens, output: response.usage.output_tokens });

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

async function runGemini(env: PlanEnv, task: string, prompt: string, responseSchema: object, file?: UploadedFile) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const models = [...new Set([
    env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    env.GEMINI_FALLBACK_MODEL || 'gemini-flash-latest',
  ])];

  let lastError: unknown;
  for (const model of models) {
    for (const delay of [0, 3000]) {
      if (delay) await sleep(delay);
      const started = Date.now();
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
        logUsage(task, model, started, {
          input: response.usageMetadata?.promptTokenCount,
          output: (response.usageMetadata?.candidatesTokenCount || 0) + (response.usageMetadata?.thoughtsTokenCount || 0),
        });
        if (!response.text) throw new Error('Empty response from Gemini');
        return JSON.parse(response.text);
      } catch (err) {
        lastError = err;
        if (err instanceof ApiError) logUsage(task, model, started, { error: `${err.status}${GEMINI_RETRYABLE.has(err.status) ? ' (busy, will retry)' : ''}` });
        if (!(err instanceof ApiError && GEMINI_RETRYABLE.has(err.status))) throw err;
      }
    }
  }
  throw lastError;
}

// OpenAI is only used for trip planning (text in, JSON out).
async function planWithOpenAI(env: PlanEnv, prompt: string) {
  const model = env.OPENAI_MODEL || 'gpt-4.1-mini';
  const started = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: jsonShapeHint },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  logUsage('plan', model, started, { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');
  return JSON.parse(text);
}

interface AiTask {
  /** Short name for the usage log. */
  name: string;
  prompt: string;
  geminiSchema: object;
  claudeSchema: Record<string, unknown>;
  file?: UploadedFile;
  /** Only plain trip planning can use OpenAI's JSON mode. */
  allowOpenAI?: boolean;
}

function providers(env: PlanEnv, task: AiTask) {
  const list: { name: string; run: () => Promise<any> }[] = [];
  if (env.ANTHROPIC_API_KEY) list.push({ name: 'claude', run: () => runClaude(env, task.name, task.prompt, task.claudeSchema, task.file) });
  if (env.GEMINI_API_KEY) list.push({ name: 'gemini', run: () => runGemini(env, task.name, task.prompt, task.geminiSchema, task.file) });
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

// One line showing what the AI understood, so odd routes are easy to trace in the terminal.
function describeIntent(intent: any) {
  const via = (intent.route || []).map((r: any) => `${r.place}${r.overnight ? ' (night)' : ''}`).join(' → ');
  return `${intent.origin} → ${via ? via + ' → ' : ''}${intent.destination} · ${intent.travelMode}`
    + `${intent.days ? ` · ${intent.days} days` : ''}${intent.dailyKm ? ` · ${intent.dailyKm} km/day` : ''} · lodging ${intent.lodging}`;
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
      if (key === 'plan') console.log(`[ai] understood: ${describeIntent(result)}`);
      return sendJson(res, 200, { provider: provider.name, [key]: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[plan-api] ${provider.name} failed:`, message);
      failures.push(`${provider.name}: ${message.slice(0, 200)}`);
    }
  }
  sendJson(res, 502, { error: 'All AI providers failed', details: failures });
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
    const routes = ['/api/plan', '/api/extract-reservation'];
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
        name: 'plan',
        prompt: buildPrompt(request, history),
        geminiSchema: responseSchema,
        claudeSchema: planJsonSchema,
        allowOpenAI: true,
      }, res, 'plan');
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
      name: `reservation (${fileName})`,
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
