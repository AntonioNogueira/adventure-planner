import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

import Anthropic from '@anthropic-ai/sdk';

// Server-side AI planning endpoint (POST /api/plan).
// Runs inside the Vite dev/preview server so API keys never reach the browser bundle.
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
1. REALISM: Use realistic daily distances. Bikepacking 60-100 km/day, hiking 15-30 km/day, adventure motorcycling 200-400 km/day.
2. TERRAIN: Prioritize scenic secondary roads and off-road trails.
3. STOPS: For a trip of N days provide exactly N-1 intermediate waypoints (the overnight stop at the end of each day except the last).
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

async function planWithClaude(env: PlanEnv, prompt: string) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.beta.messages.create({
    model: env.CLAUDE_MODEL || 'claude-opus-5-5',
    max_tokens: 16000,
    // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: planJsonSchema },
    },
    messages: [{ role: 'user', content: prompt }],
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

async function planWithGemini(env: PlanEnv, prompt: string) {
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
          contents: prompt,
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

function providers(env: PlanEnv) {
  const list: { name: string; run: (prompt: string) => Promise<any> }[] = [];
  if (env.ANTHROPIC_API_KEY) list.push({ name: 'claude', run: p => planWithClaude(env, p) });
  if (env.GEMINI_API_KEY) list.push({ name: 'gemini', run: p => planWithGemini(env, p) });
  if (env.OPENAI_API_KEY) list.push({ name: 'openai', run: p => planWithOpenAI(env, p) });
  if (env.AI_PROVIDER) {
    const preferred = list.filter(p => p.name === env.AI_PROVIDER);
    return [...preferred, ...list.filter(p => p.name !== env.AI_PROVIDER)];
  }
  return list;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100_000) reject(new Error('Request too large'));
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

function createHandler(env: PlanEnv): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (req.url !== '/api/plan') return next();
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

    const available = providers(env);
    if (available.length === 0) {
      return sendJson(res, 503, {
        error: 'No AI provider configured. Add ANTHROPIC_API_KEY (or GEMINI_API_KEY / OPENAI_API_KEY) to .env.local and restart.',
      });
    }

    let request: string;
    let history: ChatMessage[];
    try {
      const body = JSON.parse(await readBody(req));
      request = String(body.prompt || '').trim().slice(0, 2000);
      history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    } catch {
      return sendJson(res, 400, { error: 'Invalid request body' });
    }
    if (!request) return sendJson(res, 400, { error: 'Prompt is required' });

    const prompt = buildPrompt(request, history);
    const failures: string[] = [];
    for (const provider of available) {
      try {
        const plan = await provider.run(prompt);
        return sendJson(res, 200, { provider: provider.name, plan });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[plan-api] ${provider.name} failed:`, message);
        failures.push(`${provider.name}: ${message.slice(0, 200)}`);
      }
    }
    sendJson(res, 502, { error: 'All AI providers failed', details: failures });
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
