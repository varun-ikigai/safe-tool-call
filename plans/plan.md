# Safe Tool Call: MVP Implementation Plan

## Overview

Build a runtime proxy and manifest SDK that allows LLM agents to call gRPC microservice methods through a governed, schema-validated, PII-filtered, audited interface. No bash, no raw network access -- just declared, typed tool calls.

**Tech stack:** TypeScript, Bun, Zod, gRPC  
**Target environment:** Self-hosted, mTLS service mesh, Kotlin/Spring Boot gRPC services  
**Reference service:** `customer-data/customer-master-service` (6 gRPC methods, hexagonal architecture, protobuf contracts via Buf)

---

## Architecture

```
Service Team                        Agent (LLM)
     │                                   │
     ▼                                   │
┌──────────────┐                         │
│ Tool Manifest│   ← defineTool()        │
│ (in service  │     SDK                 │
│  repo)       │                         │
└──────┬───────┘                         │
       │ loaded at startup               │
       ▼                                 │
┌─────────────────────────────────┐      │
│        Runtime Proxy            │◄─────┘  proxy.call("get_customer", {id: "..."})
│                                 │
│  1. Registry lookup             │
│  2. JWT permission check        │
│  3. Zod input validation        │
│  4. gRPC call (mTLS, auth)      │
│  5. Output allowlist filtering  │
│  6. PII masking                 │
│  7. Audit log write             │
│                                 │
│  → return filtered result       │
└─────────────────────────────────┘
```

---

## Phase 1: Core Types & Manifest SDK

**Goal:** `defineTool()` function that service teams use to declare tools.

### Tasks

- [ ] **1.1** Project scaffolding
  - Bun project with TypeScript strict mode
  - `bunfig.toml`, `tsconfig.json`, `package.json`
  - Dependencies: `zod`, `@grpc/grpc-js`, `@grpc/proto-loader`, `jose` (JWT)
  - Directory structure:
    ```
    src/
      core/           # defineTool, types, schemas
      handlers/       # gRPC handler factory
      proxy/          # Runtime proxy engine
      audit/          # Audit logger
    tools/            # Example tool manifests
    tests/
    ```

- [ ] **1.2** Core type definitions (`src/core/types.ts`)
  - `ToolDefinition<TInput, TOutput>` -- the manifest type
  - `ToolClassification` -- `"read" | "write" | "destructive"`
  - `ToolTarget` -- target system, gRPC service/method/package
  - `ToolPermissions` -- required permissions, elevated permissions with condition
  - `OutputFieldPolicy` -- `"allow" | "mask" | "redact"` per field
  - `CallerContext` -- decoded JWT claims (sub, permissions, iat, exp)
  - `AuditEntry` -- structured audit log record
  - `ToolCallResult<T>` -- success/denied/error union type

- [ ] **1.3** `defineTool()` builder function (`src/core/define-tool.ts`)
  - Type-safe builder that returns a `ToolDefinition`
  - Validates at build time: input/output schemas are Zod schemas, permissions are non-empty, classification is set
  - Infers TypeScript types from Zod schemas
  - Example usage:
    ```typescript
    export const getCustomer = defineTool({
      name: "get_customer",
      description: "Retrieve a customer by internal ID",
      classification: "read",
      target: {
        system: "customer-master-service",
        grpc: {
          package: "org.finca.threesixone.customerdata.customermasterservice.proto.v1",
          service: "CustomerMasterService",
          method: "GetCustomer",
        },
      },
      permissions: {
        required: ["customer-data:read"],
      },
      input: z.object({
        customerId: z.string().uuid(),
      }),
      output: z.object({
        customer: CustomerSchema,
      }),
      outputPolicy: {
        "customer.fullName": "mask",
        "customer.email": "redact",
        "customer.phone": "redact",
        "customer.nationalId": "redact",
        "customer.dateOfBirth": "redact",
        "*": "allow",
      },
    })
    ```

- [ ] **1.4** Output field policy engine (`src/core/output-policy.ts`)
  - Takes a raw output object and an `OutputFieldPolicy` map
  - Traverses the object, applying allow/mask/redact per field path
  - Supports glob patterns (`customer.*`, `*.email`)
  - Default policy: deny (unmatched fields are stripped)
  - Masking strategies: partial mask for strings (`J*** S****`), full redact for sensitive types
  - Returns filtered object + list of redacted field paths (for audit)

---

## Phase 2: Runtime Proxy Engine

**Goal:** The core proxy that validates, executes, and audits tool calls.

### Tasks

- [ ] **2.1** Tool registry (`src/proxy/registry.ts`)
  - In-memory registry loaded at startup from tool definition files
  - `register(tool: ToolDefinition)` -- adds a tool
  - `get(name: string)` -- retrieves a tool
  - `list()` -- returns all registered tools (for LLM tool listing)
  - `has(name: string)` -- existence check
  - Validates no duplicate names on registration
  - Logs registered tools at startup

