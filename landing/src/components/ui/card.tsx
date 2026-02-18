"use client";

import { motion } from "framer-motion";
import { fadeInUp, viewportOnce } from "@/lib/animations";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function Card({ children, className = "", animate = true }: CardProps) {
  const base =
    "bg-gradient-card rounded-2xl border border-brand-dark-quaternary/50 p-8";

  if (!animate) {
    return <div className={`${base} ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`${base} ${className}`}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}
