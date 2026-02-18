"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────

type Stage = "before" | "after";

interface ArchNode {
  id: string;
  label: string;
  sublabel?: string;
  stage: Stage | "always";
  owner: "guardian" | "external" | "internal";
}

// ─── Architecture layers ───────────────────────────────

const LAYERS: { label: string; nodes: ArchNode[] }[] = [
  {
    label: "AI Models",
    nodes: [
      {
        id: "llm",
        label: "LLM Providers",
        sublabel: "OpenAI / Anthropic / Google",
        stage: "always",
        owner: "external",
      },
    ],
  },
  {
    label: "Agent Runtime",
    nodes: [
      {
        id: "raw-agent",
        label: "Raw Agent",
        sublabel: "Bash access · No guardrails",
        stage: "before",
        owner: "external",
      },
      {
        id: "guardian-agents",
        label: "Guardian Agents",
        sublabel: "Governed runtime · Built on FastAgent",
        stage: "after",
        owner: "guardian",
      },
    ],
  },
  {
    label: "Tool Governance",
    nodes: [
      {
        id: "no-governance",
        label: "Direct Access",
        sublabel: "No validation · No filtering · No audit",
        stage: "before",
        owner: "external",
      },
      {
        id: "guardian-tool-calls",
        label: "Guardian Tool Calls",
        sublabel: "Schema · Permissions · PII · Audit",
        stage: "after",
        owner: "guardian",
      },
    ],
  },
  {
    label: "Infrastructure",
    nodes: [
      {
        id: "banking",
        label: "Banking Systems",
        sublabel: "gRPC · Kubernetes · ArgoCD · Loki · Git",
        stage: "always",
        owner: "internal",
      },
    ],
  },
  {
    label: "Observability",
    nodes: [
      {
        id: "no-audit",
        label: "No Audit Trail",
        sublabel: "No structured logs · No proof",
        stage: "before",
        owner: "external",
      },
      {
        id: "audit",
        label: "Structured Audit",
        sublabel: "Every call logged · SIEM-ready · Compliance proof",
        stage: "after",
        owner: "internal",
      },
    ],
  },
];

// ─── Stage metadata ────────────────────────────────────

const STAGE_INFO: Record<
  Stage,
  { name: string; label: string; description: string }
> = {
  before: {
    name: "Without Guardian",
    label: "The Default State",
    description:
      "Raw LLM agent with bash access, no validation, no audit trail. The agent can do anything the infrastructure allows.",
  },
  after: {
    name: "With Guardian",
    label: "The Complete Boundary",
    description:
      "Guardian Agents is the runtime. Guardian Tool Calls is the MCP server. Two products that ARE the architecture.",
  },
};

// ─── Helpers ───────────────────────────────────────────

function isNodeVisible(nodeStage: string, activeStage: Stage): boolean {
  if (nodeStage === "always") return true;
  return nodeStage === activeStage;
}

function getLayerActiveNode(
  layer: (typeof LAYERS)[number],
  activeStage: Stage
): ArchNode | null {
  const stageNode = layer.nodes.find((n) => n.stage === activeStage);
  if (stageNode) return stageNode;
  const alwaysNode = layer.nodes.find((n) => n.stage === "always");
  return alwaysNode ?? null;
}

// ─── Node renderers ────────────────────────────────────

function ExternalNode({
  node,
  active,
  danger,
}: {
  node: ArchNode;
  active: boolean;
  danger?: boolean;
}) {
  return (
    <motion.div
      layout
      className="relative rounded-xl px-5 py-4 text-center transition-all duration-700"
      animate={{
        opacity: active ? 0.85 : 0.15,
        scale: active ? 1 : 0.95,
        borderColor: active
          ? danger
            ? "rgba(248,113,113,0.25)"
            : "rgba(216,208,234,0.15)"
          : "rgba(51,38,81,0.15)",
        backgroundColor: active
          ? danger
            ? "rgba(248,113,113,0.04)"
            : "rgba(22,16,66,0.3)"
          : "rgba(22,16,66,0.1)",
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ border: "1px dashed" }}
    >
      {danger && active && (
        <span className="mb-2 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-medium text-red-400/70">
          ⚠ Unprotected
        </span>
      )}
      <p
        className={`text-sm font-medium transition-colors duration-700 ${
          active
            ? danger
              ? "text-red-300/80"
              : "text-brand-muted"
            : "text-brand-muted/25"
        }`}
      >
        {node.label}
      </p>
      {node.sublabel && (
        <p
          className={`mt-0.5 text-[11px] transition-colors duration-700 ${
            active
              ? danger
                ? "text-red-400/40"
                : "text-brand-muted/50"
              : "text-brand-muted/15"
          }`}
        >
          {node.sublabel}
        </p>
      )}
    </motion.div>
  );
}