- [ ] **2.2** JWT validation & caller context (`src/proxy/caller-context.ts`)
  - Decode and verify JWT using `jose` library
  - Extract `sub` (agent identity), `permissions` (string array), `iat`, `exp`
  - Support configurable JWKS endpoint or local public key for verification
  - Return typed `CallerContext` or throw on invalid/expired token
  - No JWT = no access (deny by default)

- [ ] **2.3** Permission engine (`src/proxy/permission-engine.ts`)
  - Takes `CallerContext.permissions` and `ToolDefinition.permissions`
  - Checks: caller has ALL required permissions
  - Handles elevated permissions: if tool has `elevatedIf` condition, evaluate against input and check for elevated permissions
  - Returns `{ allowed: boolean, reason?: string, missingPermissions?: string[] }`

- [ ] **2.4** Schema validator (`src/proxy/schema-validator.ts`)
  - Validates input against `tool.input` Zod schema
  - Returns typed parse result or structured validation errors
  - Validates output against `tool.output` Zod schema (post-execution, pre-filtering)
  - Output validation failures are errors (logged, not returned to caller)

- [ ] **2.5** Proxy engine (`src/proxy/proxy.ts`)
  - The main orchestrator. Implements the full flow:
    ```
    call(toolName, args, jwt) → ToolCallResult
      1. registry.get(toolName)         → 404 if not found
      2. callerContext.verify(jwt)       → 401 if invalid
      3. permissionEngine.check(...)     → 403 if denied
      4. schemaValidator.input(...)      → 400 if invalid
      5. handler.execute(args, config)   → call the service
      6. schemaValidator.output(...)     → 500 if unexpected response
      7. outputPolicy.filter(...)        → strip/mask PII
      8. auditLogger.log(...)            → always, regardless of outcome
      9. return filtered result
    ```
  - Every step that can fail produces a denial audit entry
  - Handler errors (service unavailable, timeout) are caught and audited
  - Configurable timeout per tool call

- [ ] **2.6** Audit logger (`src/audit/json-logger.ts`)
  - Writes structured JSON lines to `audit-logs/` directory
  - One file per day: `audit-logs/2026-02-16.jsonl`
  - Entry schema:
    ```typescript
    {
      timestamp: string,          // ISO 8601
      traceId: string,            // UUID for correlation
      caller: {
        sub: string,              // agent identity
        permissions: string[],
      },
      tool: {
        name: string,
        classification: string,
        targetSystem: string,
      },
      request: {
        args: Record<string, unknown>,  // sanitised (PII fields noted but not logged)
        argsHash: string,               // SHA-256 of raw args for forensics
      },
      decision: "ALLOWED" | "DENIED" | "ERROR",
      denial?: {
        reason: string,
        stage: "REGISTRY" | "AUTH" | "PERMISSION" | "VALIDATION" | "EXECUTION" | "OUTPUT",
        details?: unknown,
      },
      response?: {
        filteredFields: string[],       // which fields were masked/redacted
        outputHash: string,             // SHA-256 of raw output
      },
      duration: number,                 // ms
    }
    ```

---

## Phase 3: gRPC Handler

**Goal:** A handler factory that makes gRPC calls to backend services, handling mTLS, protobuf serialisation, and auth.

### Tasks

- [ ] **3.1** gRPC connection manager (`src/handlers/grpc/connection.ts`)
  - Manages gRPC channels per target system
  - Configurable per-system: endpoint, TLS certs (mTLS), metadata headers
  - Connection pooling and reuse
  - Health check / readiness probe per channel
  - Config loaded from environment or config file:
    ```typescript
    {
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
    }
    ```

- [ ] **3.2** Proto loader (`src/handlers/grpc/proto-loader.ts`)
  - Load `.proto` files or use gRPC server reflection to discover service definitions
  - Map tool target (package/service/method) to a callable gRPC method
  - Handle protobuf ↔ JSON serialisation (using `@grpc/proto-loader` dynamic loading)
  - Cache loaded service definitions

- [ ] **3.3** gRPC handler factory (`src/handlers/grpc/handler.ts`)
  - `grpcMethod(system, service, method)` returns a handler function
  - Handler: takes validated JSON input → serialises to protobuf → calls gRPC → deserialises response to JSON
  - Timeout handling (configurable per tool, default 30s)
  - gRPC status code mapping to tool call errors
  - Metadata forwarding (trace IDs, caller identity for downstream audit)

---

## Phase 4: Example Tool Manifests

**Goal:** Demonstrate the SDK by wrapping the `customer-master-service` gRPC methods as safe tool calls.

