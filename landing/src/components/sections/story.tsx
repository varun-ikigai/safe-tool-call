"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { GradientDivider } from "@/components/ui/gradient-divider";
import {
  staggerContainer,
  staggerContainerSlow,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
} from "@/lib/animations";
import { LINKS } from "@/lib/constants";
import {
  AIEditorAnimation,
  KnowledgeFlowAnimation,
  AgentLoopAnimation,
  DecisionForkAnimation,
  GuardianAnswerAnimation,
} from "@/components/animations/story-animations";

// ─── Stage data ────────────────────────────────────────

interface JourneyStage {
  number: string;
  eyebrow: string;
  heading: string;
  body: string[];
  accent: "muted" | "cyan" | "purple" | "red" | "gradient";
  signals?: string[];
  animation: ReactNode;
}

const STAGES: JourneyStage[] = [
  {
    number: "01",
    eyebrow: "WHERE YOU ARE NOW",
    heading: "Your developers are already using AI",
    accent: "cyan",
    body: [
      "GitHub Copilot. Cursor. ChatGPT. Claude. Your engineering teams adopted these tools the moment they were available — not because anyone mandated it, but because they work.",
      "Code completion, test generation, documentation, debugging, PR review. AI is embedded in your software delivery lifecycle whether your governance framework accounts for it or not.",
    ],
    signals: [
      "70%+ of your developers use AI-assisted coding tools daily",
      "Pull request throughput has visibly increased",
      "Your security team is asking questions about code provenance",
    ],
    animation: <AIEditorAnimation />,
  },
  {
    number: "02",
    eyebrow: "WHAT COMES NEXT",
    heading: "From developer tools to organisational intelligence",
    accent: "cyan",
    body: [
      "The next step isn't more developer tools. It's capturing the intelligence that lives in your people's heads and making it available to AI — your domain models, your architectural decisions, your compliance requirements, your operational playbooks.",
      "This is the shift from AI-assisted individuals to AI-augmented organisations. Knowledge bases that agents can reason over. Product specifications that AI can trace to code. Deployment patterns that AI understands at the same depth your senior engineers do.",
    ],
    signals: [
      "You're investing in knowledge management or documentation platforms",
      "Teams are experimenting with RAG over internal docs",
      "Your CTO is talking about 'AI-native' workflows",
    ],
    animation: <KnowledgeFlowAnimation />,
  },
  {
    number: "03",
    eyebrow: "THE INEVITABLE",
    heading: "You'll want agents running alongside your systems",
    accent: "purple",
    body: [
      "Once the intelligence is captured and the tooling is mature, the economics become irresistible. An agent that can triage a production incident, read logs, check deployment state, trace the last release, and draft a root cause analysis — at 3am, without waking anyone up.",
      "An agent that can review a proposed configuration change against your compliance requirements, check the blast radius, and approve or escalate — in seconds, not days.",
      "This isn't speculative. This is the trajectory every bank on an AI maturity journey is following. The only question is when, not whether.",
    ],
    signals: [
      "Your platform team is evaluating agent frameworks",
      "Someone has already built a proof-of-concept agent internally",
      "You're benchmarking the cost of 24/7 on-call against agent-assisted operations",
    ],
    animation: <AgentLoopAnimation />,
  },
  {
    number: "04",
    eyebrow: "THE QUESTION",
    heading: "How do you prove it's safe?",
    accent: "red",
    body: [
      "This is where every AI maturity journey hits a wall. The agent that can triage incidents can also misread a log and trigger a rollback. The agent that can check compliance can also hallucinate a rule that doesn't exist. The agent with kubectl access is one confused reasoning step away from production impact.",
      "Your CISO will ask: \"What stops this agent from doing something catastrophic?\"",
      "If your answer is \"we wrote instructions in the system prompt and the model is very good\" — you don't have an answer. You have a prayer. Prompt-level constraints degrade with context length. They're vulnerable to injection. They leave no audit trail. A regulator will not accept them as a control.",
    ],
    animation: <DecisionForkAnimation />,
  },
  {
    number: "05",
    eyebrow: "THE ANSWER",
    heading: "Guardian is ready when you are",
    accent: "gradient",
    body: [
      "Guardian isn't a product you need today. It's the product you'll need the day you decide to run an agent against a real system with real consequences.",
      "Guardian Agents is the governed runtime — a hardened agent loop with rate limiting, checkpoint review, kill switches, and cost controls built in. Not bolted on. Built in. The agent container has no bash, no filesystem, no CLI tools. It can only reach the LLM and the governed MCP server.",
      "Guardian Tool Calls is the governed MCP server — every tool call validated against typed schemas, checked against JWT permissions, filtered for PII, and logged to a structured audit trail. Deny by default. Mechanical, not advisory.",
      "Two products that are the architecture itself. When your regulator asks how you control your agents, you point at Guardian — not at a system prompt.",
    ],
    animation: <GuardianAnswerAnimation />,
  },
];

// ─── Accent helpers ────────────────────────────────────

function getAccentColor(accent: JourneyStage["accent"]): string {
  switch (accent) {
    case "cyan":
      return "#2DFFFF";
    case "purple":
      return "#7822FF";
    case "red":
      return "#f87171";
    case "gradient":
      return "#2DFFFF";
    default:
      return "#D8D0EA";
  }
}

function getNumberStyle(accent: JourneyStage["accent"]): string {
  switch (accent) {
    case "cyan":
      return "text-brand-cyan/30";
    case "purple":
      return "text-brand-purple/30";
    case "red":
      return "text-red-400/30";
    case "gradient":
      return "text-gradient-brand";
    default:
      return "text-brand-muted/20";
  }
}

