import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { AIPlanParams, RouteLeg } from '../types';

interface AIAgentProps {
  initialPrompt?: string;
  /** Shows the plan on the map and resolves with the real route legs (null if routing failed). */
  onPlanRoute: (params: AIPlanParams) => Promise<RouteLeg[] | null>;
}

// Longest comfortable day per travel mode, in km. The AI can't measure road distances,
// so the app checks the real route and asks it to fix any day that's longer than this.
const DAILY_MAX_KM: Record<string, number> = { BICYCLING: 90, WALKING: 30, DRIVING: 450 };
const MAX_CORRECTIONS = 2;
// Days up to 10% over the limit are accepted: a few km over isn't worth another AI round trip.
const TOLERANCE = 1.1;

// Honour a limit written in the request, e.g. "70 km per day" or "max 60km/day".
function dailyLimitFromText(text: string): number | null {
  const match = text.match(/(\d{2,3})\s*km\s*(?:\/|per|a|each|por|ao)\s*(?:day|dia)/i);
  return match ? Number(match[1]) : null;
}

function toPlanParams(result: any): AIPlanParams {
  return {
    origin: result.origin || "",
    originInterests: result.originInterests || [],
    destination: result.destination || "",
    destinationInterests: result.destinationInterests || [],
    waypoints: (result.waypoints || []).map((w: any) => ({
      location: w.location || "",
      interests: w.interests || []
    })),
    travelMode: result.travelMode || "DRIVING",
    summary: result.adventureSummary || ""
  };
}

async function requestPlan(prompt: string, history: Message[]) {
  // The AI call runs server-side (server/plan-api.ts) so API keys are never exposed to the browser.
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Show the first provider's reason (e.g. quota or billing) so setup problems are visible.
    const detail = Array.isArray(data.details) && data.details[0] ? ` ${String(data.details[0]).slice(0, 180)}` : '';
    throw new Error(`${data.error || `Planner request failed (${response.status})`}.${detail}`);
  }
  return data.plan;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  /** Sent to the AI as context but not shown in the chat (automatic distance corrections). */
  hidden?: boolean;
}

