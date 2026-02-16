# Safe Tool Call

A governed runtime proxy for LLM agent tool calls. Define, validate, and audit every interaction between your AI agents and your infrastructure -- gRPC services, log queries, git operations, deployment tools, and anything else an agent needs to touch.

Built for financial institutions. No bash. No raw CLI access. No trust required.

## The Problem

LLM agents need to interact with your systems. Not just your microservices -- they need to read logs, diff branches, check deployment status, query Kubernetes, trace workflows. The default approach -- bash access with prompt-level restrictions -- offers no mechanical safety guarantees. An agent that can `logcli query` can also `logcli query '{}'` (all logs). An agent that can `git diff` can also `git push --force`. Prompt instructions degrade with context length, are vulnerable to injection, and leave no audit trail.

## The Solution

Safe Tool Call sits between your LLM agents and your infrastructure. Teams publish **tool manifests** declaring which capabilities are available to agents, what permissions they require, what inputs are valid, and which output fields are safe to expose. The runtime proxy enforces these declarations on every call.

```
Agent                  Safe Tool Call Proxy              Your Infrastructure
  │                         │                                │
  ├─ call("get_customer")──►│                                │
  │                         ├─ JWT verify                    │ gRPC Service
  │                         ├─ Permission check              │
  │                         ├─ Zod input validation          │
  │                         ├─ gRPC call (mTLS) ────────────►│
  │                         │◄──────────── protobuf response─┤
  │                         ├─ Output validation             │
  │                         ├─ PII masking/redaction         │
  │                         ├─ Audit log write               │
  │◄─ filtered result ─────┤                                │
  │                         │                                │
  ├─ call("query_logs") ───►│                                │ LogCLI
  │                         ├─ Validates namespace is allowed │
  │                         ├─ Executes bounded logcli cmd ─►│
  │                         ├─ Filters sensitive log lines   │
  │                         ├─ Audit log write               │
  │◄─ filtered logs ───────┤                                │
  │                         │                                │
  ├─ call("git_diff") ────►│                                │ Git (read-only)
  │                         ├─ Validates branch patterns     │
  │                         ├─ Executes read-only git cmd ──►│
  │                         ├─ Audit log write               │
  │◄─ diff output ─────────┤                                │
```

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

### Create the Proxy

```typescript
import { SafeToolCall } from "safe-tool-call"
import { getCustomer } from "./tools/customer-data/get-customer"
import { listCustomers } from "./tools/customer-data/list-customers"

const stc = SafeToolCall.create({
  tools: [getCustomer, listCustomers],

  systems: {
    "customer-master-service": {
      endpoint: "customer-master-service.customer-data.svc:9090",
      tls: {
        rootCert: "/certs/ca.pem",
        clientCert: "/certs/client.pem",
        clientKey: "/certs/client-key.pem",
      },
    },
  },

  audit: {
    dir: "./audit-logs",
  },

  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY,
    // or: jwksUri: "https://auth.internal/.well-known/jwks.json"
  },
})
```

### Use in Your Agent

```typescript
// The agent presents a JWT with its permissions
const jwt = "eyJhbGciOiJSUzI1NiIs..."

// Call a tool -- schema-validated, permission-checked, PII-filtered, audited
const result = await stc.call("get_customer", { customerId: "abc-123" }, jwt)

if (result.ok) {
  // result.data contains the filtered output (PII masked/redacted)
  console.log(result.data)
} else {
  // result.error contains a typed, actionable error
  console.log(result.error.code)    // "PERMISSION_DENIED"
  console.log(result.error.message) // "Missing permission: customer-data:read"
}

// List available tools (for LLM function calling)
const tools = stc.listTools()
// Returns OpenAI-compatible function definitions
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
│   │   ├── grpc/          # gRPC handler factory, connection manager, proto loader
│   │   └── cli/           # CLI command handler (logcli, git, kubectl, argocd)
│   ├── audit/             # Structured JSON audit logger
│   └── index.ts           # Public API
├── tools/                 # Example tool manifests
│   ├── customer-data/     # gRPC service tools (GetCustomer, ListCustomers, etc.)
│   └── platform/          # CLI-based tools (logs, git, argocd, k8s)
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
- **Schema validation:** [Zod](https://zod.dev)
- **gRPC:** `@grpc/grpc-js` + `@grpc/proto-loader`
- **JWT:** `jose`
- **Audit:** Structured JSON lines (`.jsonl`)

## Documentation

- [MANIFESTO.md](./MANIFESTO.md) -- Why Safe Tool Call exists
- [plans/plan.md](./plans/plan.md) -- Detailed implementation plan
- [AGENTS.md](./AGENTS.md) -- Guidelines for AI agents contributing to this project

## Built by

[Ikigai Digital](https://ikigaidigital.io)
