import React, { useState, useRef, useEffect } from 'react';
import { useSettings, getSettings, t as tr } from '../lib/settings';
import { authFetch, checkLimit, LimitError, refreshAccount, openPlans } from '../lib/account';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { TripIntent } from '../types';
import { PlanSummary, Question, Topic, summaryText, nextQuestion, applyAnswer, mentionsTravelMode, mergeIntent } from '../lib/conversation';
import { cn } from '../lib/utils';

export type { PlanSummary } from '../lib/conversation';

interface AIAgentProps {
  initialPrompt?: string;
  /** Builds the trip with Google Maps from what the AI understood; null if the route failed. */
  onPlanTrip: (intent: TripIntent) => Promise<PlanSummary | null>;
  startDate: string;
  onStartDateChange: (date: string) => void;
  /** The vehicle (moto/car trips), from the request or a quick reply: used for fuel and tolls. */
  onVehicleChange?: (vehicle: string) => void;
}

async function requestPlan(prompt: string, history: Message[], current: TripIntent | null) {
  // The AI call runs server-side (server/plan-api.ts) so API keys are never exposed to the browser.
  const response = await authFetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // The current plan travels with the request, so the AI changes only what the user asks.
    body: JSON.stringify({ prompt, history: history.map(({ role, text }) => ({ role, text })), current, language: getSettings().language }),
  });
  await checkLimit(response);
  refreshAccount();
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Show the first provider's reason (e.g. quota or billing) so setup problems are visible.
    const detail = Array.isArray(data.details) && data.details[0] ? ` ${String(data.details[0]).slice(0, 180)}` : '';
    throw new Error(`${data.error || tr('Planner request failed ({status})', { status: response.status })}.${detail}`);
  }
  return data.plan;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  /** A follow-up question with quick replies; `answer` is the label picked. */
  question?: Question;
  answer?: string;
}

