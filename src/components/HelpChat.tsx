import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { MessageCircleQuestion, X, Send, Loader2, ChevronRight, ChevronLeft, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

interface GuideStep {
  tab: string;
  highlight?: string;
  instruction: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-chat`;

// Parse guide blocks from AI response
function parseGuideSteps(text: string): { intro: string; steps: GuideStep[]; outro: string } | null {
  const guideMatch = text.match(/\[GUIDE\]([\s\S]*?)\[\/GUIDE\]/);
  if (!guideMatch) return null;

  const intro = text.slice(0, text.indexOf("[GUIDE]")).trim();
  const outro = text.slice(text.indexOf("[/GUIDE]") + 8).trim();
  const stepsRaw = guideMatch[1];
  const stepRegex = /\[STEP\s+tab="([^"]+)"(?:\s+highlight="([^"]+)")?\]([\s\S]*?)\[\/STEP\]/g;
  const steps: GuideStep[] = [];
  let match;
  while ((match = stepRegex.exec(stepsRaw)) !== null) {
    steps.push({ tab: match[1], highlight: match[2] || undefined, instruction: match[3].trim() });
  }
  return steps.length > 0 ? { intro, steps, outro } : null;
}

async function streamChat({
  messages, onDelta, onDone, onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Error connecting to assistant");
    return;
  }
  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const placeholders: Record<string, string> = {
  es: "¿En qué puedo ayudarte?",
  en: "How can I help you?",
  fr: "Comment puis-je vous aider ?",
};
const titles: Record<string, string> = {
  es: "Asistente de ayuda",
  en: "Help Assistant",
  fr: "Assistant d'aide",
};
const guideLabels: Record<string, { start: string; step: string; close: string }> = {
  es: { start: "Iniciar guía", step: "Paso", close: "Cerrar guía" },
  en: { start: "Start guide", step: "Step", close: "Close guide" },
  fr: { start: "Démarrer le guide", step: "Étape", close: "Fermer le guide" },
};

// ─── Spotlight Overlay ───

function GuidedSpotlight({
  steps, currentStep, onNext, onPrev, onClose, lang,
}: {
  steps: GuideStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  lang: string;
}) {
  const step = steps[currentStep];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const labels = guideLabels[lang] || guideLabels.en;

  const padding = 10;
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const spotlightW = useMotionValue(0);
  const spotlightH = useMotionValue(0);
  const springCfg = { stiffness: 200, damping: 30, mass: 0.8 };
  const animX = useSpring(spotlightX, springCfg);
  const animY = useSpring(spotlightY, springCfg);
  const animW = useSpring(spotlightW, springCfg);
  const animH = useSpring(spotlightH, springCfg);

  // Navigate to tab
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("help-navigate", { detail: { tab: step.tab } }));
  }, [step.tab, currentStep]);

  // Find and track highlighted element
  useEffect(() => {
    if (!step.highlight) { setTargetRect(null); return; }
    const selector = `[data-tour='${step.highlight}']`;
    const find = () => {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        spotlightX.set(rect.left - padding);
        spotlightY.set(rect.top - padding);
        spotlightW.set(rect.width + padding * 2);
        spotlightH.set(rect.height + padding * 2);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };
    const timer = setTimeout(find, 400);
    const observer = new MutationObserver(() => setTimeout(find, 100));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", find);
    return () => { clearTimeout(timer); observer.disconnect(); window.removeEventListener("resize", find); };
  }, [step.highlight, currentStep, spotlightX, spotlightY, spotlightW, spotlightH]);

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)" };
    }
    const gap = 16;
    const leftPos = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 150, window.innerWidth - 316));
    const spaceBelow = window.innerHeight - targetRect.bottom - gap;
    if (spaceBelow >= 140) {
      return { position: "fixed", top: targetRect.bottom + gap, left: leftPos };
    }
    return { position: "fixed", bottom: window.innerHeight - targetRect.top + gap, left: leftPos };
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9998]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <mask id="help-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect x={animX} y={animY} width={animW} height={animH} rx="12" fill="black" />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#help-spotlight-mask)" />
      </svg>

      {/* Spotlight ring */}
      {targetRect && (
        <motion.div
          className="fixed rounded-xl ring-2 ring-primary pointer-events-none shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
          style={{ zIndex: 2, left: animX, top: animY, width: animW, height: animH }}
          animate={{
            boxShadow: [
              "0 0 10px hsl(var(--primary) / 0.2)",
              "0 0 25px hsl(var(--primary) / 0.4)",
              "0 0 10px hsl(var(--primary) / 0.2)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-[300px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ ...getTooltipStyle(), zIndex: 3 }}
        >
          <div className="bg-primary/10 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-primary">
              {labels.step} {currentStep + 1} / {steps.length}
            </span>
            <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{step.instruction}</p>
          </div>
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20"}`} />
              ))}
            </div>
            <div className="flex gap-1.5">
              {currentStep > 0 && (
                <Button size="sm" variant="ghost" onClick={onPrev} className="h-7 px-2 text-xs rounded-lg">
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              )}
              <Button size="sm" onClick={onNext} className="h-7 px-3 text-xs rounded-lg font-semibold">
                {currentStep >= steps.length - 1 ? (labels.close) : (
                  <>Next <ChevronRight className="w-3 h-3 ml-0.5" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Chat Component ───

export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guideSteps, setGuideSteps] = useState<GuideStep[] | null>(null);
  const [guideCurrentStep, setGuideCurrentStep] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang } = useI18n();
  const labels = guideLabels[lang] || guideLabels.en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const startGuide = (steps: GuideStep[]) => {
    setGuideSteps(steps);
    setGuideCurrentStep(0);
    setOpen(false); // minimize chat while guiding
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setLoading(false),
        onError: (msg) => { upsert(msg); setLoading(false); },
      });
    } catch {
      upsert("Error connecting to assistant.");
      setLoading(false);
    }
  }, [input, loading, messages]);

  // Render message content, stripping guide markers for display
  const renderContent = (content: string, idx: number) => {
    const guide = parseGuideSteps(content);
    if (!guide) return <span className="whitespace-pre-wrap">{content}</span>;

    return (
      <div className="space-y-2">
        {guide.intro && <p className="whitespace-pre-wrap">{guide.intro}</p>}
        <button
          onClick={() => startGuide(guide.steps)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
        >
          <Footprints className="w-4 h-4" />
          {labels.start} ({guide.steps.length} {guide.steps.length === 1 ? "paso" : "pasos"})
        </button>
        {guide.outro && <p className="whitespace-pre-wrap text-xs opacity-80">{guide.outro}</p>}
      </div>
    );
  };

  // Guide overlay
  const guideOverlay = guideSteps && (
    <AnimatePresence>
      <GuidedSpotlight
        steps={guideSteps}
        currentStep={guideCurrentStep}
        lang={lang}
        onNext={() => {
          if (guideCurrentStep >= guideSteps.length - 1) {
            setGuideSteps(null);
            setOpen(true);
          } else {
            setGuideCurrentStep(guideCurrentStep + 1);
          }
        }}
        onPrev={() => setGuideCurrentStep(Math.max(0, guideCurrentStep - 1))}
        onClose={() => { setGuideSteps(null); setOpen(true); }}
      />
    </AnimatePresence>
  );

  if (!open && !guideSteps) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </Button>
    );
  }

  if (!open && guideSteps) {
    return guideOverlay;
  }

  return (
    <>
      {guideOverlay}
      <div className="fixed bottom-20 right-4 z-50 w-[340px] max-h-[480px] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
          <span className="font-semibold text-sm">{titles[lang] ?? titles.en}</span>
          <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">
              {placeholders[lang] ?? placeholders.en}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" ? renderContent(m.content, i) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-border px-3 py-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[lang] ?? placeholders.en}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={loading}
          />
          <Button type="submit" size="icon" variant="ghost" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
