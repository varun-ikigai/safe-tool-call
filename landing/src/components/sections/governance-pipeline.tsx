"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import { GuardianAnimation } from "@/components/animations/guardian-animation";

export function GovernancePipeline() {
  return (
    <section className="bg-brand-dark py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>THE PIPELINE</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          Four gates. Every call. No exceptions.
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mb-16 max-w-2xl text-lg text-brand-muted"
        >
          Watch real tool calls flow through Guardian&apos;s enforcement pipeline. 
          Schema validation, permission checks, PII filtering, and audit logging 
          — applied mechanically to every single call.
        </motion.p>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Left: Gate descriptions */}
          <motion.div variants={fadeInLeft} className="lg:col-span-2 space-y-6">
            {[
              {
                gate: "Schema",
                color: "#2DFFFF",
                description:
                  "Every input validated against Zod schemas. Invalid args rejected before any command executes.",
              },
              {
                gate: "Permission",
                color: "#f59e0b",
                description:
                  "JWT claims checked against tool requirements. No match, no execution. Destructive tools need elevated access.",
              },
              {
                gate: "PII Filter",
                color: "#a78bfa",
                description:
                  "Output fields allowlisted. Sensitive data masked or stripped before it reaches the agent. Default is deny.",
              },
              {
                gate: "Audit",
                color: "#4ade80",
                description:
                  "Every call — allowed or denied — logged with caller, tool, args hash, decision, and timing. Structured JSON, queryable.",
              },
            ].map((item) => (
              <div key={item.gate} className="flex gap-3">
                <div
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: item.color }}
                  >
                    {item.gate}
                  </h4>
                  <p className="mt-1 text-sm text-brand-muted/60">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right: Live animation */}
          <motion.div variants={fadeInRight} className="lg:col-span-3">
            <GuardianAnimation />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
