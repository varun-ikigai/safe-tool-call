"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInLeft, fadeInUp, fadeInRight } from "@/lib/animations";
import { HOW_IT_WORKS } from "@/lib/constants";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-brand-dark-secondary py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>HOW IT WORKS</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-16 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          Bounded tools, not bash access
        </motion.h2>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Column 1: Instead of this */}
          <motion.div variants={fadeInLeft} className="space-y-4">
            <h3 className="text-lg font-medium text-brand-muted">
              Instead of this
            </h3>
            <CodeBlock code={HOW_IT_WORKS[0].code} />
          </motion.div>

          {/* Column 2: The agent gets this */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h3 className="text-lg font-medium text-brand-cyan">
              The agent gets this
            </h3>
            <CodeBlock code={HOW_IT_WORKS[1].code} highlighted />
          </motion.div>

          {/* Column 3: What happens */}
          <motion.div variants={fadeInRight} className="space-y-4">
            <h3 className="text-lg font-medium text-brand-purple">
              What happens
            </h3>
            <CodeBlock code={HOW_IT_WORKS[2].code} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function CodeBlock({
  code,
  highlighted = false,
}: {
  code: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border font-mono text-sm leading-relaxed ${
        highlighted
          ? "border-brand-cyan/30 bg-brand-dark-tertiary/50"
          : "border-brand-dark-quaternary/40 bg-brand-dark-tertiary/30"
      }`}
    >
      <div className="flex gap-1.5 px-4 py-2 border-b border-brand-dark-quaternary/30">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
      </div>
      <pre
        className={`p-4 overflow-x-auto ${
          highlighted ? "text-brand-cyan" : "text-brand-muted/70"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
