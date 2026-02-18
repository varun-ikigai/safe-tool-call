# Safe Tool Call

A governed MCP server for LLM agent tool calls. Two layers of enforcement: a locked-down agent container (the agent can only talk to the MCP server) and a governed MCP server (every tool call is schema-validated, permission-checked, PII-filtered, and audited).

Built for financial institutions. No bash. No raw CLI access. No trust required.

## The Problem

LLM agents need to interact with your systems -- read logs, diff branches, check deployments, query services, trace workflows. The default approach is bash access with prompt-level restrictions. But an agent that can `logcli query` can also `logcli query '{}'` (all logs). An agent that can `git diff` can also `git push --force`.

An MCP server alone isn't enough either. MCP governs what tools are *available*, but not what happens when they're called. It has no schema validation, no per-caller permissions, no PII filtering, no audit trail.

## The Solution

Two layers, each enforcing what the other can't:

```
┌──────────────────────────────────────────┐
│  Agent Container (locked down)           │
│                                          │
│  No bash. No filesystem. No CLI tools.   │
│  Can only reach: LLM API + MCP server.   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Agent Loop                        │  │
│  │  Discovers tools via MCP           │  │
│  │  Routes tool calls via MCP         │  │
│  │  Has no other capabilities         │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ MCP protocol
                  ▼
┌──────────────────────────────────────────┐
│  Safe Tool Call MCP Server (in-cluster)  │
│                                          │
│  Has: git, logcli, kubectl, argocd,      │
│  gRPC certs, service credentials.        │
│  The agent doesn't.                      │
│                                          │
│  Every tool call goes through:           │
│  1. Registry lookup                      │
│  2. Permission check (JWT)               │
│  3. Zod input validation                 │
│  4. Bounded execution (Bun.spawn/gRPC)   │
│  5. Output validation                    │
│  6. PII masking/redaction                │
│  7. Audit log write                      │
│                                          │
│  audit-logs/YYYY-MM-DD.jsonl             │
└──────────────────────────────────────────┘
```

The **container** enforces exclusivity: the agent can only use MCP tools. The **MCP server** enforces governance: tools are called correctly, inputs are valid, outputs are filtered, everything is audited.

## Quick Start

```bash
# Install
bun add safe-tool-call

# Or clone and build
git clone <repo>
cd safe-tool-call
bun install
```

### Define Tools

Tool manifests live alongside the capability they wrap. Each manifest defines inputs, outputs, permissions, and classification -- whether it wraps a gRPC method, a CLI command, or a log query.

**gRPC service call:**
```typescript
// tools/customer-data/get-customer.ts
import { defineTool, grpcMethod } from "safe-tool-call"
import { z } from "zod"

export const getCustomer = defineTool({
  name: "get_customer",
  description: "Retrieve a customer by internal ID",
  classification: "read",

  target: grpcMethod({
    system: "customer-master-service",
    package: "org.finca.threesixone.customerdata.customermasterservice.proto.v1",
    service: "CustomerMasterService",
    method: "GetCustomer",
  }),

  permissions: {
    required: ["customer-data:read"],
  },

  input: z.object({
    customerId: z.string().uuid(),
  }),

  output: z.object({
    customer: z.object({
      id: z.string().uuid(),
      status: z.string(),
      fullName: z.string(),
      email: z.string(),
    }),
  }),

  outputPolicy: {
    "customer.id": "allow",
    "customer.status": "allow",
    "customer.fullName": "mask",    // "J*** S****"
    "customer.email": "redact",     // stripped entirely
    "*": "allow",
  },
})
```

**Log query (logcli):**
```typescript
// tools/platform/query-logs.ts
export const queryLogs = defineTool({
  name: "query_logs",
  description: "Query application logs from Loki via logcli",
  classification: "read",

  target: cliCommand({
    command: "logcli",
    argsBuilder: (input) => [
      "query",
      `{namespace="${input.namespace}"}`,
      "--limit", String(input.limit),
      "--from", input.from,
      "--output", "jsonl",
    ],
  }),

  permissions: {
    required: ["logs:read"],
  },

  input: z.object({
    namespace: z.enum(["customer-data", "payments", "onboarding"]),  // bounded!
    query: z.string().max(200),
    limit: z.number().int().min(1).max(500).default(100),
    from: z.string().datetime(),
  }),

  output: z.object({
    lines: z.array(z.object({
      timestamp: z.string(),
      level: z.string(),
      message: z.string(),
    })),
  }),
})
```

**Git diff (read-only):**
```typescript
// tools/platform/git-diff-branches.ts
export const gitDiffBranches = defineTool({
  name: "git_diff_branches",
  description: "Show diff between two branches in a repository",
  classification: "read",

  target: cliCommand({
    command: "git",
    argsBuilder: (input) => [
      "diff", "--stat",
      `${input.base}..${input.compare}`,
      "--", input.path ?? ".",
    ],
    cwd: (input) => `/repos/${input.repository}`,
  }),

  permissions: {
    required: ["git:read"],
  },

  input: z.object({
    repository: z.enum(["customer-data", "payments-engine", "onboarding-service"]),
    base: z.string().regex(/^(main|release\/\d+\.\d+\.\d+)$/),    // only main or release tags
    compare: z.string().regex(/^(main|release\/\d+\.\d+\.\d+)$/),
    path: z.string().optional(),
  }),

  output: z.object({
    diff: z.string(),
    filesChanged: z.number(),
  }),
})
```

