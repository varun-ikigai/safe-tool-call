# Safe Tool Call: FAQ

Answers to anticipated questions from CISOs, security reviewers, platform engineers, and enterprise architects.

---

## Architecture & Positioning

### "Why not just use Kubernetes RBAC and network policies?"

Kubernetes RBAC controls what a *service account* can do at the cluster level. Network policies control what a *pod* can connect to. Neither operates at the **tool call** level.

An agent with network access to a gRPC service can call any method on that service. An agent with `kubectl get pods` permission in RBAC can also `kubectl get secrets`. These are coarse-grained infrastructure controls.

Safe Tool Call operates one layer up: it constrains *which methods/commands* an agent can invoke, *with what arguments*, and *what fields it sees in the response*. A `get_customer` tool with `z.object({ customerId: z.string().uuid() })` and an output policy that redacts `email` and masks `fullName` is a fundamentally different granularity than "this pod can talk to that service."

They're complementary. RBAC and network policies are the floor. Safe Tool Call is the ceiling.

### "How is this different from a service mesh (Istio/Linkerd) with authz policies?"

A service mesh enforces *which services can talk to which services* and can do per-path authorization. But it operates at the HTTP/gRPC route level, not at the field level.

A mesh policy can say "agent-pod can call `CustomerMasterService/GetCustomer`." It cannot say "but only see the `id` and `status` fields, mask the `fullName`, and strip the `email`." It cannot validate that the input `customerId` is a valid UUID before the request reaches the service. It cannot audit the full request-response cycle with PII hashing.

Safe Tool Call sits inside the sidecar's equivalent position but governs at tool-call granularity with schema validation, output filtering, and structured audit.

### "MCP already provides tool discovery and invocation. What does this add?"

MCP defines a *protocol* for tool discovery and invocation. It specifies how a client lists tools and calls them. It does not specify:

- Input schema validation before execution
- Per-caller permission checks (JWT-based authorization)
- Output field filtering (PII masking/redaction)
- Structured audit logging of every call and denial
- Tool classification enforcement (read/write/destructive boundaries)
- CLI/gRPC handler execution with security invariants (no shell, array args only)

MCP is the transport. Safe Tool Call is the governance layer on top of it.

### "Is this a server or a library?"

Both. The core is an embeddable TypeScript library (`SafeToolCall.create()`). It can also be started as an MCP server (`SafeToolCall.serve()`). The library is the primary API; the MCP server is a thin adapter over it.

### "Why not just a proxy/sidecar in front of existing services?"

A generic proxy can do authz and rate limiting, but it cannot do tool-specific input validation (Zod schemas), field-level output filtering (PII masking per field path), or structured audit with tool classification metadata. Safe Tool Call has semantic understanding of what each tool does because the tool manifest declares it.

---

## Security Model

### "What stops the agent from hallucinating PII it never received?"

Nothing in Safe Tool Call. This is an acknowledged limitation.

Safe Tool Call governs the **tool boundary** -- what data flows from infrastructure to the agent. It cannot govern the agent's **text output** -- what the agent tells the user. If the model has been trained on or previously exposed to PII-like patterns, it could fabricate plausible data in its response.

This is explicitly in Guardian Agents' scope: output review, content filtering on the agent's text responses, and checkpoint review by a secondary model -- built into the agent runtime itself.

### "What about valid-but-harmful sequences of tool calls?"

Safe Tool Call validates each call independently. It cannot detect that 500 valid `list_customers` calls constitute enumeration, or that a sequence of `read_file` calls is systematically exfiltrating a codebase.

This is the most significant architectural limitation of per-call governance. Mitigations:

- **Guardian Agents runtime:** Rate limiting, checkpoint review, behavioral analysis across call sequences -- built into the agent loop itself
- **Tool design:** Paginated responses with reasonable limits, bounded result sets
- **Audit correlation:** All calls are logged; post-hoc analysis can detect patterns

The manifesto's claim that the boundary is mechanical applies to *individual calls*. Sequence-level governance is enforced by Guardian Agents.

### "Can the agent inject shell commands through tool arguments?"

No. CLI handlers use `Bun.spawn` with array arguments and `shell: false`. The command is fixed in the tool definition (not agent-controlled). Arguments are constructed by an `argsBuilder` function from Zod-validated input. There is no shell interpretation, no string interpolation, no metacharacter expansion.

However, some CLI tools accept flags that modify behavior (e.g., `--exec` on `git log`). The `argsBuilder` function constructs the final argument array -- the agent never controls raw args directly. Manifest quality (including safe `argsBuilder` patterns) is enforced by the safe-agent-factory CI pipeline, not by Safe Tool Call at runtime.

### "What about path traversal (`../../etc/passwd`)?"

Input schemas prevent this. A `read_file` tool uses `z.enum(["/app/src", "/app/tests"])` for directories, not `z.string()`. The agent cannot specify arbitrary paths because the schema rejects them before execution.

