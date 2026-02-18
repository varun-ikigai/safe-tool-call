"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { LINKS } from "@/lib/constants";
import { ArchitectureInfographic } from "@/components/animations/architecture-infographic";

// ─── Hero ──────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-20">
      {/* Background glow orbs */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px] rounded-full opacity-10 blur-[120px]"
        style={{ background: "radial-gradient(circle, #7822FF 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, #2DFFFF 0%, transparent 70%)" }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left: Text */}
          <div>
            <motion.div variants={fadeInUp} className="mb-6">
              <Eyebrow>IKIGAI GUARDIAN</Eyebrow>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl font-light tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              Mechanical trust
              <br />
              for{" "}
              <span className="text-gradient-brand">AI agents</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mb-10 max-w-lg text-lg text-brand-muted"
            >
              Two products that <span className="text-white italic">are</span> the
              architecture. Guardian Agents is the governed runtime. Guardian Tool
              Calls is the governed MCP server. Every tool call validated. Every
              output filtered. Every action audited.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button href={LINKS.consultation} size="lg">
                Book a Demo
              </Button>
              <Button href="#the-risk" variant="secondary" size="lg">
                See the Risk
              </Button>
            </motion.div>
          </div>

          {/* Right: Architecture infographic */}
          <motion.div variants={fadeInUp}>
            <ArchitectureInfographic />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
