# Ikigai Guardian: Landing Page Plan

## Overview

A standalone product landing page for **Ikigai Guardian** — the governed runtime proxy for AI agents in banking. This page is the public-facing articulation of everything in Safe Tool Call + Safe Agents.

**Source material:** MANIFESTO.md, plans/plan.md, DESIGN_DECISIONS.md, FAQ.md, MANIFESTO_UPDATE (now merged)

**Design system:** Clone the Ikigai Intelligence site (`/Users/vv/Playground/ikigai-intelligence/site/`) — same stack, same brand tokens, same animation patterns. This is a product page within the Ikigai family, not a separate brand.

---

## Tech Stack (Identical to Ikigai Site)

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Animations:** Framer Motion v12
- **Icons:** Lucide React + custom SVG icons
- **Font:** Inter (300–700 weights via `next/font/google`)
- **Language:** TypeScript (strict)
- **Runtime:** Bun

### Package.json Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^12.34.0",
    "lucide-react": "^0.564.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## Brand Tokens (Reuse Exactly)

```css
--color-brand-cyan: #2DFFFF;
--color-brand-purple: #7822FF;
--color-brand-dark: #0C0028;
--color-brand-dark-secondary: #050039;
--color-brand-dark-tertiary: #161042;
--color-brand-dark-quaternary: #332651;
--color-brand-dark-quintinary: #241D58;
--color-brand-white: #FFFFFF;
--color-brand-muted: #D8D0EA;
```

### Utility Classes (Copy from globals.css)

- `.text-gradient-brand` — cyan→purple gradient text
- `.text-gradient-cyan-white` — cyan→white gradient text
- `.bg-gradient-dark` — dark vertical gradient
- `.bg-gradient-card` — card diagonal gradient
- `.bg-gradient-section` — section reverse gradient
- `.glow-cyan` / `.glow-purple` — box shadow glow effects

---

## Animation System (Reuse Exactly)

Copy `src/lib/animations.ts` from the Ikigai site. All section animations use the same patterns:

### Variant Library

| Variant | Effect | Duration | Easing |
|---------|--------|----------|--------|
| `fadeInUp` | opacity 0→1, y 24→0 | 0.6s | cubic-bezier(0.25, 0.1, 0.25, 1) |
| `fadeIn` | opacity 0→1 | 0.6s | easeOut |
| `fadeInLeft` | opacity 0→1, x -24→0 | 0.6s | cubic-bezier |
| `fadeInRight` | opacity 0→1, x 24→0 | 0.6s | cubic-bezier |
| `scaleIn` | opacity 0→1, scale 0.9→1 | 0.5s | cubic-bezier |
| `staggerContainer` | staggerChildren 0.12, delay 0.1 | — | — |
| `staggerContainerSlow` | staggerChildren 0.2, delay 0.15 | — | — |

### Animation Pattern

Every section follows the same structure:

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"        // scroll-triggered (most sections)
  // OR animate="visible"      // immediate (hero, CTA)
  viewport={{ once: true, margin: "-80px" }}
>
  <motion.div variants={fadeInUp}>...</motion.div>
  <motion.div variants={fadeInUp}>...</motion.div>