function GuardianNode({
  node,
  active,
  isNew,
}: {
  node: ArchNode;
  active: boolean;
  isNew: boolean;
}) {
  const isCyan = node.id === "guardian-tool-calls";
  const color = isCyan ? "#2DFFFF" : "#7822FF";

  return (
    <motion.div
      layout
      className="relative rounded-xl border px-5 py-4 text-center transition-all duration-700"
      animate={{
        opacity: active ? 1 : 0.15,
        scale: active ? 1 : 0.95,
        borderColor: active ? `${color}30` : "rgba(51,38,81,0.15)",
        backgroundColor: active ? `${color}05` : "rgba(22,16,66,0.1)",
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {active && isNew && (
        <motion.div
          className="absolute -inset-px rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background: `linear-gradient(135deg, ${color}33, ${color}15)`,
          }}
        />
      )}

      <span
        className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em]"
        style={{
          backgroundColor: active ? `${color}15` : "rgba(51,38,81,0.2)",
          color: active ? `${color}cc` : "rgba(216,208,234,0.2)",
        }}
      >
        Ikigai Guardian
      </span>

      <p
        className="text-sm font-medium transition-colors duration-700"
        style={{ color: active ? color : "rgba(216,208,234,0.25)" }}
      >
        {node.label}
      </p>
      {node.sublabel && (
        <p
          className={`mt-0.5 text-[11px] transition-colors duration-700 ${
            active ? "text-brand-muted" : "text-brand-muted/15"
          }`}
        >
          {node.sublabel}
        </p>
      )}

      {active && node.id === "guardian-agents" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-3 flex flex-wrap justify-center gap-1"
        >
          {["Locked Down", "Rate Limits", "Checkpoints", "Kill Switch"].map(
            (f) => (
              <span
                key={f}
                className="rounded bg-brand-purple/8 border border-brand-purple/15 px-1.5 py-0.5 text-[8px] text-brand-purple/60"
              >
                {f}
              </span>
            )
          )}
        </motion.div>
      )}
      {active && node.id === "guardian-tool-calls" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-3 flex flex-wrap justify-center gap-1"
        >
          {["Registry", "Permissions", "Schema", "PII Filter", "Audit"].map(
            (f) => (
              <span
                key={f}
                className="rounded bg-brand-cyan/8 border border-brand-cyan/15 px-1.5 py-0.5 text-[8px] text-brand-cyan/60"
              >
                {f}
              </span>
            )
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function InternalNode({ node, active }: { node: ArchNode; active: boolean }) {
  return (
    <motion.div
      layout
      className="relative rounded-xl px-5 py-4 text-center transition-all duration-700"
      animate={{
        opacity: active ? 1 : 0.3,
        scale: active ? 1 : 0.97,
        borderColor: active
          ? "rgba(120,34,255,0.2)"
          : "rgba(51,38,81,0.15)",
        backgroundColor: active
          ? "rgba(22,16,66,0.4)"
          : "rgba(22,16,66,0.15)",
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ border: "1px solid" }}
    >
      <p
        className={`text-sm font-medium transition-colors duration-700 ${
          active ? "text-white" : "text-brand-muted/30"
        }`}
      >
        {node.label}
      </p>
      {node.sublabel && (
        <p
          className={`mt-0.5 text-[11px] transition-colors duration-700 ${
            active ? "text-brand-muted/70" : "text-brand-muted/15"
          }`}
        >
          {node.sublabel}
        </p>
      )}
    </motion.div>
  );
}

// ─── Flow arrow ────────────────────────────────────────

function FlowArrow({
  active,
  danger,
}: {
  active: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="relative flex flex-col items-center">
        <motion.div
          className="h-6 w-px"
          animate={{
            background: active
              ? danger
                ? "linear-gradient(180deg, #f87171, #f8717180)"
                : "linear-gradient(180deg, #2DFFFF, #7822FF)"
              : "linear-gradient(180deg, #332651, #332651)",
            opacity: active ? 0.5 : 0.12,
          }}
          transition={{ duration: 0.6 }}
        />
        {active && (
          <motion.div
            className="absolute h-1.5 w-1.5 rounded-full"
            animate={{
              top: ["0%", "100%"],
              backgroundColor: danger ? "#f87171" : "#2DFFFF",
            }}
            transition={{
              top: { duration: 1.2, repeat: Infinity, ease: "linear" },
              backgroundColor: { duration: 0.3 },
            }}
            style={{
              boxShadow: danger
                ? "0 0 6px rgba(248,113,113,0.4)"
                : "0 0 6px rgba(45,255,255,0.4)",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main exported component ───────────────────────────

export function ArchitectureInfographic() {
  const [activeStage, setActiveStage] = useState<Stage>("before");
  const [prevStage, setPrevStage] = useState<Stage | null>(null);

  const advance = useCallback(() => {
    setPrevStage(activeStage);
    setActiveStage((s) => (s === "before" ? "after" : "before"));
  }, [activeStage]);

  useEffect(() => {
    const timer = setInterval(advance, 6000);
    return () => clearInterval(timer);
  }, [advance]);

  const isNew = (nodeStage: string) => {
    if (nodeStage === "always") return false;
    if (!prevStage) return nodeStage === "before";
    return nodeStage === activeStage && nodeStage !== prevStage;
  };

  const isBefore = activeStage === "before";

  return (
    <div>
      {/* Badge */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <div
          className="h-px flex-1 max-w-16"
          style={{
            background: "linear-gradient(90deg, transparent, #332651)",
          }}
        />
        <span className="rounded-full border border-brand-cyan/20 bg-brand-dark-tertiary/50 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-brand-cyan/70">
          Guardian Safety Stack
        </span>
        <div
          className="h-px flex-1 max-w-16"
          style={{
            background: "linear-gradient(90deg, #332651, transparent)",
          }}
        />
      </div>

      {/* Architecture diagram — vertical flow */}
      <div className="mx-auto flex max-w-sm flex-col items-center">
        {LAYERS.map((layer, layerIdx) => {
          const activeNode = getLayerActiveNode(layer, activeStage);
          if (!activeNode) return null;

          const isGuardian = activeNode.owner === "guardian";
          const isInternal = activeNode.owner === "internal";
          const isVisible = isNodeVisible(activeNode.stage, activeStage);
          const isDanger =
            isBefore &&
            (activeNode.id === "raw-agent" ||
              activeNode.id === "no-governance" ||
              activeNode.id === "no-audit");

          return (
            <div
              key={layer.label}
              className="flex w-full flex-col items-center"
            >
              <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.2em] text-brand-muted/25">
                {layer.label}
              </p>

              <div className="w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeNode.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                  >
                    {isGuardian ? (
                      <GuardianNode
                        node={activeNode}
                        active={isVisible}
                        isNew={isNew(activeNode.stage)}
                      />
                    ) : isInternal ? (
                      <InternalNode node={activeNode} active={isVisible} />
                    ) : (
                      <ExternalNode
                        node={activeNode}
                        active={isVisible}
                        danger={isDanger}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {layerIdx < LAYERS.length - 1 && (
                <FlowArrow
                  active={isVisible}
                  danger={isBefore && layerIdx < 3}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage selector */}
      <div className="mt-6">
        <div className="flex items-center justify-center gap-2">
          {(["before", "after"] as const).map((stage) => {
            const isActive = stage === activeStage;
            const info = STAGE_INFO[stage];
            const styles =
              stage === "before"
                ? {
                    activeBg: "bg-red-500/10",
                    activeBorder: "border-red-500/25",
                    numberBg: "bg-red-500/15",
                    numberText: "text-red-400",
                    progressBar: "bg-red-400/50",
                  }
                : {
                    activeBg:
                      "bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10",
                    activeBorder: "border-brand-cyan/25",
                    numberBg:
                      "bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20",
                    numberText: "text-white",
                    progressBar:
                      "bg-gradient-to-r from-brand-purple/50 to-brand-cyan/50",
                  };

            return (
              <button
                key={stage}
                onClick={() => {
                  setPrevStage(activeStage);
                  setActiveStage(stage);
                }}
                className={`group relative flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all duration-500 ${
                  isActive
                    ? `${styles.activeBg} ${styles.activeBorder} text-white`
                    : "border-transparent text-brand-muted/40 hover:text-brand-muted/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-500 ${
                    isActive
                      ? `${styles.numberBg} ${styles.numberText}`
                      : "bg-brand-dark-quaternary/20 text-brand-muted/30"
                  }`}
                >
                  {stage === "before" ? "1" : "2"}
                </span>
                <span className="font-medium">{info.name}</span>
                {isActive && (
                  <motion.div
                    className={`absolute bottom-0 left-2 right-2 h-0.5 origin-left rounded-full ${styles.progressBar}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: "linear" }}
                    key={`progress-${stage}-${Date.now()}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className={`text-sm font-medium ${
                  isBefore ? "text-red-400" : "text-brand-cyan"
                }`}
              >
                {STAGE_INFO[activeStage].label}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[12px] text-brand-muted/60">
                {STAGE_INFO[activeStage].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
