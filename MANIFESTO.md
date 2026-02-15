# Safe Tool Call: Manifesto

## Why We Exist

Large language models are powerful. They can reason, plan, and execute multi-step workflows across complex systems. Financial institutions are beginning to deploy them as autonomous agents -- to triage incidents, query customer data, orchestrate deployments, and automate operational toil.

But here's the problem: **the default interface between an LLM and your infrastructure is unrestricted.**

Give an agent bash access and a polite instruction in its system prompt, and you have a system where the only thing preventing `kubectl delete namespace production` is a statistical language model's ability to follow directions. That's not a security architecture. That's a prayer.

## The Core Belief

**Trust in an LLM's obedience is not a security control.**

Prompt-level constraints ("do not access the payments service") are advisory. They degrade with context length. They're vulnerable to prompt injection. They leave no audit trail. They cannot be verified by a regulator. They are, in the language of security engineering, a hope -- not a mechanism.

Safe Tool Call exists because the answer to "can this agent access production?" should be a mechanical **no**, not a probabilistic one.

## What We Are

Safe Tool Call is a **governed gateway between LLM agents and your microservice infrastructure.**

Every tool call an agent can make is:

- **Declared** -- authored by the team that owns the service, published as a typed manifest alongside their code.
- **Schema-validated** -- inputs are validated against Zod schemas before execution. Malformed requests never reach your services.
- **Permission-scoped** -- callers present a JWT. The proxy checks their permissions against the tool's requirements. No match, no execution.
- **PII-protected** -- output fields are allowlisted. The LLM only sees what it's explicitly permitted to see. Sensitive data is masked or stripped before it enters the model's context.
- **Audited** -- every call, allowed or denied, is logged with caller identity, tool name, arguments, result, and decision. Structured, queryable, ready for compliance review.
- **Transport-automated** -- mTLS, bearer tokens, gRPC metadata, protobuf serialisation -- the proxy handles the plumbing. Service teams don't build "agent-friendly" adapters. They declare a manifest and the proxy does the rest.

## What We Are Not

We are not a replacement for service-level safety. If a gRPC method allows crediting one account without debiting another, that's a service design problem. The microservice author is responsible for transactional integrity. Safe Tool Call is responsible for **access control, data protection, and auditability** at the agent layer.

We are not a prompt engineering framework. We don't help you write better system prompts or chain-of-thought reasoning. We operate below that layer -- at the mechanical boundary between what an agent wants to do and what it's allowed to do.

## The Architecture of Trust

In a Safe Tool Call deployment, an LLM agent has **no bash access, no direct network access, no raw credentials.** It has a set of typed function calls -- and nothing else.

```
                  The LLM sees this:
                  ┌──────────────────────────┐
                  │  get_customer(id)         │
                  │  list_transactions(...)   │
                  │  get_sync_status(app)     │
                  │  ...and nothing else.     │
                  └────────────┬─────────────┘
                               │
                  The proxy enforces this:
                  ┌────────────┴─────────────┐
                  │  Is this tool registered? │
                  │  Does the caller have     │
                  │    permission?             │
                  │  Are the inputs valid?     │
                  │  [execute]                 │
                  │  Are outputs safe to       │
                  │    return?                 │
                  │  [audit everything]        │
                  └──────────────────────────┘
```

No amount of context rot, prompt injection, or model hallucination can bypass this boundary. The proxy doesn't read the LLM's reasoning. It validates a structured tool call against a registered schema. That's it.

## The Developer Experience

We believe the right security model is one that developers actually use. Safe Tool Call is designed for the teams that build and own microservices:

1. **Author a tool manifest** next to your service code. Declare which gRPC methods are exposed, what permissions they require, which output fields are safe for an LLM to see.
2. **Validate in CI.** Schema correctness, PII coverage, permission sanity -- all checked before merge.
3. **Publish on deploy.** When your service ships, its tool manifest updates in the registry.
4. **Any authorised agent can now use your tools safely.** The proxy handles authentication, serialisation, filtering, and auditing.

The proxy automates the tedious parts -- mTLS handshakes, token refresh, protobuf-to-JSON conversion, structured audit logging -- so that exposing a gRPC method as an agent tool is a five-minute task, not a week-long integration project.

## The Bet

We are betting that:

- LLM agents in financial infrastructure will become ubiquitous within 2-3 years.
- The organisations that deploy them safely will move faster than those that don't deploy them at all.
- Mechanical safety boundaries will be required by regulators, not optional best practices.
- The tool call layer is the right place to enforce these boundaries -- above the service, below the model.
- Better models don't make this redundant. Better models in higher-stakes environments make this more necessary.

We didn't stop building firewalls when programmers got better at writing secure code. We won't stop building tool call governance when models get better at following instructions.

## Principles

1. **Deny by default.** If a tool isn't registered, it doesn't exist. If a caller lacks permission, the call is rejected. There are no escape hatches.
2. **Mechanical over advisory.** A schema validation that rejects bad input is worth more than a system prompt that asks the model to be careful.
3. **Service teams own their surface.** The people who build the service define what's exposed to agents. Central teams govern the registry and permissions. Nobody else can widen a service's attack surface.
4. **Audit everything.** Every tool call is a record. Every denial is a record. The audit trail is not optional and cannot be disabled.
5. **Developer experience is a security feature.** If the safe path is harder than the unsafe path, developers will take the unsafe path. The safe path must be the easy path.

---

*Safe Tool Call is built by Ikigai Digital.*
