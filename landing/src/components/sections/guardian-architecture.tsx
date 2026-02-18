"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInUp } from "@/lib/animations";

// ─── CISO summary cards ────────────────────────────────

const CISO_QUESTIONS = [
  {
    question: "Can an agent run arbitrary commands?",
    answer:
      "No. Guardian Agents runs in a locked-down container. No bash, no filesystem, no CLI. Only typed tool calls through the MCP server.",
    product: "Agents",
    color: "#7822FF",
  },
  {
    question: "Can an agent access data it shouldn't?",
    answer:
      "No. Guardian Tool Calls validates every input, checks JWT permissions, and strips unlisted output fields before the agent sees them.",
    product: "Tool Calls",
    color: "#2DFFFF",
  },
  {
    question: "Can an agent loop and rack up costs?",
    answer:
      "No. Guardian Agents has rate limiting, cost controls, checkpoint review, and a kill switch built into the runtime.",
    product: "Agents",
    color: "#7822FF",
  },
  {
    question: "Can we prove compliance to a regulator?",
    answer:
      "Yes. Every call — allowed or denied — produces a structured audit entry. Queryable, exportable, SIEM-ready.",
    product: "Both",
    color: "#D8D0EA",
  },
];

// ─── Main section ──────────────────────────────────────

export function GuardianArchitecture() {
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
          <Eyebrow>THE BOUNDARY</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          What your CISO will ask
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mb-12 max-w-2xl text-lg text-brand-muted"
        >
          The questions that matter. The answers that are mechanical, not advisory.
        </motion.p>

        <div className="grid gap-4 sm:grid-cols-2">
          {CISO_QUESTIONS.map((q, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="rounded-xl border border-brand-dark-quaternary/30 bg-brand-dark-tertiary/20 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${q.color}12`,
                    color: `${q.color}90`,
                  }}
                >
                  {q.product}
                </span>
              </div>
              <h4 className="text-base font-medium text-white mb-2">
                {q.question}
              </h4>
              <p className="text-sm text-brand-muted/60 leading-relaxed">
                {q.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