For tools that accept path-like strings, the schema should use `.regex()` or `.refine()` to enforce allowed patterns. This is a manifest quality concern -- a poorly written schema (e.g., `path: z.string()`) would be faithfully enforced but weakly governed.

### "What if the MCP server itself is compromised?"

If the MCP server container is compromised (supply chain attack, container escape, dependency vulnerability), the attacker has all the access the server has -- CLI tools, gRPC credentials, audit log writes. This is an infrastructure security concern, not a tool governance concern.

Mitigations are standard container security: minimal base images, pinned dependencies, vulnerability scanning, runtime security monitoring, read-only filesystem where possible.

The more likely vector is **dependency supply chain**: the MCP server runs Bun with npm dependencies (zod, jose, MCP SDK, grpc-js). A compromised dependency has full access to the server's runtime. Standard mitigations apply: lockfiles, audit, SBOM generation, minimal dependency surface.

### "How does authentication work for gateway vs. autonomous agents?"

Two auth models, determined by container identity:

| Agent Type | Identity | JWT | Permissions |
|------------|----------|-----|-------------|
| **Gateway** (human-initiated) | Service account | User's JWT forwarded to MCP | Human's permissions from JWT |
| **Autonomous** | Service account | None | Config-defined permissions |

The MCP server identifies the caller via container identity (service account token). For gateway agents, it validates the forwarded JWT and checks the human's permissions. For autonomous agents, it uses static permissions from startup config.

Autonomous agent config (tools + permissions) is produced by an external **safe-agent-factory** CI pipeline, scoped per bounded context/domain. When an agent is deployed for a domain, it picks up that domain's config and only that config. Safe Tool Call enforces whatever config it receives -- config correctness is the factory's responsibility.

This means autonomous agent governance is coarser-grained -- there's no dynamic permission revocation without redeploying. This is deliberate.

---

## Tool Manifests & Governance

### "Who writes the tool manifests? Who reviews them?"

Service teams author manifests for their capabilities. A microservice team declares their gRPC methods. A platform team declares log query, git, ArgoCD, and Kubernetes tools.

Manifest quality is enforced by the **safe-agent-factory** CI pipeline. This is the governance-of-governance layer:

- **CI linting:** Rejects `z.any()`, flags `z.string()` for known-bounded fields, checks `argsBuilder` for dangerous patterns (e.g., unvalidated string passthrough, `--exec` flags)
- **PR review:** Security team approves manifest changes before they become deployment artifacts
- **Future:** Proto decorators (`[(pii) = true]`) to auto-generate output policies from proto definitions

Safe Tool Call itself enforces manifests faithfully at runtime. The factory ensures they're *worth* enforcing.

### "Can two agents see different tool sets?"

Yes -- by design. The safe-agent-factory produces per-domain configs. An agent deployed for the customer-data bounded context gets a config with customer-data tools. An agent for payments gets payments tools. Each domain's MCP server instance loads only its config.

This isn't multi-tenancy within a single server -- it's one MCP server per domain, each with its own tool set. The factory enforces the boundary at build time.

### "Can the same tool have different output policies for different callers?"

Not in MVP. Output policies are defined per-tool in the manifest, not per-caller. All callers of `get_customer` see the same masking/redaction.

This could be extended by making output policies caller-aware (e.g., `compliance-agent` sees masked names, `support-agent` sees redacted names). Not planned for MVP.

### "What happens if a tool manifest has `output: z.any()`?"

It will be faithfully enforced -- meaning no output validation occurs. This is a manifest quality problem, not a runtime problem. The output policy (PII filtering) still applies, so unlisted fields are still stripped. But the output schema validation step becomes a no-op.

CI linting should reject `z.any()` in production manifests.

---

## Error Handling

### "What does the agent see when a tool call is denied?"

Three error categories with different information disclosure:

| Scenario | Agent sees | Audit log |
|----------|-----------|-----------|
| **Input validation failure** | Detailed error (so the LLM can fix its args) | `DENIED`, stage: `VALIDATION` |
| **Permission violation** | Generic "operation not permitted" | `DENIED`, stage: `PERMISSION` |
| **Internal error** (output schema mismatch, handler crash) | Generic error | `ERROR`, stage: `OUTPUT` or `EXECUTION` |

Principle: agent-correctable errors get detail. Policy violations and internal errors get generic responses with full detail in the audit log only.

### "What happens when a CLI command times out?"