function getBorderStyle(accent: JourneyStage["accent"]): string {
  switch (accent) {
    case "cyan":
      return "border-t-brand-cyan";
    case "purple":
      return "border-t-brand-purple";
    case "red":
      return "border-t-red-400";
    case "gradient":
      return "border-t-brand-cyan";
    default:
      return "border-t-brand-dark-quaternary";
  }
}

// ─── Story Hero ────────────────────────────────────────

function StoryHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-28 pb-20">
      <div
        className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full opacity-8 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #7822FF 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp} className="mb-6">
          <Eyebrow>THE JOURNEY</Eyebrow>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="mb-8 max-w-4xl text-5xl font-light tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          AI adoption isn&apos;t coming.
          <br />
          <span className="text-gradient-brand">It&apos;s here.</span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="mb-6 max-w-2xl text-xl text-brand-muted leading-relaxed"
        >
          Every bank is on the same path. The question isn&apos;t whether
          you&apos;ll deploy AI agents in production. It&apos;s whether
          you&apos;ll have the trust layer in place when you do.
        </motion.p>

        <motion.p
          variants={fadeInUp}
          className="max-w-2xl text-base text-brand-muted/60"
        >
          This is the journey. Five stages. Every bank. No exceptions.
        </motion.p>
      </motion.div>
    </section>
  );
}

// ─── Journey Stage Section ─────────────────────────────

function StageSection({
  stage,
  index,
}: {
  stage: JourneyStage;
  index: number;
}) {
  const isEven = index % 2 === 0;
  const bgClass = isEven ? "bg-brand-dark" : "bg-brand-dark-secondary";
  const accentColor = getAccentColor(stage.accent);

  return (
    <section className={`${bgClass} py-24 md:py-32`}>
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Two-column: content + animation */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          {/* Content column */}
          <motion.div
            variants={fadeInLeft}
            className="lg:col-span-7"
          >
            {/* Number + eyebrow row */}
            <div className="flex items-baseline gap-5 mb-6">
              <span
                className={`text-6xl font-light tracking-tighter md:text-7xl ${getNumberStyle(stage.accent)}`}
              >
                {stage.number}
              </span>
              <div>
                <div
                  className={`border-t-2 ${getBorderStyle(stage.accent)} w-10 mb-3`}
                />
                <Eyebrow>{stage.eyebrow}</Eyebrow>
              </div>
            </div>

            <h2 className="mb-8 text-3xl font-light tracking-tight text-white md:text-4xl lg:text-5xl">
              {stage.heading}
            </h2>

            <div className="space-y-5 mb-8">
              {stage.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="max-w-2xl text-base text-brand-muted leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Signals */}
            {stage.signals && (
              <div className="rounded-xl border border-brand-dark-quaternary/30 bg-brand-dark-tertiary/20 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-muted/40 mb-3">
                  You know you&apos;re here when
                </p>
                <ul className="space-y-2.5">
                  {stage.signals.map((signal, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: `${accentColor}80` }}
                      />
                      <span className="text-sm text-brand-muted">
                        {signal}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quote for stage 4 */}
            {stage.accent === "red" && (
              <div className="mt-8 border-l-2 border-red-400/30 pl-6">
                <p className="text-lg italic text-red-300/60">
                  &ldquo;Trust in an LLM&apos;s obedience is not a security
                  control.&rdquo;
                </p>
              </div>
            )}
          </motion.div>

          {/* Animation column */}
          <motion.div
            variants={fadeInRight}
            className="lg:col-span-5"
          >
            <div className="lg:sticky lg:top-32 lg:pt-16">
              {stage.animation}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Timeline connector ────────────────────────────────

function TimelineConnector() {
  return (
    <div className="relative">
      <GradientDivider />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-3 w-3 rounded-full bg-brand-dark-quaternary/50 border border-brand-dark-quaternary/30" />
      </div>
    </div>
  );
}

// ─── Story CTA ─────────────────────────────────────────

function StoryCTA() {
  return (
    <section className="relative overflow-hidden bg-brand-dark-secondary py-24 md:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-12 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #7822FF 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8"
        variants={staggerContainerSlow}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-6">
          <Eyebrow>YOUR MOVE</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mx-auto mb-8 max-w-3xl text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          You don&apos;t need Guardian today.
          <br />
          <span className="text-gradient-brand">But you will.</span>
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mb-6 max-w-2xl text-lg text-brand-muted"
        >
          The banks that move fastest are the ones that build the trust layer
          before they need it — not after an incident forces their hand.
        </motion.p>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mb-10 max-w-2xl text-base text-brand-muted/60"
        >
          Talk to us about where you are on the journey. Whether you&apos;re at
          stage one or stage four, we can help you plan what comes next.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button href={LINKS.consultation} size="lg">
            Book a Conversation
          </Button>
          <Button href="/" variant="secondary" size="lg">
            See Guardian
          </Button>
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="mt-8 text-sm text-brand-muted/40"
        >
          Or email us at{" "}
          <a
            href="mailto:hello@ikigaidigital.io"
            className="text-brand-cyan/60 underline underline-offset-4 transition-colors hover:text-white"
          >
            hello@ikigaidigital.io
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}

// ─── Main exported component ───────────────────────────

export function StoryPage() {
  return (
    <>
      <StoryHero />
      {STAGES.map((stage, i) => (
        <div key={stage.number}>
          <TimelineConnector />
          <StageSection stage={stage} index={i} />
        </div>
      ))}
      <TimelineConnector />
      <StoryCTA />
    </>
  );
}