### Tasks

- [ ] **4.1** Shared schemas (`tools/customer-data/schemas.ts`)
  - Zod schemas for `Customer`, `Address`, `PersonName`, `CustomerStatus` etc.
  - Derived from the protobuf `primitives.v1` definitions
  - These are the OUTPUT schemas -- what the proxy validates against

- [ ] **4.2** Tool manifests for all 6 methods:
  - `tools/customer-data/get-customer.ts` -- read, customer-data:read
  - `tools/customer-data/get-legacy-customer.ts` -- read, customer-data:read
  - `tools/customer-data/list-customers.ts` -- read, customer-data:read, PII masking on search results
  - `tools/customer-data/create-customer.ts` -- write, customer-data:write, elevated: customer-data:create
  - `tools/customer-data/update-customer.ts` -- write, customer-data:write
  - `tools/customer-data/update-customer-status.ts` -- write, customer-data:write, elevated for destructive transitions (OFFBOARDED, BLOCKED)

- [ ] **4.3** PII output policies for each tool
  - `fullName` → mask
  - `email`, `phone`, `nationalId`, `dateOfBirth`, `taxNumber` → redact
  - `address` → redact (full object)
  - `annualIncome`, `netWorth` → redact
  - `employerName`, `employerAddress` → redact
  - `nextOfKin` → redact (full object)
  - Account IDs, status, external references → allow

---

## Phase 5: Integration & Testing

**Goal:** End-to-end test of the full proxy flow.

### Tasks

- [ ] **5.1** Unit tests for each core module
  - Schema validator: valid/invalid inputs, edge cases
  - Permission engine: exact match, missing perms, elevated perms
  - Output policy: allow, mask, redact, nested fields, glob patterns
  - Audit logger: entry format, file rotation

- [ ] **5.2** Mock gRPC server for testing
  - Simple gRPC server that implements `CustomerMasterService` with mock data
  - Returns realistic protobuf responses
  - Simulates errors (NOT_FOUND, UNAVAILABLE, DEADLINE_EXCEEDED)

- [ ] **5.3** Integration tests
  - Full proxy flow: register tools → call with valid JWT → verify response is filtered and audited
  - Denial scenarios: unknown tool, bad JWT, missing permissions, invalid input
  - Audit log verification: every scenario produces correct audit entry

- [ ] **5.4** Developer smoke test
  - Script that starts mock gRPC server + proxy, calls each tool, prints results
  - Demonstrates: "this is what an agent sees when it calls get_customer"

---

## Phase 6: Developer Interface

**Goal:** The embeddable library API that agent developers actually use.

### Tasks

- [ ] **6.1** Public API (`src/index.ts`)
  ```typescript
  import { SafeToolCall } from "safe-tool-call"

  const stc = SafeToolCall.create({
    tools: [getCustomer, listCustomers, ...],
    systems: { /* gRPC connection config */ },
    audit: { dir: "./audit-logs" },
    jwt: { publicKey: "..." },  // or jwksUri
  })

  // What agents use:
  const result = await stc.call("get_customer", { customerId: "..." }, jwt)

  // For LLM tool listing:
  const tools = stc.listTools()  // returns OpenAI-compatible function definitions
  ```

- [ ] **6.2** LLM tool format export
  - `stc.listTools()` returns tool definitions in OpenAI function calling format
  - Also supports Anthropic tool_use format
  - Includes descriptions, parameter schemas (JSON Schema derived from Zod)
  - This is what gets sent to the LLM in the system prompt / tools parameter

- [ ] **6.3** Error types and DX
  - Typed error responses: `ToolNotFoundError`, `PermissionDeniedError`, `ValidationError`, `ExecutionError`
  - Each includes actionable context (which permission is missing, which field failed validation)
  - Agent-friendly error messages (the LLM can read the error and adjust)

---

## Out of Scope (MVP)

- Web UI / Studio interface
- Tool versioning / changelog
- Approval workflows
- Central registry (tools are loaded from local files)
- Rate limiting / circuit breakers
- CLI tooling (`stc validate`, `stc test`, `stc publish`)
- Multi-transport (REST, CLI handlers) -- gRPC only for MVP
- Proto registry integration (Buf Schema Registry)
- Canary deployments / rollback

---

## Success Criteria

The MVP is done when:

1. A developer can define a tool manifest in ~20 lines of TypeScript
2. The proxy rejects any call not in the registry (deny by default)
3. The proxy validates inputs against Zod schemas before any gRPC call
4. The proxy strips/masks PII fields before returning results to the agent
5. Every tool call (allowed or denied) produces a structured audit log entry
6. An LLM agent, given only the tool definitions (no bash), can query customer data safely
7. The whole thing runs on Bun, self-hosted, no external dependencies beyond the target gRPC services