- Logged as `ERROR` stage (not `DENIED` -- it's an execution failure, not a policy denial)
- Agent receives a generic timeout error
- The error is retryable at the agent's discretion
- Default timeout is 30 seconds, configurable per tool

---

## Audit & Compliance

### "Are JSONL files on disk sufficient for compliance?"

No. JSONL files are the **emission format**, not the final destination. In production, audit logs should be streamed to an external SIEM/logging platform (Splunk, ELK, Loki, etc.) for:

- Immutability guarantees
- Retention policy enforcement
- Access control on the logs themselves
- Tamper-proof storage
- Cross-correlation with other security events

Safe Tool Call produces structured, machine-readable audit entries. The integration with your logging infrastructure is a deployment concern. Streaming to OTel/Splunk is listed as out of scope for the library itself.

### "What's in the audit log? Does it contain PII?"

Never in production mode. The audit entry contains:

- **Caller identity:** `sub` (subject), permissions list
- **Tool metadata:** name, classification
- **Request:** SHA-256 hash of the raw args (never cleartext PII in production)
- **Decision:** `ALLOWED`, `DENIED`, or `ERROR`
- **Denial reason:** stage and reason (if denied)
- **Response metadata:** list of redacted field paths, SHA-256 hash of raw output
- **Timing:** duration in milliseconds, ISO 8601 timestamp, trace ID

The audit log tells you *what happened* and *what was redacted*, without containing the sensitive data itself.

A **debug mode** is available for local dev and staging: non-PII input fields are logged in cleartext while PII fields (declared via `piiFields` on the tool definition) remain hashed. Debug mode MUST NOT be enabled in production -- the runtime warns loudly to stderr if it is.

---

## Operational

### "Can I add/remove tools without restarting the MCP server?"

No. Tools are loaded statically at startup. To add or remove tools, restart the MCP server. This is a deliberate MVP decision for simplicity and thread-safety. Dynamic tool loading is a potential future enhancement.

### "What transport does the MCP server use?"

- **Streamable HTTP** for container-to-container communication (production)
- **stdio** for local development and testing

### "What MCP SDK version should I use?"

`@modelcontextprotocol/server@^1.0.0`. v1.x is production-ready. v2 is pre-alpha (Q1 2026 target).

---

## Scope & Boundaries

### "What's NOT in Guardian Tool Calls?"

The following belong to Guardian Agents (the governed agent runtime) or general infrastructure:

| Concern | Where it lives |
|---------|---------------|
| Rate limiting | Guardian Agents (built into agent loop) |
| Circuit breakers | Infrastructure |
| Kill switches | Guardian Agents (built into agent loop) |
| Multi-model review loops | Guardian Agents (checkpoint review) |
| Behavioral anomaly detection | Guardian Agents (built into agent loop) |
| Cost controls / budgets | Guardian Agents (built into agent loop) |
| Monitoring / alerting dashboards | OTel / Splunk integration |
| Tamper-proof audit storage | External logging platform |
| Agent text output filtering | Guardian Agents (built into agent loop) |

Guardian Tool Calls provides the **tool governance layer** (what you're allowed to do).
Guardian Agents **is** the agent runtime with behavioral governance built in (what you're actually doing).

### "Does Safe Tool Call replace service-level safety?"

No. If a gRPC method allows crediting one account without debiting another, that's a service design problem. Safe Tool Call governs **access control, data protection, and auditability** at the agent layer. Transactional integrity is the service author's responsibility.

### "Is this just for gRPC services?"

No. MVP starts with CLI command handlers (`Bun.spawn`): git, logcli, kubectl, argocd, ls, grep. gRPC handlers are planned for Phase 4. The proxy engine is transport-agnostic -- it validates inputs and filters outputs the same way regardless of handler type.

---

## The Two-Product Vision

### "Why ship Guardian Tool Calls first without Guardian Agents?"

Guardian Tool Calls is independently valuable. Even without the governed agent runtime, mechanical tool-call governance (schema validation, permission checks, PII filtering, audit) is a strict improvement over prompt-level constraints or raw bash access.

Guardian Agents requires Guardian Tool Calls' audit trail and tool classification metadata to function. The dependency is one-directional: Guardian Agents builds on Guardian Tool Calls, not the reverse.

### "Is Guardian Agents a separate sidecar or monitoring service?"

No. Guardian Agents **is** the agent runtime itself -- a hardened fork of FastAgent with governance baked into the agent loop. The locked-down container, rate limiting, checkpoint review, kill switch, and cost controls are all part of the same process that runs the LLM agent loop. It's not a watcher bolted on from outside -- it's what the agent is made of.

### "What's the competitive landscape?"

| Category | Examples | Gap |
|----------|----------|-----|
| Agent frameworks | LangChain, AutoGen, CrewAI | Build agents, don't protect them |
| ML observability | Galileo, Arize, Langfuse | Monitor model quality, not runtime agent behavior |
| Content filtering | Guardrails AI, NeMo Guardrails | Sanitize outputs, don't control actions |
| MCP implementations | Various | Define the protocol, not the governance |
| Agent runtimes | FastAgent, etc. | Run agents, don't govern them |
| API gateways | Kong, Apigee | HTTP-level authz, no tool-call semantics |

Nothing combines tool-call-level schema validation, PII filtering, per-caller permissions, and structured audit in a single governance layer for MCP.