</motion.div>
```

### Background Effects

- **Glow orbs:** `pointer-events-none absolute` divs with `radial-gradient` + `blur-[100-120px]` + low opacity (0.10–0.15)
- Used in Hero and CTA sections
- Purple glow top-left, cyan glow bottom-right (or centered for CTA)

---

## UI Components (Reuse from Ikigai Site)

Copy these components directly:

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `ui/button.tsx` | Primary/secondary CTA, pill-shaped, glow hover |
| `Card` | `ui/card.tsx` | Content cards with gradient bg + border |
| `Eyebrow` | `ui/eyebrow.tsx` | Section label: `/ SECTION NAME` in cyan uppercase tracking |
| `GradientDivider` | `ui/gradient-divider.tsx` | Horizontal gradient line separator |
| `Section` | `ui/section.tsx` | Section wrapper with bg variants |
| `Header` | `layout/header.tsx` | Fixed header with blur backdrop |
| `Footer` | `layout/footer.tsx` | Footer with logo + links |
| `GuardianIcon` | `icons/guardian-icon.tsx` | Shield+lock SVG icon |
| `GuardianAnimation` | `animations/guardian-animation.tsx` | Tool call enforcement animation |

---

## Page Structure

### File Structure

```
src/
  app/
    globals.css          # Copy from ikigai-site
    layout.tsx           # Same structure, Guardian metadata
    page.tsx             # Section composition
  components/
    animations/
      governance-pipeline.tsx    # NEW: animated pipeline diagram
      tool-call-enforcement.tsx  # ADAPTED: from guardian-animation.tsx
      two-layer-architecture.tsx # NEW: container + MCP server visual
    icons/
      guardian-icon.tsx          # Copy from ikigai-site
      shield-icon.tsx            # NEW: for feature cards
      lock-icon.tsx              # NEW: for feature cards
    layout/
      header.tsx                 # Adapted (Guardian branding)
      footer.tsx                 # Copy from ikigai-site
    sections/
      hero.tsx
      problem.tsx
      how-it-works.tsx
      governance-pipeline.tsx
      two-layers.tsx
      tool-manifests.tsx
      safe-agents-preview.tsx
      for-who.tsx
      cta.tsx
    ui/
      button.tsx               # Copy
      card.tsx                 # Copy
      eyebrow.tsx              # Copy
      gradient-divider.tsx     # Copy
      section.tsx              # Copy
      code-block.tsx           # NEW: styled code snippet display
  lib/
    animations.ts              # Copy from ikigai-site
    constants.ts               # NEW: Guardian-specific content
