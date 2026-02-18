# Design Decisions

Resolved during upfront design. These are binding for MVP implementation.

---

## 1. Autonomous Agent Permissions — External Config via Safe Agent Factory

**Decision:** Autonomous agent permissions are NOT managed by Guardian Tool Calls. They are produced by an external **safe-agent-factory** repo.

**How it works:**

- A `safe-agent-factory` repo (or equivalent) contains CI pipelines per bounded context / domain
- CI produces deployment artifacts that bind a Safe Tool Call config to a specific domain
- When an agent is deployed for a domain (e.g., customer-data), it picks up that domain's config — and only that config
- The config includes: which tools are registered, what permissions the agent has, what output policies apply

**Implication for Guardian Tool Calls:**

- Guardian Tool Calls accepts a config at startup (tools + caller permissions) and enforces it
- It does NOT manage agent identity resolution, permission assignment, or config generation
- The `CallerContext` for autonomous agents is resolved from startup config, not from JWT introspection
- Guardian Tool Calls trusts that the config it receives is correct — correctness is the factory's responsibility

**What Guardian Tool Calls needs to support:**

- Accept a static permissions config at startup (for autonomous mode)
- Accept JWT-based permissions at runtime (for gateway mode)
- The proxy engine doesn't care which source — it just checks `CallerContext.permissions` against `tool.permissions.required`

---

## 2. Output Policy Path Syntax — jq-style

**Decision:** Output policy field paths follow **jq syntax** conventions. This is well-known, well-documented, and unambiguous.

**Semantics:**

| Pattern | Matches | Example |
|---------|---------|---------|
| `.customer.id` | Exact leaf field | The `id` field on the `customer` object |
| `.customer.name.first_name` | Nested leaf field | Specific nested field |
| `.customer.name` | The object itself | Redacting this removes the entire `name` object |
| `.customer[]` | All array elements | Every element in a customer array |
| `.customer[].email` | Leaf field in array elements | The `email` field on each element |
| `.customer.phones[].number` | Nested array leaf | Phone number in each phone object |
| `..email` | Recursive descent | Any field named `email` at any depth |

**Key rules:**

