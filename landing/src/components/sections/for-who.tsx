"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Card } from "@/components/ui/card";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { AUDIENCE_CARDS } from "@/lib/constants";

export function ForWho() {
  return (
    <section id="built-for" className="bg-brand-dark-secondary py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>BUILT FOR</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-16 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          For the teams that build and operate banking infrastructure
        </motion.h2>

        {/* 2x2 Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {AUDIENCE_CARDS.map((card, index) => (
            <motion.div key={card.id} variants={fadeInUp}>
              <Card className="h-full">
                <h3 className="mb-3 text-xl font-medium text-white">
                  {card.title}
                </h3>
                <p className="text-brand-muted">{card.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