```

---

## Section-by-Section Specification

### 1. Header

**Adapted from:** `layout/header.tsx`

- Fixed position, blur backdrop, same styling
- Logo: Ikigai logo + `|` + `Guardian` (instead of `Intelligence`)
- Nav links: `How It Works`, `Architecture`, `For Teams`, `Open Source` (or similar)
- CTA button: `Book a Demo` → links to consultation URL

### 2. Hero

**Pattern:** Same as Ikigai hero — centered text, stagger animations, glow orbs

**Content:**

- Eyebrow: `/ IKIGAI GUARDIAN`
- H1: `Mechanical trust for AI agents` (with `Mechanical trust` in `.text-gradient-brand`)
- Subtitle: "Prompt guardrails are probabilistic. Guardian is mechanical. A governed runtime proxy that sits between AI agents and your banking infrastructure — validating every tool call, filtering every output, auditing every action."
- CTAs: `Book a Demo` (primary) + `Read the Manifesto` (secondary, links to GitHub/docs)
- Background: Purple glow top-left, cyan glow bottom-right

### 3. Problem

**Pattern:** Same as Ikigai problem — eyebrow + heading + 2-column cards

**Content:**

- Eyebrow: `/ THE PROBLEM`
- H2: `The default interface between AI and your infrastructure is unrestricted`
- Card 1: **"The Bash Problem"** — Give an agent bash access and a polite system prompt... `kubectl delete namespace production` is one hallucination away. LLM obedience is not a security control.
- Card 2: **"The Escalation Problem"** — Smarter models get deployed in higher-stakes environments. More autonomy. Broader tool access. The blast radius grows with every increment in capability. Prompt-level constraints degrade with context length.
- Bottom text: "The answer should be a mechanical no, not a probabilistic one."

### 4. How It Works

**Pattern:** Unique — 3-step with icons and animated code snippets

**Content:**

- Eyebrow: `/ HOW IT WORKS`
- H2: `Bounded tools, not bash access`
- Three columns showing the transformation:

**Column 1: Instead of this**
```
bash("logcli query '{namespace=\"customer-data\"}' --limit 100")
bash("git diff main..release/1.1.19 -- src/")
bash("argocd app get customer-master-service -o json")
```

**Column 2: The agent gets this**
```
query_logs({ namespace: "customer-data", limit: 100 })
git_diff_branches({ base: "main", compare: "release/1.1.19" })
argocd_get_app({ name: "customer-master-service" })
```

**Column 3: What happens mechanically**
- Schema validates the input (Zod)
- Permissions checked against JWT
- Executed via bounded handler (no shell)
- Output filtered for PII
- Audit entry written

Use the `code-block.tsx` component with syntax-highlighted mono text. Animate columns with `fadeInLeft`, `fadeInUp`, `fadeInRight` stagger.

### 5. Governance Pipeline

**Pattern:** Full-width animated diagram (similar to architecture-infographic)

**Content:**

- Eyebrow: `/ THE PIPELINE`
- H2: `Seven gates. Every call.`
- Animated horizontal pipeline showing the 7 stages:

```
Registry → Permission → Schema → Execute → Output Validate → PII Filter → Audit
```

- Each gate lights up in sequence (cyan→purple gradient pulse)
- Below pipeline: the `GuardianAnimation` component (tool call enforcement demo) — adapted from the Ikigai site's `guardian-animation.tsx`
- Show 4 scenarios cycling: allowed call, permission denied, unregistered tool rejected, PII filtered

**Animation approach:** Reuse the `GuardianAnimation` component's approach — `IntersectionObserver` triggers, async step-by-step reveal, status badges. Enhance with the pipeline header becoming a persistent visual above the cycling scenarios.

### 6. Two Layers

**Pattern:** Side-by-side with animated diagram (like product-deep-dive alternating layout)

**Content:**

- Eyebrow: `/ ARCHITECTURE`
- H2: `Two layers. Neither sufficient alone.`

**Left side (text):**
- **Layer 1: The Container** — The agent runs locked-down. No bash, no filesystem, no CLI tools. Network: only LLM API + MCP server. The container enforces *what the agent can connect to*.
- **Layer 2: The MCP Server** — Schema validation, permission checks, PII filtering, audit logging, bounded execution. The MCP server enforces *how tools are called*.
- Pull quote: "No amount of context rot, prompt injection, or model hallucination can bypass this boundary."

**Right side (animation):**
- `two-layer-architecture.tsx` — Animated version of the ASCII architecture diagram from the manifesto
- Two stacked boxes (containers), data flow arrows between them, pulsing dots showing MCP protocol traffic
- Similar animation style to the architecture-infographic flow arrows and data pulses

### 7. Tool Manifests

**Pattern:** Code-first section — large code block with annotations

**Content:**

- Eyebrow: `/ DEVELOPER EXPERIENCE`
- H2: `15 lines of TypeScript. That's your entire tool manifest.`

Show a real tool manifest with inline annotations:

```typescript
defineTool({
  name: "get_customer",                           // ← snake_case, matches LLM function calling
  description: "Retrieve a customer by ID",
  classification: "read",                          // ← read | write | destructive
  
  permissions: {
    required: ["customer-data:read"],               // ← JWT must have this
  },

  input: z.object({
    customerId: z.string().uuid(),                  // ← Zod validates before execution
  }),

  outputPolicy: {
    ".customer.id": "allow",
    ".customer.status": "allow",
    ".customer.fullName": "mask",                   // ← "J*** S****"
    "..email": "redact",                            // ← stripped entirely
  },

  handler: cliCommand({                             // ← or grpcMethod()
    command: "customer-cli",
    argsBuilder: (input) => ["get", input.customerId],
  }),
})
```

- Annotations appear as small tooltips/labels next to each line, stagger-animated on scroll
- Below the code block: 3 feature pills in a row:
  - "Type-safe — Zod schemas are the source of truth"
  - "Default deny — unlisted output fields are stripped"
  - "jq-style paths — output policies use familiar syntax"