const AIAgent: React.FC<AIAgentProps> = ({ onPlanTrip, initialPrompt, startDate, onStartDateChange, onVehicleChange }) => {
  const lastPlanRef = useRef<PlanSummary | null>(null);
  const { t, locale } = useSettings();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isPlanning, setIsPlanning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoPlanned = useRef(false);
  // The current plan as understood, and which questions have been asked, so answers refine it.
  const intentRef = useRef<TripIntent | null>(null);
  const askedRef = useRef(new Set<Topic>());
  const modeMentionedRef = useRef(false);

  const placeholders = [
    t('e.g., Bikepacking from Paris to Rome, about 80 km per day...'),
    t('e.g., 5-day moto adventure in the Pyrenees, include off-road trails'),
    t('e.g., Hiking the West Highland Way, suggest wild camping spots'),
    t('e.g., Road trip through Portugal, save the camping X in Porto stop'),
    t('e.g., Mountain bike tour in Moab, include bike shops and repair stations'),
    t('e.g., Surf trip along the Basque coast, find the best breaks and hostels'),
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholder = placeholders[placeholderIndex];

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIndex(i => (i + 1) % placeholders.length), 5000);
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

  const say = (message: Omit<Message, 'role'>) => setMessages(prev => [...prev, { role: 'model', ...message }]);

  // After a plan: a short summary, then the next open question (if any).
  const reportPlan = (intent: TripIntent, plan: PlanSummary, dateSet = Boolean(startDate)) => {
    lastPlanRef.current = plan;
    if (intent.vehicle) onVehicleChange?.(intent.vehicle);
    const question = nextQuestion(intent, plan, {
      asked: askedRef.current, modeMentioned: modeMentionedRef.current, hasStartDate: dateSet,
    });
    say({
      text: question ? `${summaryText(intent, plan)}\n\n${question.text}` : `${summaryText(intent, plan)}\n\n${t('All set! Drag the pins or ask me for any change.')}`,
      question: question || undefined,
    });
  };

  const runPlan = async (intent: TripIntent) => {
    const plan = await onPlanTrip(intent);
    if (!plan) {
      say({ text: t("I understood {from} → {to}, but the map couldn't draw that route. Try more specific place names.", { from: intent.origin, to: intent.destination }) });
      return;
    }
    intentRef.current = intent;
    reportPlan(intent, plan);
  };

  const handlePlan = async (overridePrompt?: string) => {
    const messageToPlan = overridePrompt || prompt.trim();
    if (!messageToPlan) return;

    const history = messages;
    setMessages([...history, { role: 'user', text: messageToPlan }]);
    setPrompt('');
    setIsPlanning(true);
    try {
      // The AI only reads the request (start, finish, mode, days or daily distance, places to pass).
      const previous = intentRef.current;
      const understood: TripIntent = await requestPlan(messageToPlan, history, previous);
      const newTrip = !previous || previous.origin !== understood.origin || previous.destination !== understood.destination;
      // A change to the current trip keeps the choices already made; a new trip starts fresh.
      const intent = newTrip ? understood : mergeIntent(previous, understood, messageToPlan);
      if (newTrip) {
        askedRef.current = new Set();
        modeMentionedRef.current = false;
      }
      if (mentionsTravelMode(messageToPlan)) modeMentionedRef.current = true;
      await runPlan(intent);
    } catch (error) {
      if (error instanceof LimitError) {
        say({ text: t("You've used today's {n} AI plans on your plan. You can still edit the route by hand, or see the plans for more.", { n: error.limit }) });
        openPlans('aiPlans');
        return;
      }
      console.error('AI Planning failed:', error);
      const reason = error instanceof Error ? error.message : '';
      say({ text: `${t("Sorry, I couldn't plan that route.")} ${reason}`.trim() });
    } finally {
      setIsPlanning(false);
    }
  };

  // A quick reply: refine the plan directly with Google Maps (no AI call needed).
  const handleAnswer = async (index: number, question: Question, label: string, value: string) => {
    setMessages(prev => [...prev.map((m, i) => i === index ? { ...m, answer: label } : m), { role: 'user', text: label }]);
    askedRef.current.add(question.topic);
    if (question.topic === 'mode') modeMentionedRef.current = true;
    const intent = intentRef.current;
    if (!intent) return;

    // The vehicle only changes the fuel and toll estimates: no new route needed.
    if (question.topic === 'vehicle') {
      const updated = applyAnswer(intent, 'vehicle', value);
      intentRef.current = updated;
      onVehicleChange?.(value);
      const plan = lastPlanRef.current || { days: 0, stops: [], targetKm: null, longestKm: 0, totalKm: 0, averageKm: 0, ferryKm: 0 };
      const next = nextQuestion(updated, plan, { asked: askedRef.current, modeMentioned: modeMentionedRef.current, hasStartDate: Boolean(startDate) });
      say(next ? { text: next.text, question: next } : { text: t('All set! Drag the pins or ask me for any change.') });
      return;
    }
    if (question.topic === 'date') {
      if (value) onStartDateChange(value);
      const next = nextQuestion(intent, { days: 0, stops: [], targetKm: null, longestKm: 0, totalKm: 0, averageKm: 0, ferryKm: 0 }, {
        asked: askedRef.current, modeMentioned: modeMentionedRef.current, hasStartDate: Boolean(value || startDate),
      });
      say(next
        ? { text: next.text, question: next }
        : { text: value ? t('Dates and forecasts are in the itinerary below. Drag the pins or ask me for any change.') : t('No problem: set a start date in the itinerary whenever you know it.') });
      return;
    }
    setIsPlanning(true);
    try {
      await runPlan(applyAnswer(intent, question.topic, value));
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
      <div className="border-b border-emerald-200 p-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/30">
        <Sparkles size={18} />
        <h3 className="text-sm font-bold uppercase tracking-tight">{t('AI trip planner')}</h3>
      </div>
      
      {messages.length > 0 && (
        <div 
          ref={scrollRef}
          className="max-h-[320px] overflow-y-auto p-3 space-y-3 border-b border-emerald-200 dark:border-emerald-900/30"
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
              {msg.question && (
                <div className="mt-1.5 flex max-w-[95%] flex-wrap items-center gap-1.5">
                  {msg.question.dateInput && !msg.answer && (
                    <input
                      type="date"
                      aria-label={t('Start date')}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => e.target.value && handleAnswer(i, msg.question!, new Date(`${e.target.value}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }), e.target.value)}
                      className="h-8 rounded-full border border-emerald-300 bg-white px-3 text-xs text-emerald-800"
                    />
                  )}
                  {msg.question.choices.map(choice => (
                    <button
                      key={choice.value + choice.label}
                      onClick={() => handleAnswer(i, msg.question!, choice.label, choice.value)}
                      disabled={Boolean(msg.answer) || isPlanning}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                        msg.answer === choice.label
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : msg.answer
                            ? 'border-emerald-100 text-emerald-300'
                            : 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50'
                      )}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isPlanning && (
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <Loader2 size={14} className="animate-spin" />
              {t('Planning your route and finding stops…')}
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
          aria-label={t('Describe your adventure')}
          className="min-h-[80px] w-full rounded-lg border border-emerald-200 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800"
        />
        <button
          onClick={() => handlePlan()}
          disabled={isPlanning || !prompt.trim()}
          aria-label={t('Plan adventure')}
          className="absolute bottom-6 right-6 rounded-md bg-emerald-600 p-2 text-white shadow-md transition-all hover:bg-emerald-700 hover:scale-105 disabled:opacity-50"
        >
          {isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default AIAgent;
