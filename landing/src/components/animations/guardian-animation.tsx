"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────

interface ToolCall {
  id: string;
  agent: string;
  tool: string;
  steps: EnforcementStep[];
  outcome: "allowed" | "blocked" | "filtered";
}

interface EnforcementStep {
  gate: string;
  status: "pass" | "fail" | "filter" | "pending" | "running";
  detail: string;
}

// ─── Data ──────────────────────────────────────────────

const TOOL_CALLS: ToolCall[] = [
  {
    id: "tc-001",
    agent: "cb-dev",
    tool: "get_account_details",
    outcome: "filtered",
    steps: [
      { gate: "Schema", status: "pass", detail: "Zod: { account_id: string } ✓" },
      { gate: "Permission", status: "pass", detail: "JWT: read scope verified" },
      { gate: "PII Filter", status: "filter", detail: "SSN → ●●●●●, DOB → redacted" },
      { gate: "Audit", status: "pass", detail: "Logged: tc-001 → audit.jsonl" },
    ],
  },
  {
    id: "tc-002",
    agent: "cb-risk",
    tool: "modify_credit_limit",
    outcome: "blocked",
    steps: [
      { gate: "Schema", status: "pass", detail: "Zod: { account_id, amount } ✓" },
      { gate: "Permission", status: "fail", detail: "JWT: admin scope required — denied" },
      { gate: "PII Filter", status: "pending", detail: "Skipped (blocked)" },
      { gate: "Audit", status: "pass", detail: "Logged: tc-002 DENIED → audit.jsonl" },
    ],
  },
  {
    id: "tc-003",
    agent: "cb-reviewer",
    tool: "execute_shell_command",
    outcome: "blocked",
    steps: [
      { gate: "Schema", status: "fail", detail: "Tool not registered — default deny" },
      { gate: "Permission", status: "pending", detail: "Skipped (unregistered)" },
      { gate: "PII Filter", status: "pending", detail: "Skipped (unregistered)" },
      { gate: "Audit", status: "pass", detail: "Logged: tc-003 REJECTED → audit.jsonl" },
    ],
  },
  {
    id: "tc-004",
    agent: "cb-dev",
    tool: "initiate_transfer",
    outcome: "allowed",
    steps: [
      { gate: "Schema", status: "pass", detail: "Zod: { from, to, amount, ref } ✓" },
      { gate: "Permission", status: "pass", detail: "JWT: write scope + elevated ✓" },
      { gate: "PII Filter", status: "pass", detail: "No PII in payload" },
      { gate: "Audit", status: "pass", detail: "Logged: tc-004 → audit.jsonl" },
    ],
  },
];

const GATE_COLORS: Record<string, string> = {
  Schema: "#2DFFFF",
  Permission: "#f59e0b",
  "PII Filter": "#a78bfa",
  Audit: "#4ade80",
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  pass: { color: "#4ade80", label: "PASS" },
  fail: { color: "#f87171", label: "DENY" },
  filter: { color: "#a78bfa", label: "MASK" },
  pending: { color: "#33265180", label: "—" },
  running: { color: "#f59e0b", label: "..." },
};

const OUTCOME_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  allowed: { color: "#4ade80", bg: "rgba(74,222,128,0.08)", label: "ALLOWED" },
  blocked: { color: "#f87171", bg: "rgba(248,113,113,0.08)", label: "BLOCKED" },
  filtered: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "FILTERED" },
};

// ─── Gate pipeline (persistent header) ─────────────────