### 8. Architecture Diagram (Full Stack)

**Pattern:** Full-width animated architecture diagram (inspired by Ikigai Intelligence platform-overview with ArchitectureInfographic). Shows the complete Guardian stack in context with a bank's services and observability.

**Content:**

- Eyebrow: `/ THE ARCHITECTURE`
- H2: `Two products. One complete boundary.`
- Animated diagram showing the transition from "dumb agents with raw access" to "Guardian-governed agents"

**Architecture nodes (top to bottom):**
- **Guardian Agents** (the agent runtime, built on FastAgent) — cyan/purple branded, shows: locked-down container, rate limiting, checkpoint review, kill switch, cost controls
- **Guardian Tool Calls** (the governed MCP server) — cyan branded, shows: registry, permission, schema, execute, PII filter, audit pipeline
- **Bank's Infrastructure** — gRPC services, Kubernetes, ArgoCD, Loki, Git
- **Observability** — structured audit logs flowing to bank's SIEM/logging

**Animation:** Transition from a "before" state (raw agent with bash access to everything) to an "after" state (Guardian Agents + Guardian Tool Calls governing all access). Stage-based reveal like the Ikigai ArchitectureInfographic.

**Key message:** Guardian Agents IS the agent — not a sidecar. Guardian Tool Calls IS the MCP server. The two products ARE the architecture.

### 9. For Who

**Pattern:** 2×2 grid of cards (same as why-ikigai section)

**Content:**

- Eyebrow: `/ BUILT FOR`
- H2: `For the teams that build and operate banking infrastructure`

**Card 1: Microservice Teams**
"You own the gRPC service. You author the tool manifest. You declare what's exposed to agents — inputs, outputs, permissions, classification. Nobody else can widen your attack surface."

**Card 2: Platform Engineers**
"Wrap kubectl, logcli, argocd, git as bounded tools. Agents can read pod health, query logs, check deployment status — without the blast radius of raw CLI access."

**Card 3: Security & Compliance**
"Every tool call produces a structured audit entry. Every denial is logged. PII is never in cleartext. The boundary is mechanical, not advisory — a fundamentally different compliance artefact."

**Card 4: Engineering Leadership**
"Deploy AI agents against real systems with confidence. The gap between model capability and model trustworthiness is what Guardian fills — mechanically, not probabilistically."

### 10. CTA

**Pattern:** Same as Ikigai CTA — centered, glow orb, simple

**Content:**

- Eyebrow: `/ GET STARTED`
- H2: `Ready to deploy agents you can prove are safe?`
- Subtitle: "Guardian is open source. The governance layer is free. Enterprise support, Guardian Agents, and the full Ikigai Intelligence platform are available for banks ready to move."
- CTA: `Book a Demo` (primary)
- Sub-CTA: "Or explore the code on [GitHub](link)"
- Email: hello@ikigaidigital.io

### 11. Footer

**Copied from:** Ikigai site footer. Change branding to `Ikigai | Guardian`.

---

## New Components to Build

### `code-block.tsx`