- Patterns always match **leaf fields** unless the path terminates at an object/array, in which case the entire subtree is affected
- `..fieldname` is the recursive glob — matches `fieldname` at any depth (jq's `.. | .fieldname`)
- Default is **deny** — fields not matching any allow/mask/redact rule are stripped
- Order of precedence: most specific path wins. `.customer.name.first_name: "allow"` overrides `..first_name: "redact"`

**Why jq:** Everyone in the target audience (platform engineers, Kotlin/Spring devs) knows jq. No invented syntax to learn.

---

## 3. `argsBuilder` Quality — Safe Agent Factory's Responsibility

**Decision:** Guardian Tool Calls does NOT validate `argsBuilder` output at runtime. Manifest quality (including `argsBuilder` safety) is enforced by the **safe-agent-factory CI pipeline**.

**Rationale:**

- `argsBuilder` is a function authored by the tool manifest writer
- `Bun.spawn` with `shell: false` prevents shell injection, but argument injection (e.g., passing `--exec` to git) is still possible with a careless builder
- Runtime validation of arbitrary string arrays is impractical without knowing each CLI tool's flag semantics

**Where quality is enforced:**

- The safe-agent-factory repo runs CI checks on tool manifests before they become deployment artifacts
- CI can lint for known-dangerous patterns: args containing `--exec`, `--`, unvalidated string passthrough, etc.
- PR review catches subtle issues CI can't

**What Guardian Tool Calls provides:**

- The `cliCommand()` factory, which structures the pattern (fixed command + argsBuilder from validated input)
- The `shell: false` invariant (non-negotiable, enforced at runtime)
- Documentation and examples of safe vs. unsafe `argsBuilder` patterns

---

## 4. Error Response Shape — MCP Native

**Decision:** Use MCP SDK's built-in error format. Don't invent a custom error protocol for MVP.

**Mapping:**

| Error category | MCP error handling | Content |
|----------------|-------------------|---------|
| Input validation failure | `isError: true` in tool result | Zod error details (field path, expected vs. received) |
| Permission violation | `isError: true` in tool result | Generic "operation not permitted" |
| Internal error | `isError: true` in tool result | Generic "internal error" |

**Rationale:**

- MCP SDK's `CallToolResult` supports `isError: true` with text content — sufficient for MVP
- Custom error codes and retry hints are premature. If eval results show the LLM struggles to recover from errors, we refine then
- Zod's error formatting is already good enough for input validation — the LLM sees field paths and expected types

**Post-MVP refinement (if needed):**

- Structured JSON error body with `{ code, message, retryable, details? }`
- Custom error codes for each denial stage
- Retry hints based on error category

---

## 5. Audit Input Logging — Configurable Debug Mode

**Decision:** Input args are SHA-256 hashed by default. A **debug mode** flag logs non-PII args in cleartext.

**Modes:**

| Mode | Input args in audit | When to use |
|------|-------------------|-------------|
| `production` (default) | SHA-256 hash only | Always in production |
| `debug` | Cleartext for non-PII fields, SHA-256 for PII fields | Local dev, staging, troubleshooting |

**How PII fields are identified in inputs:**

- The tool manifest declares which input fields are PII-sensitive via an optional `piiFields` array on the tool definition
- In debug mode: fields listed in `piiFields` are hashed, all other input fields are logged in cleartext
- In production mode: all fields are hashed regardless

**Example:**

```typescript
defineTool({
  name: "get_customer",
  input: z.object({
    customerId: z.string().uuid(),
    includeHistory: z.boolean().optional(),
  }),
  piiFields: ["customerId"],  // customerId is PII (can identify a person)
  // ...
})
```

In debug mode audit entry:
```json
{
  "request": {
    "args": {
      "customerId": "sha256:a1b2c3...",
      "includeHistory": true
    }
  }
}
```

**Security invariant:** Debug mode MUST NOT be enabled in production. The config loading should warn loudly (stderr) if debug mode is active.

---

## 6. Handler Context — Minimal for MVP, Evolve Later

**Decision:** `HandlerContext` is minimal for MVP. It will evolve as deployment patterns emerge.

**MVP `HandlerContext`:**

```typescript
type HandlerContext = {
  traceId: string        // UUID, for audit correlation
  timeout: number        // ms, for AbortSignal
}
```

**Not included in MVP:**

- Caller identity (handlers don't need it — the proxy already checked permissions)
- Tool classification (handlers don't need it — the proxy already enforced it)
- Environment variables / credentials (handlers get these from process env, not from context)
- mTLS certs / bearer tokens (Phase 4 gRPC concern)

**Rationale:** We don't know how services will be deployed yet. Over-designing HandlerContext now means refactoring later when real deployment patterns emerge. Keep it minimal, add fields when there's a concrete need.

**When to revisit:** When gRPC handlers (Phase 4) are implemented, or when a CLI handler demonstrably needs caller identity for downstream correlation.

---

## 7. `defineTool()` Validation — Minimal for MVP

**Decision:** `defineTool()` validates only the essentials at definition time. Additional validation is deferred to refinement.

**MVP validation (at definition time):**

- Input schema is a valid Zod object (`z.object(...)`)
- Output schema is a valid Zod schema
- Classification is set (`"read" | "write" | "destructive"`)
- Permissions `required` array is non-empty
- Tool name is a non-empty string matching `snake_case` pattern
- Handler is provided (either inline function or `cliCommand()` result)

**Deferred to refinement:**

- Output policy covers all fields in output schema (too restrictive — some tools legitimately strip most fields)
- Tool name deduplication (useful but a registry concern, not a definition concern)
- `elevatedPermissions` / `elevatedIf` pairing validation (post-MVP feature)

**Rationale:** We need a working prototype first. Over-validation at definition time makes the DX painful for rapid iteration. The safe-agent-factory CI pipeline is the right place for stricter validation — it runs before deployment, not at import time.