function GatePipeline({
  activeGate,
  gatesDone,
}: {
  activeGate: number;
  gatesDone: boolean[];
}) {
  const gates = ["Schema", "Permission", "PII Filter", "Audit"];
  return (
    <div className="flex items-center gap-0 border-b border-[#332651]/20 px-4 py-1.5">
      {gates.map((g, i) => {
        const isActive = i === activeGate;
        const isDone = gatesDone[i];
        const color = GATE_COLORS[g];
        return (
          <div key={g} className="flex items-center">
            <div className="flex items-center gap-1">
              <div
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? `${color}25`
                    : isActive
                      ? `${color}12`
                      : "rgba(51,38,81,0.15)",
                  border: isActive
                    ? `1.5px solid ${color}40`
                    : "1.5px solid transparent",
                }}
              >
                {isDone ? (
                  <span style={{ color, fontSize: 7 }}>✓</span>
                ) : isActive ? (
                  <span
                    className="inline-block h-1.5 w-1.5 animate-spin rounded-full border border-transparent"
                    style={{ borderTopColor: color }}
                  />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-[#332651]/30" />
                )}
              </div>
              <span
                className="text-[8px] transition-all duration-300"
                style={{ color: isDone || isActive ? `${color}aa` : "#D8D0EA20" }}
              >
                {g}
              </span>
            </div>
            {i < gates.length - 1 && (
              <div
                className="mx-1.5 h-px w-3 transition-all duration-500"
                style={{ backgroundColor: isDone ? `${color}30` : "rgba(51,38,81,0.12)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Enforcement view ──────────────────────────────────

function EnforcementView({
  call,
  visible,
  stepsRevealed,
  outcomeVisible,
}: {
  call: ToolCall;
  visible: boolean;
  stepsRevealed: number;
  outcomeVisible: boolean;
}) {
  const outcome = OUTCOME_STYLES[call.outcome];

  return (
    <div
      className="absolute inset-0 px-4 py-3 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Tool call header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-[#161042] px-2 py-0.5 font-mono text-[10px] text-white/60">
          {call.tool}
        </span>
        <span className="text-[8px] text-[#D8D0EA]/25">from</span>
        <span className="text-[9px] text-[#2DFFFF]/50">@{call.agent}</span>
        <span className="ml-auto font-mono text-[8px] text-[#D8D0EA]/15">{call.id}</span>
      </div>

      {/* Enforcement steps */}
      <div className="space-y-1.5">
        {call.steps.map((step, i) => {
          const gateColor = GATE_COLORS[step.gate];
          const revealed = i < stepsRevealed;
          const stepStatus =
            revealed
              ? STATUS_STYLES[step.status]
              : STATUS_STYLES["pending"];

          return (
            <div
              key={i}
              className="rounded-lg px-3 py-2 transition-all duration-400"
              style={{
                opacity: revealed ? 1 : 0.25,
                backgroundColor: revealed
                  ? step.status === "fail"
                    ? "rgba(248,113,113,0.04)"
                    : step.status === "filter"
                      ? "rgba(167,139,250,0.04)"
                      : "rgba(22,16,66,0.3)"
                  : "rgba(22,16,66,0.15)",
                transform: revealed ? "translateX(0)" : "translateX(4px)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-16 text-[9px] font-medium"
                  style={{ color: revealed ? `${gateColor}aa` : "#D8D0EA15" }}
                >
                  {step.gate}
                </span>
                <span className="flex-1 font-mono text-[9px] text-[#D8D0EA]/45">
                  {revealed ? step.detail : ""}
                </span>
                <span
                  className="w-10 rounded-full px-1.5 py-0.5 text-center text-[7px] font-bold transition-all duration-300"
                  style={{
                    backgroundColor: revealed ? `${stepStatus.color}15` : "transparent",
                    color: revealed ? `${stepStatus.color}cc` : "#33265140",
                  }}
                >
                  {stepStatus.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome banner */}
      <div
        className="mt-3 rounded-lg border px-3 py-2 transition-all duration-600"
        style={{
          opacity: outcomeVisible ? 1 : 0,
          transform: outcomeVisible ? "scale(1)" : "scale(0.97)",
          borderColor: outcomeVisible ? `${outcome.color}30` : "transparent",
          backgroundColor: outcomeVisible ? outcome.bg : "transparent",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold"
            style={{ color: outcome.color }}
          >
            {outcome.label}
          </span>
          <span className="text-[8px] text-[#D8D0EA]/25">·</span>
          <span className="font-mono text-[8px] text-[#D8D0EA]/30">
            {call.tool}
          </span>
          <span className="ml-auto text-[8px] text-[#D8D0EA]/20">
            → audit.jsonl
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible Explainer ─────────────────────────────

function GuardianExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-brand-dark-quaternary/30 bg-brand-dark-tertiary/30 font-sans">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-cyan/10 text-[10px] text-brand-cyan/70">
            ?
          </span>
          <span className="text-sm font-medium text-white/70">
            What does this mean in plain English?
          </span>
        </div>
        <span
          className="text-brand-muted/40 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="border-t border-brand-dark-quaternary/20 px-5 pb-5 pt-4">
          <p className="mb-4 text-sm leading-relaxed text-brand-muted">
            AI agents are software that can take actions on your behalf — like looking up an account balance or initiating a payment. When these agents operate inside a bank, every action needs to be{" "}
            <span className="text-white/80">checked, controlled, and recorded</span>.
            That&apos;s what Guardian does.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-brand-dark/50 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2DFFFF" }} />
                <span className="text-xs font-medium text-white/70">Is this a real action?</span>
              </div>
              <p className="text-xs text-brand-muted/70">
                Every request is validated against a strict definition. If the action isn&apos;t registered, it doesn&apos;t exist. No exceptions.
              </p>
            </div>
            <div className="rounded-lg bg-brand-dark/50 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                <span className="text-xs font-medium text-white/70">Are they allowed to do this?</span>
              </div>
              <p className="text-xs text-brand-muted/70">
                Each agent has specific permissions. A reporting tool can read data — it can never move money or change settings.
              </p>
            </div>
            <div className="rounded-lg bg-brand-dark/50 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a78bfa" }} />
                <span className="text-xs font-medium text-white/70">Is sensitive data protected?</span>
              </div>
              <p className="text-xs text-brand-muted/70">
                Personal information like national insurance numbers and dates of birth are automatically hidden or removed before the agent ever sees them.
              </p>
            </div>
            <div className="rounded-lg bg-brand-dark/50 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#4ade80" }} />
                <span className="text-xs font-medium text-white/70">Is everything recorded?</span>
              </div>
              <p className="text-xs text-brand-muted/70">
                Every action — approved or denied — is logged with a complete audit trail. Regulators can verify exactly what happened and when.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs italic text-brand-muted/50">
            Most AI safety relies on telling the model to &ldquo;please don&apos;t do bad things.&rdquo;
            Guardian doesn&apos;t ask — it enforces. Mechanically, every time, with a paper trail.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Animation ────────────────────────────────────

export function GuardianAnimation() {
  const [activeCall, setActiveCall] = useState(0);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const [outcomeVisible, setOutcomeVisible] = useState(false);
  const [activeGate, setActiveGate] = useState(-1);
  const [gatesDone, setGatesDone] = useState([false, false, false, false]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runAnimation = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    while (true) {
      for (let c = 0; c < TOOL_CALLS.length; c++) {
        const call = TOOL_CALLS[c];
        setActiveCall(c);
        setStepsRevealed(0);
        setOutcomeVisible(false);
        setActiveGate(-1);
        setGatesDone([false, false, false, false]);
        await sleep(600);

        for (let s = 0; s < call.steps.length; s++) {
          setActiveGate(s);
          await sleep(400);
          setStepsRevealed(s + 1);
          setGatesDone((prev) => {
            const next = [...prev];
            next[s] = true;
            return next;
          });
          await sleep(500);
        }

        await sleep(300);
        setOutcomeVisible(true);
        await sleep(2200);
      }
    }
  }, []);

  useEffect(() => {
    if (inView) runAnimation();
  }, [inView, runAnimation]);

  return (
    <div ref={containerRef} className="space-y-5">
      <div
        className="overflow-hidden rounded-xl border border-[#332651]/40 bg-[#0a0020] font-mono"
        style={{ minHeight: 340 }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-[#332651]/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#2DFFFF]/60" />
            <span className="text-[11px] font-medium text-white/70">Guardian Runtime</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DFFFF] opacity-40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2DFFFF]/70" />
            </span>
            <span className="text-[9px] text-[#2DFFFF]/40">Enforcing</span>
          </div>
        </div>

        <GatePipeline activeGate={activeGate} gatesDone={gatesDone} />

        <div className="relative" style={{ height: 268 }}>
          {TOOL_CALLS.map((call, i) => (
            <EnforcementView
              key={call.id}
              call={call}
              visible={activeCall === i}
              stepsRevealed={activeCall === i ? stepsRevealed : 0}
              outcomeVisible={activeCall === i && outcomeVisible}
            />
          ))}
        </div>
      </div>

      <GuardianExplainer />
    </div>
  );
}