Styled code display component:
- Dark background (`#0a0020` — same as guardian-animation panel)
- Mono font, syntax-highlighted (manual — use span colors, not a highlighting library)
- Title bar with dot + label (like guardian-animation's "Guardian Runtime" header)
- Optional line-by-line annotation labels (small, positioned to the right)
- Rounded-xl border with `border-[#332651]/40`

### `governance-pipeline.tsx` (Animation)

Horizontal pipeline animation:
- 7 nodes connected by gradient lines
- Nodes light up in sequence (left to right)
- Each node: small circle + label below
- Active node pulses with cyan glow
- Completed nodes stay lit (green check)
- Data pulse dot travels along the line (reuse `DataPulse` pattern from architecture-infographic)
- Loops continuously

### `two-layer-architecture.tsx` (Animation)

Animated architecture diagram:
- Two stacked rounded rectangles (Agent Container, MCP Server)
- Agent container: grayed out interior, labels "No bash. No filesystem."
- MCP Server: shows pipeline stages as small blocks inside
- Animated connection line between them with pulsing dot (MCP protocol)
- Both use the architecture-infographic's `FlowArrow` animation style
- Intersection observer triggered

### `tool-call-enforcement.tsx` (Animation)

Adapted from `guardian-animation.tsx`:
- Same core logic: cycle through tool calls, reveal enforcement steps one by one
- Same visual style: dark panel, mono font, gate pipeline header, status badges
- Add the collapsible explainer ("What does this mean in plain English?")
- Data is already in the guardian-animation — reuse TOOL_CALLS, GATE_COLORS, STATUS_STYLES

---

## Content Constants (`lib/constants.ts`)

```typescript
export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "For Teams", href: "#built-for" },
] as const;

export const LINKS = {
  consultation: "https://www.ikigaidigital.io/",
  website: "https://www.ikigaidigital.io/",
  github: "https://github.com/ikigai-digital/guardian",  // TBD
  logoSvg: "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c9a108c17bebd457976a1b_885afa55caacc2f06ce573368d5fd10c_Ikigai_logo.svg",
  favicon: "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c99d98cd6ab1e8cca5fa8d_ikigai-favicon.png",
} as const;

// Pipeline gates, tool call scenarios, feature cards, audience cards...
```

---

## Page Composition (`page.tsx`)

```tsx
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <GovernancePipeline />
        <TwoLayers />
        <ToolManifests />
        <SafeAgentsPreview />
        <ForWho />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
```

---

## Section Background Alternation

Follow the Ikigai site's pattern — alternate between `bg-brand-dark` and `bg-brand-dark-secondary`:

| Section | Background |
|---------|-----------|
| Hero | `bg-brand-dark` (with glow orbs) |
| Problem | `bg-brand-dark` |
| How It Works | `bg-brand-dark-secondary` |
| Governance Pipeline | `bg-brand-dark` |
| Two Layers | `bg-brand-dark-secondary` |
| Tool Manifests | `bg-brand-dark` |
| Architecture Diagram | `bg-brand-dark-secondary` |
| For Who | `bg-brand-dark` |
| CTA | `bg-brand-dark-secondary` (with glow orb) |

---

## SEO Metadata

```typescript
export const metadata: Metadata = {
  title: "Ikigai Guardian | Mechanical Trust for AI Agents in Banking",
  description:
    "A governed runtime proxy between AI agents and banking infrastructure. Schema validation, permission checks, PII filtering, and audit logging on every tool call. Mechanical, not probabilistic.",
  icons: {
    icon: "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c99d98cd6ab1e8cca5fa8d_ikigai-favicon.png",
  },
  openGraph: {
    title: "Ikigai Guardian | Mechanical Trust for AI Agents in Banking",
    description:
      "Every tool call validated, every output filtered, every action audited. The mechanical boundary between AI and your systems.",
    type: "website",
  },
};
```

---

## Key Messaging (Tone Guide)

Pull from the manifesto's voice:

- **Confident, not aggressive.** "This is how it works" not "everything else is broken"
- **Technical, not academic.** Show real code, real schemas, real architecture
- **Honest about limitations.** The FAQ and manifesto acknowledge what Guardian doesn't do — the landing page should too (via the architecture diagram showing both products)
- **"Mechanical" is the keyword.** Use it repeatedly. It's the differentiator. Mechanical vs. probabilistic. Mechanical vs. advisory. Mechanical boundary.
- **"Defence in depth" framing.** Two layers, seven gates, deny by default. Stack the controls.

Avoid:
- "AI safety" as a vague concept — be specific about what's enforced
- Buzzwords without substance — every claim should map to a concrete mechanism
- Overselling — don't claim Guardian prevents things it doesn't (sequence attacks, agent text output)
