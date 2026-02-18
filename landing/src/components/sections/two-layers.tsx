"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInUp } from "@/lib/animations";

// ─── Animated architecture diagram ─────────────────────

function ArchitectureDiagram() {
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 2500);
    return () => clearInterval(timer);
  }, [inView]);

  // Step descriptions
  const stepLabels = [
    "Agent sends tool call request",
    "Guardian validates schema & permissions",
    "Handler executes bounded command",
    "Output filtered for PII",
    "Result returned, audit entry written",
  ];

  return (
    <div ref={ref} className="space-y-6">
      <div className="rounded-xl border border-brand-dark-quaternary/30 bg-brand-dark-tertiary/20 p-6 md:p-8">
        <div className="space-y-4">
          {/* Agent Container */}
          <motion.div
            className="rounded-xl border p-5 transition-all duration-500"
            animate={{
              borderColor: step === 0 ? "rgba(120,34,255,0.4)" : "rgba(51,38,81,0.3)",
              backgroundColor: step === 0 ? "rgba(120,34,255,0.03)" : "rgba(22,16,66,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-2.5 w-2.5 rounded-full"
                  animate={{
                    backgroundColor: step === 0 ? "#7822FF" : "rgba(120,34,255,0.3)",
                  }}
                />
                <span className="text-sm font-medium text-white">Agent Container</span>
              </div>
              <span className="rounded-full bg-brand-dark-quaternary/50 px-2.5 py-0.5 text-[10px] text-brand-muted/60">
                Locked Down
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 py-2 text-red-400/40">
                ✗ No bash
              </div>
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 py-2 text-red-400/40">
                ✗ No filesystem
              </div>
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 py-2 text-red-400/40">
                ✗ No CLI tools
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-brand-muted/30">
              <span>↗ LLM API (inference only)</span>
              <span>↓ MCP Protocol (tool calls only)</span>
            </div>
          </motion.div>

          {/* Connection line with animated pulse */}
          <div className="flex items-center justify-center py-1 relative">
            <div className="h-12 w-px bg-gradient-to-b from-brand-purple/30 to-brand-cyan/30 relative">
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                animate={{
                  top: step >= 1 && step <= 3 ? ["0%", "100%"] : "50%",
                  backgroundColor: step >= 1 && step <= 3 ? "#2DFFFF" : "rgba(45,255,255,0.2)",
                  boxShadow:
                    step >= 1 && step <= 3
                      ? "0 0 12px rgba(45,255,255,0.6)"
                      : "0 0 4px rgba(45,255,255,0.1)",
                }}
                transition={{
                  top: { duration: 1.2, repeat: step >= 1 && step <= 3 ? Infinity : 0, ease: "linear" },
                  backgroundColor: { duration: 0.3 },
                }}
              />
            </div>
            <span className="absolute text-[9px] text-brand-muted/25 ml-6">MCP</span>
          </div>

          {/* Guardian MCP Server */}
          <motion.div
            className="rounded-xl border p-5 transition-all duration-500"
            animate={{
              borderColor:
                step >= 1 && step <= 3
                  ? "rgba(45,255,255,0.4)"
                  : "rgba(51,38,81,0.3)",
              backgroundColor:
                step >= 1 && step <= 3
                  ? "rgba(45,255,255,0.02)"
                  : "rgba(22,16,66,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-2.5 w-2.5 rounded-full"
                  animate={{
                    backgroundColor:
                      step >= 1 && step <= 3 ? "#2DFFFF" : "rgba(45,255,255,0.3)",
                  }}
                />
                <span className="text-sm font-medium text-white">Guardian MCP Server</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-30" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-cyan/60" />
                </span>
                <span className="text-[9px] text-brand-cyan/40">Enforcing</span>
              </div>
            </div>
            {/* Pipeline stages */}
            <div className="flex gap-1">
              {["Registry", "Permission", "Schema", "Execute", "Output", "PII", "Audit"].map(
                (stage, i) => (
                  <motion.div
                    key={stage}
                    className="flex-1 rounded py-1.5 text-center text-[8px] font-medium transition-all duration-300"
                    animate={{
                      backgroundColor:
                        step === 1 && i <= 2
                          ? "rgba(45,255,255,0.12)"
                          : step === 2 && i === 3
                            ? "rgba(167,139,250,0.12)"
                            : step === 3 && i >= 4
                              ? "rgba(74,222,128,0.12)"
                              : "rgba(22,16,66,0.4)",
                      color:
                        step === 1 && i <= 2
                          ? "#2DFFFFcc"
                          : step === 2 && i === 3
                            ? "#a78bfacc"
                            : step === 3 && i >= 4
                              ? "#4ade80cc"
                              : "rgba(216,208,234,0.2)",
                    }}
                  >
                    {stage}
                  </motion.div>
                )
              )}
            </div>
            <div className="mt-3 text-[10px] text-brand-muted/25 text-center">
              Has: git, logcli, kubectl, argocd, gRPC certs — the agent doesn&apos;t.
            </div>
          </motion.div>

          {/* Connection to infrastructure */}
          <div className="flex items-center justify-center py-1">
            <motion.div
              className="h-6 w-px"
              animate={{
                backgroundColor: step === 2 ? "rgba(167,139,250,0.5)" : "rgba(51,38,81,0.2)",
              }}
            />
          </div>

          {/* Infrastructure */}
          <motion.div
            className="rounded-xl border border-dashed p-4 text-center transition-all duration-500"
            animate={{
              borderColor: step === 2 ? "rgba(167,139,250,0.3)" : "rgba(51,38,81,0.2)",
              opacity: step === 2 ? 0.9 : 0.4,
            }}
          >
            <span className="text-[10px] text-brand-muted/50">
              Banking Systems · Kubernetes · ArgoCD · Loki · gRPC Services
            </span>
          </motion.div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {stepLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="group flex items-center gap-1.5"
          >
            <motion.div
              className="h-1.5 rounded-full transition-all duration-300"
              animate={{
                width: step === i ? 24 : 6,
                backgroundColor: step === i ? "#2DFFFF" : "rgba(51,38,81,0.5)",
              }}
            />
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-brand-muted/40">
        {stepLabels[step]}
      </p>
    </div>
  );
}

// ─── Two Layers Section ────────────────────────────────

export function TwoLayers() {
  return (
    <section id="architecture" className="bg-brand-dark-secondary py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>ARCHITECTURE</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          Two layers. Neither sufficient alone.
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mb-16 max-w-3xl text-lg text-brand-muted"
        >
          The container enforces <span className="text-white">what the agent can connect to</span>. 
          The MCP server enforces <span className="text-white">how tools are called</span>. 
          Together, they form a complete boundary that no amount of prompt injection, 
          context rot, or model hallucination can bypass.
        </motion.p>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left: Animated diagram */}
          <motion.div variants={fadeInUp}>
            <ArchitectureDiagram />
          </motion.div>

          {/* Right: Key points */}
          <motion.div variants={fadeInUp} className="space-y-8 lg:pt-8">
            <div className="space-y-6">
              <div className="rounded-xl border border-brand-purple/20 bg-brand-dark-tertiary/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple/20 text-xs font-bold text-brand-purple">
                    1
                  </span>
                  <h3 className="text-lg font-medium text-white">The Container</h3>
                </div>
                <p className="text-sm text-brand-muted mb-3">
                  If the agent&apos;s only channel to infrastructure is the MCP protocol, 
                  then the tool registry is the <span className="text-white">complete set of possible actions</span>. 
                  There is nothing else.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["No bash", "No filesystem", "No raw network", "No CLI tools"].map((item) => (
                    <span key={item} className="rounded-full bg-red-500/8 border border-red-500/15 px-2.5 py-1 text-[10px] text-red-400/60">
                      ✗ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-brand-cyan/20 bg-brand-dark-tertiary/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-cyan/20 text-xs font-bold text-brand-cyan">
                    2
                  </span>
                  <h3 className="text-lg font-medium text-white">The MCP Server</h3>
                </div>
                <p className="text-sm text-brand-muted mb-3">
                  Even with MCP access, the agent can only call tools it has permission for, 
                  with inputs that pass validation, and it only sees outputs that have been filtered.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Schema validation", "JWT permissions", "PII filtering", "Audit trail"].map((item) => (
                    <span key={item} className="rounded-full bg-brand-cyan/8 border border-brand-cyan/15 px-2.5 py-1 text-[10px] text-brand-cyan/60">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-l-2 border-brand-cyan/30 pl-4">
              <p className="text-base italic text-brand-muted">
                &ldquo;No amount of context rot, prompt injection, or model
                hallucination can bypass this boundary. The proxy doesn&apos;t read 
                the LLM&apos;s reasoning — it validates a structured tool call against 
                a registered schema. That&apos;s it.&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
