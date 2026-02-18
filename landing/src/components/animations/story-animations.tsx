"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Shared: intersection observer hook ────────────────

function useInView(threshold = 0.3): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ─── Stage 1: AI Code Editor ───────────────────────────
// Lines of code with AI ghost-text appearing as autocomplete

const CODE_LINES = [
  { text: "fun getCustomer(id: String): Customer {", type: "code" as const },
  { text: "  val result = repository.findById(id)", type: "code" as const },
  { text: "  return result ?: throw NotFoundException()", type: "ai" as const },
  { text: "}", type: "code" as const },
  { text: "", type: "code" as const },
  { text: "fun validateKYC(customer: Customer): Boolean {", type: "code" as const },
  { text: "  val docs = customer.documents.filter { it.isValid }", type: "ai" as const },
  { text: "  return docs.size >= REQUIRED_DOC_COUNT", type: "ai" as const },
  { text: "}", type: "code" as const },
];

export function AIEditorAnimation() {
  const [ref, inView] = useInView();
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    CODE_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 400 + i * 500));
    });
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] overflow-hidden font-mono text-[11px]">
      {/* Editor title bar */}
      <div className="flex items-center gap-2 border-b border-brand-dark-quaternary/30 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500/30" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/30" />
          <div className="h-2 w-2 rounded-full bg-green-500/30" />
        </div>
        <span className="text-[9px] text-brand-muted/30">CustomerService.kt</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-cyan/50" />
          <span className="text-[8px] text-brand-cyan/40">Copilot</span>
        </div>
      </div>

      {/* Code lines */}
      <div className="p-3 space-y-0.5 min-h-[200px]">
        {CODE_LINES.map((line, i) => {
          const isVisible = i < visibleLines;
          const isAI = line.type === "ai";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="w-4 text-right text-[9px] text-brand-muted/15 select-none">
                {i + 1}
              </span>
              <span
                className={
                  isAI
                    ? "text-brand-cyan/50 italic"
                    : "text-brand-muted/60"
                }
              >
                {line.text}
                {isAI && isVisible && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-1 text-[8px] text-brand-cyan/30"
                  >
                    ✦ AI
                  </motion.span>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stage 2: Knowledge Flowing ────────────────────────
// Scattered knowledge sources consolidating into a unified base

const KNOWLEDGE_SOURCES = [
  { label: "Runbooks", icon: "📋" },
  { label: "Architecture Decisions", icon: "🏗" },
  { label: "Compliance Rules", icon: "⚖" },
  { label: "Domain Models", icon: "📐" },
  { label: "Incident Postmortems", icon: "🔍" },
  { label: "API Contracts", icon: "📄" },
];

export function KnowledgeFlowAnimation() {
  const [ref, inView] = useInView();
  const [phase, setPhase] = useState<"scattered" | "flowing" | "unified">("scattered");

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("flowing"), 800);
    const t2 = setTimeout(() => setPhase("unified"), 2400);
    const t3 = setTimeout(() => {
      setPhase("scattered");
      // Restart cycle
      const cycle = setInterval(() => {
        setPhase("scattered");
        setTimeout(() => setPhase("flowing"), 800);
        setTimeout(() => setPhase("unified"), 2400);
      }, 5000);
      return () => clearInterval(cycle);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView]);

  return (
    <div ref={ref} className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] p-5 min-h-[200px]">
      {/* Sources */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {KNOWLEDGE_SOURCES.map((source, i) => (
          <motion.div
            key={source.label}
            className="rounded-lg border border-brand-dark-quaternary/20 bg-brand-dark-tertiary/20 px-2 py-2 text-center"
            animate={{
              opacity: phase === "unified" ? 0.2 : 1,
              scale: phase === "unified" ? 0.9 : 1,
              y: phase === "flowing" ? 4 + (i % 2) * 3 : 0,
            }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
          >
            <span className="text-sm">{source.icon}</span>
            <p className="text-[8px] text-brand-muted/40 mt-0.5 leading-tight">{source.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Flow arrows */}
      <div className="flex justify-center my-2">
        <motion.div
          animate={{
            opacity: phase === "flowing" || phase === "unified" ? 0.6 : 0.1,
          }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="h-4 w-px bg-gradient-to-b from-brand-muted/20 to-brand-cyan/40" />
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-brand-cyan/60"
            animate={{
              y: phase === "flowing" ? [0, 8, 0] : 0,
              opacity: phase === "flowing" ? 1 : 0.3,
            }}
            transition={{ duration: 1, repeat: phase === "flowing" ? Infinity : 0 }}
          />
          <div className="h-4 w-px bg-gradient-to-b from-brand-cyan/40 to-brand-cyan/20" />
        </motion.div>
      </div>

      {/* Unified knowledge base */}
      <motion.div
        className="rounded-lg border px-3 py-3 text-center"
        animate={{
          borderColor: phase === "unified" ? "rgba(45,255,255,0.3)" : "rgba(51,38,81,0.2)",
          backgroundColor: phase === "unified" ? "rgba(45,255,255,0.04)" : "rgba(22,16,66,0.2)",
        }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{ opacity: phase === "unified" ? 1 : 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className="h-2 w-2 rounded-full bg-brand-cyan/60" />
            <span className="text-[10px] font-medium text-brand-cyan/70">Agent-Ready Knowledge</span>
          </div>
          <p className="text-[9px] text-brand-muted/40">
            Structured · Queryable · Governed
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Stage 3: Agent Loop ───────────────────────────────
// Observe → Reason → Act cycle through infrastructure tools

const AGENT_STEPS = [
  { phase: "observe", label: "Read logs", tool: "query_logs()", icon: "👁" },
  { phase: "reason", label: "Analyse", tool: "LLM reasoning...", icon: "🧠" },
  { phase: "act", label: "Check deploy", tool: "argocd_get_app()", icon: "⚡" },
  { phase: "observe", label: "Read pods", tool: "k8s_get_pods()", icon: "👁" },
  { phase: "reason", label: "Correlate", tool: "LLM reasoning...", icon: "🧠" },
  { phase: "act", label: "Draft RCA", tool: "create_report()", icon: "⚡" },
];

export function AgentLoopAnimation() {
  const [ref, inView] = useInView();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % AGENT_STEPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [inView]);

  const step = AGENT_STEPS[activeStep];
  const phaseColors: Record<string, string> = {
    observe: "#2DFFFF",
    reason: "#a78bfa",
    act: "#4ade80",
  };

  return (
    <div ref={ref} className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] overflow-hidden font-mono min-h-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark-quaternary/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="h-2 w-2 rounded-full"
            animate={{ backgroundColor: phaseColors[step.phase] }}
            transition={{ duration: 0.3 }}
          />
          <span className="text-[10px] text-white/60">ops-agent</span>
        </div>
        <span className="text-[8px] text-brand-muted/30">3:14 AM · autonomous</span>
      </div>

      {/* Agent loop visualisation */}
      <div className="p-4">
        {/* Phase indicator */}
        <div className="flex justify-center gap-1 mb-4">
          {["observe", "reason", "act"].map((p) => (
            <motion.div
              key={p}
              className="rounded-full px-3 py-1 text-[9px] font-medium uppercase tracking-wider"
              animate={{
                backgroundColor: step.phase === p ? `${phaseColors[p]}15` : "transparent",
                color: step.phase === p ? phaseColors[p] : "rgba(216,208,234,0.2)",
                borderColor: step.phase === p ? `${phaseColors[p]}30` : "transparent",
              }}
              transition={{ duration: 0.3 }}
              style={{ border: "1px solid" }}
            >
              {p}
            </motion.div>
          ))}
        </div>

        {/* Current step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-brand-dark-quaternary/20 bg-brand-dark-tertiary/20 p-4 text-center"
          >
            <span className="text-2xl mb-2 block">{step.icon}</span>
            <p className="text-[11px] font-medium text-white/70 mb-1">{step.label}</p>
            <p
              className="text-[10px]"
              style={{ color: `${phaseColors[step.phase]}80` }}
            >
              {step.tool}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {AGENT_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full"
              animate={{
                width: i === activeStep ? 12 : 4,
                backgroundColor: i === activeStep
                  ? phaseColors[AGENT_STEPS[i].phase]
                  : "rgba(51,38,81,0.4)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stage 4: The Question / Decision Fork ─────────────
// A weighing scale / decision motif with risks on one side

const RISK_ITEMS = [
  "Data breach via agent",
  "Runaway API costs",
  "Compliance failure",
  "Production incident",
];

const TRUST_ITEMS = [
  "System prompt?",
  "Hope?",
  "Manual review?",
  "???",
];

export function DecisionForkAnimation() {
  const [ref, inView] = useInView();
  const [tiltPhase, setTiltPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setTiltPhase((p) => (p + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, [inView]);

  // 0 = balanced, 1 = risks heavy, 2 = no answer
  const tiltAngle = tiltPhase === 1 ? 4 : tiltPhase === 2 ? -3 : 0;

  return (
    <div ref={ref}>
      {/* Title */}
      <motion.p
        className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/70 mb-6 text-center"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Risk vs. Control
      </motion.p>

      {/* Fulcrum */}
      <div className="flex justify-center mb-3">
        <motion.div
          className="h-4 w-4 rotate-45 border-b-2 border-r-2 border-red-400/30"
          animate={{
            borderColor: tiltPhase === 2 ? "rgba(248,113,113,0.5)" : "rgba(248,113,113,0.25)",
          }}
        />
      </div>

      <motion.div
        className="relative"
        animate={{ rotateZ: tiltAngle }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ transformOrigin: "center top" }}
      >
        {/* Beam */}
        <div className="h-px w-full bg-gradient-to-r from-red-400/30 via-red-400/60 to-red-400/30 mb-6" />

        <div className="grid grid-cols-2 gap-5">
          {/* Left: Risks (concrete, heavy) */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-red-400/80 uppercase tracking-[0.12em] mb-3">
              The risks
            </p>
            {RISK_ITEMS.map((item, i) => (
              <motion.div
                key={item}
                className="rounded-lg bg-red-500/[0.06] border border-red-500/15 px-4 py-2.5 text-sm text-red-300/80"
                animate={{
                  opacity: tiltPhase >= 1 ? 1 : 0.6,
                  scale: tiltPhase >= 1 ? 1.02 : 1,
                  borderColor: tiltPhase >= 1 ? "rgba(248,113,113,0.3)" : "rgba(248,113,113,0.12)",
                }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                {item}
              </motion.div>
            ))}
          </div>

          {/* Right: Controls (inadequate, flimsy) */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-brand-muted/50 uppercase tracking-[0.12em] mb-3">
              Your controls
            </p>
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={item}
                className="rounded-lg border border-dashed px-4 py-2.5 text-sm"
                animate={{
                  borderColor: tiltPhase === 2
                    ? "rgba(248,113,113,0.35)"
                    : "rgba(51,38,81,0.25)",
                  color: tiltPhase === 2
                    ? "rgba(248,113,113,0.7)"
                    : "rgba(216,208,234,0.35)",
                }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom verdict */}
      <AnimatePresence mode="wait">
        {tiltPhase === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-red-400/60 italic">
              The scale doesn&apos;t balance.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stage 5: The Answer (stacked triptych) ────────────
// Architecture assembling + Shield completing + Audit flowing

export function GuardianAnswerAnimation() {
  const [ref, inView] = useInView(0.2);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div ref={ref} className="space-y-3">
      {/* Part 1: Architecture assembling */}
      <div className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] p-4">
        <p className="text-[8px] font-medium uppercase tracking-wider text-brand-muted/30 mb-3">
          Architecture
        </p>
        <div className="space-y-1.5">
          {/* Guardian Agents */}
          <motion.div
            className="rounded-lg border px-3 py-2 text-center"
            animate={{
              borderColor: phase >= 1 ? "rgba(120,34,255,0.3)" : "rgba(51,38,81,0.15)",
              backgroundColor: phase >= 1 ? "rgba(120,34,255,0.04)" : "transparent",
              opacity: phase >= 1 ? 1 : 0.3,
            }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] font-medium" style={{ color: phase >= 1 ? "#7822FF" : "rgba(216,208,234,0.2)" }}>
              Guardian Agents
            </span>
            <p className="text-[8px] text-brand-muted/30">Governed runtime</p>
          </motion.div>

          {/* Arrow */}
          <div className="flex justify-center">
            <motion.div
              className="h-3 w-px"
              animate={{
                backgroundColor: phase >= 1
                  ? "rgba(45,255,255,0.3)"
                  : "rgba(51,38,81,0.15)",
              }}
            />
          </div>

          {/* Guardian Tool Calls */}
          <motion.div
            className="rounded-lg border px-3 py-2 text-center"
            animate={{
              borderColor: phase >= 1 ? "rgba(45,255,255,0.3)" : "rgba(51,38,81,0.15)",
              backgroundColor: phase >= 1 ? "rgba(45,255,255,0.04)" : "transparent",
              opacity: phase >= 1 ? 1 : 0.3,
            }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-[10px] font-medium" style={{ color: phase >= 1 ? "#2DFFFF" : "rgba(216,208,234,0.2)" }}>
              Guardian Tool Calls
            </span>
            <p className="text-[8px] text-brand-muted/30">Governed MCP server</p>
          </motion.div>
        </div>
      </div>

      {/* Part 2: Shield completing */}
      <div className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] p-4">
        <p className="text-[8px] font-medium uppercase tracking-wider text-brand-muted/30 mb-3">
          Enforcement
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {["Schema", "Permissions", "PII Filter", "Audit", "Rate Limit", "Kill Switch"].map((cap, i) => {
            const isActive = phase >= 2 || (phase === 1 && i < 3);
            const isCyan = i < 4;
            const color = isCyan ? "#2DFFFF" : "#7822FF";

            return (
              <motion.div
                key={cap}
                className="rounded-full border px-2.5 py-1 text-[8px] font-medium"
                animate={{
                  borderColor: isActive ? `${color}30` : "rgba(51,38,81,0.2)",
                  backgroundColor: isActive ? `${color}10` : "transparent",
                  color: isActive ? `${color}cc` : "rgba(216,208,234,0.15)",
                  scale: isActive ? 1 : 0.95,
                }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                {cap}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Part 3: Audit trail flowing */}
      <div className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] p-4 font-mono">
        <p className="text-[8px] font-medium uppercase tracking-wider text-brand-muted/30 mb-3">
          Audit Trail
        </p>
        <div className="space-y-1">
          {[
            { tool: "query_logs()", verdict: "ALLOWED", color: "#4ade80" },
            { tool: "kubectl_delete()", verdict: "BLOCKED", color: "#f87171" },
            { tool: "get_customer()", verdict: "FILTERED", color: "#a78bfa" },
          ].map((entry, i) => (
            <motion.div
              key={entry.tool}
              className="flex items-center justify-between rounded px-2 py-1.5"
              animate={{
                opacity: phase >= 3 ? 1 : phase >= 2 && i === 0 ? 0.7 : 0.15,
                backgroundColor: phase >= 3 ? `${entry.color}06` : "transparent",
              }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <span className="text-[9px] text-brand-muted/50">{entry.tool}</span>
              <span
                className="text-[8px] font-bold"
                style={{ color: phase >= 3 ? entry.color : "rgba(216,208,234,0.1)" }}
              >
                {entry.verdict}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