const AIAgent: React.FC<AIAgentProps> = ({ onPlanRoute, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isPlanning, setIsPlanning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoPlanned = useRef(false);

  const placeholders = [
    "e.g., Bikepacking from Paris to Rome, about 80 km per day...",
    "e.g., 5-day moto adventure in the Pyrenees, include off-road trails",
    "e.g., Hiking the West Highland Way, suggest wild camping spots",
    "e.g., Road trip through Portugal, save the camping X in Porto stop",
    "e.g., Mountain bike tour in Moab, include bike shops and repair stations",
    "e.g., Surf trip along the Basque coast, find the best breaks and hostels"
  ];

  const [placeholder, setPlaceholder] = useState(placeholders[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = placeholders.indexOf(prev);
        return placeholders[(currentIndex + 1) % placeholders.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !hasAutoPlanned.current) {
      setPrompt(initialPrompt);
      hasAutoPlanned.current = true;
      // Trigger planning immediately
      handlePlan(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePlan = async (overridePrompt?: string) => {
    const messageToPlan = overridePrompt || prompt.trim();
    if (!messageToPlan) return;

    // Track the conversation locally too: React state updates aren't visible inside this loop.
    let history: Message[] = [...messages, { role: 'user', text: messageToPlan }];
    const say = (text: string) => {
      history = [...history, { role: 'model', text }];
      setMessages(history);
    };
    setMessages(history);
    setPrompt('');
    setIsPlanning(true);

    const userLimit = [...history].reverse().map(m => m.role === 'user' ? dailyLimitFromText(m.text) : null).find(Boolean) || null;

    try {
      let request = messageToPlan;
      let best: { plan: AIPlanParams; legs: RouteLeg[] | null; score: number } | null = null;
      for (let attempt = 0; ; attempt++) {
        // Send the conversation as context, minus the request itself (the server adds it separately).
        let plan = toPlanParams(await requestPlan(request, history.filter(m => m.text !== request)));
        let legs = await onPlanRoute(plan);

        let maxKm = userLimit || DAILY_MAX_KM[plan.travelMode];
        const lengths = (legs || []).map(leg => (leg.distanceMeters || 0) / 1000);
        // Score = total km over the daily limit (lower is better). A day over 3x the limit
        // usually means a stop was geocoded in the wrong place, so treat the plan as broken.
        const score = !legs ? Infinity
          : !maxKm ? 0
          : lengths.some(l => l > maxKm * 3) ? Infinity
          : lengths.reduce((sum, l) => sum + Math.max(0, l - maxKm), 0);
        if (!best || score < best.score) {
          best = { plan, legs, score };
        }

        if (!legs && attempt < MAX_CORRECTIONS) {
          // The route couldn't be calculated (unknown place or too many stops): ask again.
          say('That route could not be drawn on the map. Trying again…');
          continue;
        }

        let tooLong = legs && maxKm
          ? legs.filter(leg => (leg.distanceMeters || 0) / 1000 > maxKm * TOLERANCE)
          : [];

        if (tooLong.length === 0 || attempt === MAX_CORRECTIONS) {
          if (best.plan !== plan) {
            // A correction made things worse: go back to the best plan we've seen.
            plan = best.plan;
            legs = await onPlanRoute(plan);
            maxKm = userLimit || DAILY_MAX_KM[plan.travelMode];
            tooLong = legs && maxKm ? legs.filter(leg => (leg.distanceMeters || 0) / 1000 > maxKm * TOLERANCE) : [];
          }
          const stops = plan.waypoints.length;
          const warning = tooLong.length
            ? ` Some days are still over ${maxKm} km; ask me to add stops or set a daily distance (e.g. "max 70 km per day").`
            : '';
          const verb = { BICYCLING: 'cycle', WALKING: 'hike', DRIVING: 'ride' }[plan.travelMode] || 'travel';
          const tip = userLimit || !maxKm
            ? ''
            : `\n\nTip: for better results, tell me your average daily distance to ${verb} (e.g. "about ${Math.round(maxKm * 0.75)} km per day"). I'm using up to ${maxKm} km per day.`;
          say(`Plan ready: ${plan.origin} → ${plan.destination}, ${stops + 1} day${stops ? 's' : ''}. See the itinerary below, or ask me to change anything.${warning}${tip}`);
          break;
        }

        // Feed the real distances back to the AI and tell it exactly which days to split.
        const km = (leg: RouteLeg) => Math.round((leg.distanceMeters || 0) / 1000);
        const dayList = legs!.map((leg, i) => `Day ${i + 1}: ${leg.from} → ${leg.to} = ${km(leg)} km`).join('\n');
        const fixes = tooLong.map(leg => {
          const extraStops = Math.ceil(km(leg) / maxKm) - 1;
          return `- ${leg.from} → ${leg.to} is ${km(leg)} km: insert ${extraStops} new overnight stop${extraStops > 1 ? 's' : ''} (a town on the route roughly every ${Math.round(km(leg) / (extraStops + 1))} km), or move the previous overnight stop further along if the day before it is short.`;
        }).join('\n');
        say(`Checking real distances… ${tooLong.length} day${tooLong.length > 1 ? 's are' : ' is'} over ${maxKm} km (longest ${Math.round(Math.max(...tooLong.map(l => (l.distanceMeters || 0) / 1000)))} km). Adjusting the stops…`);
        request = `The plan you proposed was measured on the real ${plan.travelMode.toLowerCase()} route:
${dayList}

Every day must be ${maxKm} km or less. Fix these days:
${fixes}

Keep the same start (${plan.origin}), finish (${plan.destination}), travel mode and all other stops unless they need to move. List waypoints in travel order; each new stop must be a real town on the route between its neighbours (written as "Town, Country"), never a detour. Adding days is fine unless the user fixed the number of days, in which case balance the days as evenly as possible. Return the full corrected plan with recommendations for every stop.`;
        history = [...history, { role: 'user', text: request, hidden: true }];
      }
    } catch (error) {
      console.error('AI Planning failed:', error);
      const reason = error instanceof Error ? error.message : '';
      say(`Sorry, I couldn't plan that route. ${reason}`.trim());
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
      <div className="border-b border-emerald-200 p-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/30">
        <Sparkles size={18} />
        <h3 className="text-sm font-bold uppercase tracking-tight">AI Trip Planner</h3>
      </div>
      
      {messages.length > 0 && (
        <div 
          ref={scrollRef}
          className="max-h-[260px] overflow-y-auto p-3 space-y-3 border-b border-emerald-200 dark:border-emerald-900/30"
        >
          {messages.filter(msg => !msg.hidden).map((msg, i) => (
            <div 
              key={i} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-snug ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white border border-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isPlanning && (
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <Loader2 size={14} className="animate-spin" />
              Planning your route and finding stops… this can take up to a minute.
            </div>
          )}
        </div>
      )}

      <div className="p-3 relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handlePlan();
            }
          }}
          placeholder={placeholder}
          aria-label="Describe your adventure"
          className="min-h-[80px] w-full rounded-lg border border-emerald-200 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800"
        />
        <button
          onClick={() => handlePlan()}
          disabled={isPlanning || !prompt.trim()}
          aria-label="Plan adventure"
          className="absolute bottom-6 right-6 rounded-md bg-emerald-600 p-2 text-white shadow-md transition-all hover:bg-emerald-700 hover:scale-105 disabled:opacity-50"
        >
          {isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default AIAgent;
