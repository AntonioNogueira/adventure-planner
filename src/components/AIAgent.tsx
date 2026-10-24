import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, MessageSquare } from 'lucide-react';
import { InterestCategory } from '../types';

interface AIAgentProps {
  initialPrompt?: string;
  onPlanRoute: (params: {
    origin: string;
    originInterests?: InterestCategory[];
    destination: string;
    destinationInterests?: InterestCategory[];
    waypoints: any[];
    travelMode: string;
    summary?: string;
  }) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAgent: React.FC<AIAgentProps> = ({ onPlanRoute, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isPlanning, setIsPlanning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoPlanned = useRef(false);

  const placeholders = [
    "e.g., 10-day bikepacking trip from Paris to Rome...",
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

    setMessages(prev => [...prev, { role: 'user', text: messageToPlan }]);
    setPrompt('');
    setIsPlanning(true);

    try {
      // The AI call runs server-side (server/plan-api.ts) so API keys are never exposed to the browser.
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: messageToPlan, history: messages }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Show the first provider's reason (e.g. quota or billing) so setup problems are visible.
        const detail = Array.isArray(data.details) && data.details[0] ? ` ${String(data.details[0]).slice(0, 180)}` : '';
        throw new Error(`${data.error || `Planner request failed (${response.status})`}.${detail}`);
      }
      const result = data.plan;

      const stops = (result.waypoints || []).length;
      setMessages(prev => [...prev, {
        role: 'model',
        text: `Plan ready: ${result.origin} → ${result.destination} with ${stops} overnight stop${stops === 1 ? '' : 's'}. See the brief and itinerary below, or ask me to change anything.`
      }]);
      
      onPlanRoute({
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
      });
    } catch (error) {
      console.error('AI Planning failed:', error);
      const reason = error instanceof Error ? error.message : '';
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I couldn't plan that route. ${reason}`.trim() }]);
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
          {messages.map((msg, i) => (
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
              Planning your route and finding stops…
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
