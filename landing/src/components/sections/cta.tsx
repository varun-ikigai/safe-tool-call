"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { LINKS } from "@/lib/constants";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-brand-dark-secondary py-24 md:py-32">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, #7822FF 0%, transparent 70%)" }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp} className="mb-6">
          <Eyebrow>GET STARTED</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mx-auto mb-6 max-w-3xl text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          Ready to deploy agents you can prove are safe?
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mb-10 max-w-2xl text-lg text-brand-muted"
        >
          Guardian is open source. The governance layer is free. Enterprise
          support and the full Ikigai Intelligence platform are available for
          banks ready to move.
        </motion.p>

        <motion.div variants={fadeInUp} className="mb-6">
          <Button href={LINKS.consultation} size="lg">
            Book a Demo
          </Button>
        </motion.div>

        <motion.p variants={fadeInUp} className="text-sm text-brand-muted">
          Or explore the code on{" "}
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-cyan underline underline-offset-4 transition-colors hover:text-white"
          >
            GitHub
          </a>
        </motion.p>

        <motion.p variants={fadeInUp} className="mt-8 text-sm text-brand-muted/60">
          Or email us at{" "}
          <a
            href="mailto:hello@ikigaidigital.io"
            className="text-brand-cyan underline underline-offset-4 transition-colors hover:text-white"
          >
            hello@ikigaidigital.io
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
