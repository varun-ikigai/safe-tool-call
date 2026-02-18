"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInUp } from "@/lib/animations";

// ─── Unrestricted agent terminal ───────────────────────

interface TerminalLine {
  type: "prompt" | "output" | "danger" | "success";
  text: string;
  delay: number;
}

const UNRESTRICTED_LINES: TerminalLine[] = [
  { type: "prompt", text: "agent> git log --oneline -5", delay: 0 },
  { type: "output", text: "a3f21c9 fix: payment validation\n8b1e4d2 feat: add customer endpoint\n...", delay: 600 },
  { type: "prompt", text: "agent> kubectl get pods -n customer-data", delay: 1200 },
  { type: "output", text: "NAME                        READY   STATUS\ncustomer-svc-7d4b8c-x9k2j  1/1     Running", delay: 1800 },
  { type: "prompt", text: "agent> kubectl delete namespace production", delay: 2800 },
  { type: "danger", text: 'namespace "production" deleted', delay: 3600 },
  { type: "prompt", text: "agent> git push --force origin main", delay: 4600 },
  { type: "danger", text: "+ abc1234...def5678 main -> main (forced update)", delay: 5200 },
  { type: "prompt", text: 'agent> logcli query \'{}\' --limit 999999', delay: 6200 },
  { type: "danger", text: "[dumping entire cluster log history...]", delay: 6800 },
];

const GUARDIAN_LINES: TerminalLine[] = [
  { type: "prompt", text: "agent> git_log({ count: 5 })", delay: 0 },
  { type: "success", text: "✓ Schema valid · Permission: git:read · Audited", delay: 600 },
  { type: "prompt", text: 'agent> get_pods({ namespace: "customer-data" })', delay: 1400 },
  { type: "success", text: "✓ Schema valid · Permission: k8s:read · Audited", delay: 2000 },
  { type: "prompt", text: "agent> kubectl delete namespace production", delay: 3000 },
  { type: "danger", text: "✗ DENIED — tool not registered. Default deny.", delay: 3400 },
  { type: "prompt", text: "agent> git push --force origin main", delay: 4200 },
  { type: "danger", text: "✗ DENIED — tool not registered. No write tools.", delay: 4600 },
  { type: "prompt", text: 'agent> query_logs({ namespace: "payments", limit: 100 })', delay: 5400 },
  { type: "success", text: "✓ Schema valid · Permission: logs:read · PII clean · Audited", delay: 6000 },
];

function AnimatedTerminal({
  lines,
  title,
  status,
  statusColor,
}: {
  lines: TerminalLine[];
  title: string;
  status: string;
  statusColor: string;
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const runCountRef = useRef(0);

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
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const runSequence = useCallback(() => {
    setVisibleLines(0);
    lines.forEach((line, i) => {
      timerRef.current = setTimeout(() => {
        setVisibleLines(i + 1);
      }, line.delay);
    });
    // Reset after full cycle
    timerRef.current = setTimeout(() => {
      runCountRef.current += 1;
      runSequence();
    }, lines[lines.length - 1].delay + 3000);
  }, [lines]);

  useEffect(() => {
    if (inView) runSequence();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inView, runSequence]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] font-mono"
      style={{ minHeight: 320 }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-brand-dark-quaternary/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500/60" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
            <div className="h-2 w-2 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-2 text-[11px] font-medium text-white/70">{title}</span>
        </div>
        <span className="text-[9px] font-medium" style={{ color: statusColor }}>
          {status}
        </span>
      </div>

      {/* Terminal content */}
      <div className="p-4 space-y-1 text-[12px] leading-relaxed">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={`${runCountRef.current}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={
              line.type === "prompt"
                ? "text-brand-muted/70"
                : line.type === "danger"
                  ? "text-red-400/90 pl-2"
                  : line.type === "success"
                    ? "text-emerald-400/80 pl-2"
                    : "text-brand-muted/40 pl-2"
            }
          >
            {line.text.split("\n").map((l, j) => (
              <div key={j}>{l}</div>
            ))}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <motion.span
            className="inline-block h-3 w-1.5 bg-brand-muted/40"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Problem Section ───────────────────────────────────

export function Problem() {
  return (
    <section id="the-risk" className="bg-brand-dark py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>THE RISK</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-6 max-w-3xl text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          Same agent. Same prompt. Different boundary.
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mb-12 max-w-2xl text-lg text-brand-muted"
        >
          An agent with bash access can escalate from reading logs to deleting
          production. The only difference is the system prompt — and that&apos;s
          not a security control.
        </motion.p>

        {/* Side-by-side terminals */}
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-sm font-medium text-red-400/80">
                Without Guardian
              </span>
              <span className="text-xs text-brand-muted/30">— raw bash access</span>
            </div>
            <AnimatedTerminal
              lines={UNRESTRICTED_LINES}
              title="agent-container (unrestricted)"
              status="UNRESTRICTED"
              statusColor="#f87171"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-emerald-400/80">
                With Guardian
              </span>
              <span className="text-xs text-brand-muted/30">— bounded tool calls</span>
            </div>
            <AnimatedTerminal
              lines={GUARDIAN_LINES}
              title="agent-container → Guardian MCP"
              status="GOVERNED"
              statusColor="#4ade80"
            />
          </motion.div>
        </div>

        <motion.p
          variants={fadeInUp}
          className="mt-12 text-center text-lg text-brand-muted"
        >
          The left terminal is real. Every command a model decides to try,
          executes.
          <br />
          <span className="text-white">
            The right terminal is mechanical.
          </span>{" "}
          Unregistered tools don&apos;t exist. Invalid inputs are rejected. PII
          is filtered. Everything is audited.
        </motion.p>
      </motion.div>
    </section>
  );
}
