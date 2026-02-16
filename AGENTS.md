# Agent Guidelines: Safe Tool Call

You are working on **Safe Tool Call**, a governed MCP server for LLM agent tool calls. Read [MANIFESTO.md](./MANIFESTO.md) for the philosophical foundation and [plans/plan.md](./plans/plan.md) for the implementation plan.

## Project Context

This is an embeddable TypeScript/Bun library that sits between LLM agents and infrastructure in financial institutions. It enforces schema validation, permission checking, PII filtering, and audit logging on every tool call -- whether that's a gRPC service method, a logcli query, a git operation, an ArgoCD status check, or a kubectl read.

**Two-layer enforcement:** The agent runs in a locked-down container with no bash, no filesystem, no CLI tools -- it can only reach the LLM API and the MCP server. The MCP server (powered by Safe Tool Call) has the tools, credentials, and governance pipeline. The container enforces exclusivity. The MCP server enforces correctness.

**The core principle:** An agent gets typed, bounded tool calls -- not bash access. The tool definition mechanically constrains what the agent can do. A `query_logs` tool with `namespace: z.enum(["customer-data", "payments"])` cannot query arbitrary namespaces, regardless of what the model decides to try. A `git_diff_branches` tool with `classification: "read"` cannot push, delete, or force-push.

**Target users:** Developers at banks who build microservices (Kotlin/Spring Boot/gRPC) and platform teams who manage infrastructure tooling (ArgoCD, Kubernetes, Loki, Temporal, Git). Both need to safely expose capabilities to LLM agents.

**Reference architecture:** See `reference_data/customer-data/` for a real microservice this tool is designed to wrap. It's a Kotlin hexagonal architecture service with 6 gRPC methods, Temporal workflows, Kafka events, and PostgreSQL persistence.

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, no `any`)
- **Schema validation:** Zod
- **JWT:** `jose`
- **Protocol:** MCP (Model Context Protocol) via `@modelcontextprotocol/sdk`
- **CLI execution:** `Bun.spawn` (array args, no shell -- this is a security invariant)
- **gRPC:** `@grpc/grpc-js`, `@grpc/proto-loader` (Phase 4, not yet implemented)
- **Audit:** Structured JSON lines
- **Testing:** `bun:test`
- **Eval harness:** Docker, OpenRouter API

## Code Standards

### TypeScript
- Strict mode. No `any` types. Use `unknown` and narrow.
- Prefer `type` over `interface` for data shapes. Use `interface` only for implemented contracts.
- All public functions must have JSDoc with `@param` and `@returns`.
- Use `Result<T, E>` pattern (union of success/error) instead of throwing exceptions for expected failures. Reserve `throw` for programmer errors only.
- Zod schemas are the source of truth for all data shapes. Derive TypeScript types with `z.infer<>`.

### Naming
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Tool names: `snake_case` (matches LLM function calling conventions)

### Architecture
- This is a library, not a server. The public API is an importable module.
- Core logic has zero side effects and is pure where possible. Side effects (gRPC calls, CLI execution, file writes) are isolated in handler and audit modules.
- Every module should be independently testable. No hidden global state.
- The proxy flow is a pipeline: registry lookup → JWT verify → permission check → schema validate → execute → output validate → PII filter → audit. Each step is a separate, composable function.
- Handlers are the transport layer. gRPC handlers call services. CLI handlers execute bounded commands (logcli, git, kubectl, argocd). The proxy engine doesn't care which handler type a tool uses -- it validates the same way regardless.

### Security Posture (Non-Negotiable)
- **Deny by default.** Unregistered tools, unmatched permissions, unmatched output fields -- all denied.
- **Never log PII.** Audit entries log field paths that were redacted, not the values. Input args that match PII field patterns are hashed (SHA-256), not logged in cleartext.
- **Never expose credentials.** mTLS certs, JWT signing keys, bearer tokens -- none of these should appear in logs, error messages, or stack traces.
- **Validate both input AND output.** Input validation prevents bad requests. Output validation prevents unexpected data from leaking to the agent.

### Testing
- Use `bun:test` for all tests.
- Unit tests for every core module. Integration tests for the full proxy pipeline.
- Test the denial paths as thoroughly as the happy paths. Every rejection reason should have a test.
- Mock gRPC calls at the handler level, not at the network level.

## File Structure

```
src/
  core/           # defineTool(), types, output policy engine
  proxy/          # Registry, permission engine, schema validator, proxy engine
  handlers/       # gRPC handler factory, connection manager, proto loader
  audit/          # Structured JSON audit logger
  index.ts        # Public API exports
tools/            # Example tool manifests
tests/            # Test files mirror src/ structure
eval/             # Containerised agent eval harness (Docker, OpenRouter)
```

Note: handlers will expand to include CLI command handlers (for logcli, git, kubectl, argocd) alongside gRPC handlers. The proxy engine is transport-agnostic -- it validates inputs and filters outputs the same way regardless of whether the underlying handler makes a gRPC call or executes a bounded CLI command.

## Git Conventions

- Sign all commits: `git commit -S -m "message"`
- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- One concern per commit. Don't mix feature code with refactoring.

## Key Design Decisions

1. **Tool manifests are TypeScript files, not config.** This gives service teams type safety, IDE autocomplete, and the ability to use computed values (e.g., conditional elevated permissions).

2. **Output policy defaults to deny.** Fields not explicitly listed in the output policy are stripped. This prevents new protobuf fields from accidentally leaking to agents.

3. **The proxy is synchronous in its decision logic.** The only async operation is the handler execution (the gRPC call or CLI command). Validation, permission checks, and filtering are all synchronous.

4. **Audit logging is fire-and-forget.** A failed audit write should log to stderr but not fail the tool call. The tool call result is more important than the audit entry.

5. **CLI handlers (Bun.spawn) are the primary handler type for MVP.** gRPC handlers are planned for Phase 4. The handler abstraction is simple: a handler is an async function that takes validated input and returns output. Don't over-abstract beyond what CLI and (eventually) gRPC handlers need.

## What Not To Do

- Don't add a web UI or HTTP server. This is an embeddable library.
- Don't add a database dependency. Audit logs are JSON files. Tool definitions are TypeScript files.
- Don't over-abstract. If there are only two handler types (gRPC and CLI), don't build a complex handler plugin system.
- Don't use `console.log`. Use structured logging that can be configured (silent in tests, verbose in dev).
- Don't store or cache PII anywhere -- not in memory beyond the request lifecycle, not in logs, not in error messages.

## Reference: customer-master-service

The reference service in `reference_data/customer-data/` has these gRPC methods that the example tool manifests should wrap:

| Method | Classification | Key PII Fields |
|--------|---------------|----------------|
| `GetCustomer` | read | name, email, phone, nationalId, DOB, address, income |
| `GetLegacyCustomer` | read | same as above |
| `ListCustomers` | read | name, email in list items |
| `CreateCustomer` | write | all customer fields in request |
| `UpdateCustomer` | write | varies by FieldMask |
| `UpdateCustomerStatus` | write | none (status transition only) |