Notice the pattern: the agent cannot query arbitrary namespaces, diff arbitrary branches, or access arbitrary repositories. The Zod schema **mechanically constrains** what the agent can ask for.

### Start the MCP Server

```typescript
import { SafeToolCall } from "safe-tool-call"
import { getCustomer } from "./tools/customer-data/get-customer"
import { queryLogs } from "./tools/platform/query-logs"
import { gitDiffBranches } from "./tools/platform/git-diff-branches"

// Start as an MCP server -- any MCP client can connect
SafeToolCall.serve({
  tools: [getCustomer, queryLogs, gitDiffBranches],
  audit: { dir: "./audit-logs" },
  transport: "streamable-http", // or "stdio" for local dev
  port: 3000,
})
```

Or use as an embedded library:

```typescript
const stc = SafeToolCall.create({
  tools: [getCustomer, queryLogs, gitDiffBranches],
  audit: { dir: "./audit-logs" },
})

// Call a tool directly -- schema-validated, permission-checked, PII-filtered, audited
const result = await stc.call("get_customer", { customerId: "abc-123" }, jwt)

if (result.ok) {
  console.log(result.data)  // filtered output (PII masked/redacted)
} else {
  console.log(result.error.code)    // "PERMISSION_DENIED"
  console.log(result.error.message) // "Missing permission: customer-data:read"
}
```

## Key Concepts

### Tool Classification

Every tool is classified as `read`, `write`, or `destructive`. This classification:
- Appears in audit logs for filtering
- Can trigger elevated permission requirements
- Helps agents reason about what they're doing

### Output Policy (PII Protection)

The output policy defines what the LLM is allowed to see. Three modes:

| Policy | Behaviour | Example |
|--------|-----------|---------|
| `allow` | Field passes through unchanged | `status: "ACTIVE"` |
| `mask` | Field is partially obscured | `fullName: "J*** S****"` |
| `redact` | Field is stripped from output | *(field absent)* |

**Default is deny.** Fields not explicitly mentioned in the policy are stripped. This prevents new fields added to the protobuf response from accidentally leaking to agents.

### Permissions Model

Callers (agents) present a JWT containing their permissions:

```json
{
  "sub": "deployment-agent-prod",
  "permissions": ["customer-data:read", "argocd:sync"],
  "iat": 1739712000,
  "exp": 1739715600
}
```

Tools declare what permissions they require. The proxy checks before execution. Tools can also define **elevated permissions** that are conditionally required based on input:

```typescript
permissions: {
  required: ["customer-data:write"],
  elevatedIf: (input) => input.newStatus === "OFFBOARDED",
  elevatedPermissions: ["customer-data:lifecycle:destructive"],
}
```

### Audit Trail

Every tool call produces a structured JSON audit entry:

```json
{
  "timestamp": "2026-02-16T14:30:00.000Z",
  "traceId": "a1b2c3d4-...",
  "caller": { "sub": "support-agent", "permissions": ["customer-data:read"] },
  "tool": { "name": "get_customer", "classification": "read" },
  "decision": "ALLOWED",
  "duration": 47,
  "response": { "filteredFields": ["customer.email", "customer.phone"] }
}
```

## Project Structure

```
safe-tool-call/
├── src/
│   ├── core/              # defineTool(), types, output policy engine
│   ├── proxy/             # Registry, permission engine, schema validator, proxy engine
│   ├── handlers/
│   │   ├── cli/           # CLI command handler (Bun.spawn -- logcli, git, kubectl, argocd)
│   │   └── grpc/          # gRPC handler factory (future)
│   ├── mcp/               # MCP server adapter
│   ├── audit/             # Structured JSON audit logger
│   └── index.ts           # Public API
├── tools/                 # Example tool manifests
│   ├── customer-data/     # gRPC service tools (future)
│   └── platform/          # CLI-based tools (logs, git, argocd, k8s)
├── eval/                  # Containerised adversarial eval harness
│   ├── agent/             # Locked-down agent container (no bash, no tools)
│   ├── server/            # MCP server container (has tools + governance)
│   └── cases/             # Eval YAML cases (boundary + capability tests)
├── tests/
├── audit-logs/            # Audit output (gitignored)
├── plans/                 # Implementation plans
├── MANIFESTO.md           # Why this exists
├── AGENTS.md              # Guidelines for AI agents working on this codebase
└── README.md
```

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Language:** TypeScript (strict mode)
- **Protocol:** [MCP](https://modelcontextprotocol.io) (Model Context Protocol)
- **Schema validation:** [Zod](https://zod.dev)
- **CLI execution:** `Bun.spawn` (array args, no shell)
- **gRPC:** `@grpc/grpc-js` + `@grpc/proto-loader` (future)
- **JWT:** `jose`
- **Audit:** Structured JSON lines (`.jsonl`)
- **Eval:** Docker, OpenRouter API

## Documentation

- [MANIFESTO.md](./MANIFESTO.md) -- Why Safe Tool Call exists
- [plans/plan.md](./plans/plan.md) -- Detailed implementation plan
- [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) -- Resolved architectural decisions
- [FAQ.md](./FAQ.md) -- Anticipated questions and answers
- [AGENTS.md](./AGENTS.md) -- Guidelines for AI agents contributing to this project

## Built by

[Ikigai Digital](https://ikigaidigital.io)
