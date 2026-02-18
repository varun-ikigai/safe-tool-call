// ─── Brand Tokens ──────────────────────────────────────

export const BRAND = {
  cyan: "#2DFFFF",
  purple: "#7822FF",
  dark: "#0C0028",
  darkSecondary: "#050039",
  darkTertiary: "#161042",
  darkQuaternary: "#332651",
  darkQuintinary: "#241D58",
  white: "#FFFFFF",
  muted: "#D8D0EA",
} as const;

// ─── Navigation ────────────────────────────────────────

export const NAV_LINKS = [
  { label: "The Journey", href: "/story" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Architecture", href: "/#architecture" },
  { label: "For Teams", href: "/#built-for" },
] as const;

// ─── External Links ────────────────────────────────────

export const LINKS = {
  consultation: "https://www.ikigaidigital.io/",
  website: "https://www.ikigaidigital.io/",
  github: "https://github.com/ikigai-digital",
  logoSvg:
    "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c9a108c17bebd457976a1b_885afa55caacc2f06ce573368d5fd10c_Ikigai_logo.svg",
  favicon:
    "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c99d98cd6ab1e8cca5fa8d_ikigai-favicon.png",
} as const;

// ─── Audience Cards ────────────────────────────────────

export interface AudienceCard {
  id: string;
  title: string;
  description: string;
}

export const AUDIENCE_CARDS: AudienceCard[] = [
  {
    id: "microservice-teams",
    title: "Microservice Teams",
    description:
      "You own the gRPC service. You author the tool manifest. You declare what's exposed to agents — inputs, outputs, permissions, classification. Nobody else can widen your attack surface.",
  },
  {
    id: "platform-engineers",
    title: "Platform Engineers",
    description:
      "Wrap kubectl, logcli, argocd, git as bounded tools. Agents can read pod health, query logs, check deployment status — without the blast radius of raw CLI access.",
  },
  {
    id: "security-compliance",
    title: "Security & Compliance",
    description:
      "Every tool call produces a structured audit entry. Every denial is logged. PII is never in cleartext. The boundary is mechanical, not advisory — a fundamentally different compliance artefact.",
  },
  {
    id: "engineering-leadership",
    title: "Engineering Leadership",
    description:
      "Deploy AI agents against real systems with confidence. The gap between model capability and model trustworthiness is what Guardian fills — mechanically, not probabilistically.",
  },
];

// ─── Pipeline Gates ────────────────────────────────────

export const PIPELINE_GATES = [
  "Registry",
  "Permission",
  "Schema",
  "Execute",
  "Output",
  "PII Filter",
  "Audit",
] as const;

// ─── Feature Pills (Tool Manifests Section) ────────────

export const TOOL_MANIFEST_FEATURES = [
  "Type-safe — Zod schemas are the source of truth",
  "Default deny — unlisted output fields are stripped",
  "jq-style paths — output policies use familiar syntax",
] as const;

// ─── Two Layers ────────────────────────────────────────

export const LAYER_ONE = {
  title: "Layer 1: The Container",
  subtitle: "Exclusivity",
  description:
    "The agent runs locked-down. No bash, no filesystem, no CLI tools. Network: only LLM API + MCP server. The container enforces what the agent can connect to.",
  items: ["No bash", "No filesystem", "No CLI tools", "Network: LLM API + MCP only"],
};

export const LAYER_TWO = {
  title: "Layer 2: The MCP Server",
  subtitle: "Governance",
  description:
    "Schema validation, permission checks, PII filtering, audit logging, bounded execution. The MCP server enforces how tools are called.",
  items: [
    "Schema validation (Zod)",
    "JWT permission checks",
    "PII output filtering",
    "Structured audit trail",
  ],
};

// ─── How It Works ──────────────────────────────────────

export const HOW_IT_WORKS = [
  {
    title: "Instead of this",
    code: `bash("logcli query '{namespace=\"customer-data\"}' --limit 100")
bash("git diff main..release/1.1.19 -- src/")
bash("argocd app get customer-master-service -o json")`,
  },
  {
    title: "The agent gets this",
    code: `query_logs({ namespace: "customer-data", limit: 100 })
git_diff_branches({ base: "main", compare: "release/1.1.19" })
argocd_get_app({ name: "customer-master-service" })`,
  },
  {
    title: "What happens",
    code: `1. Schema validates the input (Zod)
2. Permissions checked against JWT
3. Executed via bounded handler
4. Output filtered for PII
5. Audit entry written`,
  },
];
