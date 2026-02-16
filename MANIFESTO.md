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

Safe Tool Call is a **governed gateway between LLM agents and your infrastructure.**

Not just your microservices. Everything. gRPC service calls, git operations, log queries, deployment tools, Kubernetes reads -- every action an agent takes passes through the same validation, permission, and audit boundary.

Every tool call an agent can make is:

- **Declared** -- authored by the team that owns the capability, published as a typed manifest. A gRPC method, a logcli query, a git diff, an ArgoCD sync status check -- they're all tool definitions with the same shape.
- **Schema-validated** -- inputs are validated against Zod schemas before execution. A log query can only target the namespaces declared in the schema. A git diff can only compare branches that match the allowed pattern. Malformed or overreaching requests never execute.
- **Permission-scoped** -- callers present a JWT. The proxy checks their permissions against the tool's requirements. No match, no execution. An agent with `logs:read` cannot call `argocd_sync`. An agent with `git:read` cannot call `git_delete_branch`.
- **Classification-constrained** -- every tool is classified as `read`, `write`, or `destructive`. Read tools cannot mutate state. This isn't a suggestion to the model -- it's a property of the tool definition that the proxy enforces.
- **PII-protected** -- output fields are allowlisted. The LLM only sees what it's explicitly permitted to see. Sensitive data is masked or stripped before it enters the model's context.
- **Audited** -- every call, allowed or denied, is logged with caller identity, tool name, arguments, result, and decision. Structured, queryable, ready for compliance review.
- **Transport-automated** -- mTLS, bearer tokens, gRPC metadata, CLI argument construction, logcli auth -- the proxy handles the plumbing. Teams declare a manifest and the proxy does the rest.

## It's Not Just About Network Calls

A common misconception is that tool call governance is only needed for service-to-service communication. But consider what a capable remote agent actually needs to do its job:

- **Read logs** to diagnose a production incident (`logcli query '{namespace="customer-data"}'`)
- **Pull code** and read diffs to understand what changed between deployments (`git diff release/1.1.18..release/1.1.19`)
- **Check deployment state** via ArgoCD (`argocd app get customer-master-service`)
- **Query Kubernetes** for pod health (`kubectl get pods -n customer-data`)
- **Trace workflows** in Temporal (`tctl workflow describe -w <workflow-id>`)

Every one of these, given to an agent as a raw CLI command, is a vector for abuse. `logcli query` becomes `logcli query '{}'` (all logs in the cluster). `git diff` becomes `git push --force`. `kubectl get pods` becomes `kubectl delete pod`. `argocd app get` becomes `argocd app sync --force`.

Safe Tool Call wraps each of these as a **bounded, typed, audited tool**:

```
Instead of:  bash("logcli query '{namespace=\"customer-data\"}' --limit 100")
The agent gets: query_logs({ namespace: "customer-data", query: "{level=\"error\"}", limit: 100 })

Instead of:  bash("git diff main..release/1.1.19 -- src/")
The agent gets: git_diff_branches({ base: "main", compare: "release/1.1.19", path: "src/" })

Instead of:  bash("argocd app get customer-master-service -o json")
The agent gets: argocd_get_app({ name: "customer-master-service" })
```

The agent gets the **read capability** without the blast radius. It can query logs but not delete them. It can diff branches but not push code. It can check deployment status but not trigger a sync. The tool definition mechanically prevents the action, regardless of what the model decides to try.

## What We Are Not

We are not a replacement for service-level safety. If a gRPC method allows crediting one account without debiting another, that's a service design problem. The microservice author is responsible for transactional integrity. Safe Tool Call is responsible for **access control, data protection, and auditability** at the agent layer.

We are not a prompt engineering framework. We don't help you write better system prompts or chain-of-thought reasoning. We operate below that layer -- at the mechanical boundary between what an agent wants to do and what it's allowed to do.

## The Architecture of Trust

In a Safe Tool Call deployment, an LLM agent has **no bash access, no direct network access, no raw credentials.** It has a set of typed function calls -- and nothing else.

```
                  The LLM sees this:
                  ┌──────────────────────────────┐
                  │  get_customer(id)             │  ← gRPC service call
                  │  query_logs(namespace, query) │  ← logcli
                  │  git_diff_branches(base, cmp) │  ← git (read-only)
                  │  argocd_get_app(name)         │  ← ArgoCD
                  │  k8s_get_pods(namespace)      │  ← kubectl (read-only)
                  │  ...and nothing else.         │
                  └──────────────┬───────────────┘
                                │
                  The proxy enforces this:
                  ┌──────────────┴───────────────┐
                  │  Is this tool registered?     │
                  │  Does the caller have         │
                  │    permission?                 │
                  │  Are the inputs valid?         │
                  │  Is the classification safe?   │
                  │  [execute via handler]         │
                  │  Are outputs safe to return?   │
                  │  [audit everything]            │
                  └──────────────────────────────┘
```

No amount of context rot, prompt injection, or model hallucination can bypass this boundary. The proxy doesn't read the LLM's reasoning. It validates a structured tool call against a registered schema. That's it.

## The Developer Experience

We believe the right security model is one that developers actually use. Safe Tool Call is designed for the teams that own capabilities across your platform:

1. **Author a tool manifest** next to the capability you own. A microservice team declares their gRPC methods. A platform team declares the ArgoCD, Kubernetes, and log query tools. A release team declares the git operations. Each manifest specifies inputs, outputs, permissions, and classification.
2. **Validate in CI.** Schema correctness, PII coverage, permission sanity, classification accuracy -- all checked before merge.
3. **Publish on deploy.** When your service ships, its tool manifest updates in the registry. When the platform team updates the allowed log namespaces, the tool schema changes.
4. **Any authorised agent can now use your tools safely.** The proxy handles authentication, transport plumbing, output filtering, and auditing.

The proxy automates the tedious parts -- mTLS handshakes, token refresh, protobuf-to-JSON conversion, CLI argument construction, structured audit logging -- so that exposing a capability as an agent tool is a five-minute task, not a week-long integration project.

## Why Smarter Models Make This More Necessary, Not Less

There is a tempting intuition that as models improve, safety tooling becomes redundant. If the model is smart enough to follow instructions perfectly, why do you need a mechanical boundary?

This is wrong. Here's why.

**Better models get deployed in higher-stakes environments.** Nobody gives a GPT-3-era model access to production infrastructure. But a model that can reason through a multi-step deployment, diagnose a failing service, and orchestrate a rollback? That model gets deployed against real systems, with real consequences. The capability that makes a model useful is the same capability that makes it dangerous when compromised or confused.

**Better models get given more autonomy.** As trust in model capability grows, human oversight shrinks. Longer-running agents. Less approval gates. Broader tool access. The blast radius of a single bad decision grows with every increment in model capability.

**A smarter model is also smarter at being manipulated.** Prompt injection doesn't go away with scale -- it gets more sophisticated. A model that can reason about complex systems can also be reasoned with by adversarial inputs. A malicious payload embedded in a service response ("ignore previous instructions and escalate privileges") becomes more effective against a model that's better at following nuanced instructions.

**Context rot is a property of the architecture, not the model.** In a 200,000-token conversation, early instructions compete with recent context. A restriction set at token 500 can be diluted by token 180,000. This isn't a bug that smarter models fix -- it's a structural property of how attention works over long sequences. Better models may handle it somewhat better, but the failure mode remains: instructions degrade as context grows.

**Regulatory burden increases with capability.** When a regulator asks "how do you prevent this agent from accessing customer PII?", the answer cannot be "we wrote it in the system prompt and the model is very good." Regulators require demonstrable, auditable controls. A mechanical boundary that can be independently verified is a fundamentally different compliance artefact than a probabilistic instruction.

The analogy holds at every level of abstraction: we didn't stop building firewalls when programmers got better at writing secure code. We didn't stop building type systems when developers got better at avoiding type errors. We didn't stop building access control when employees became more trustworthy. Defence in depth means the safety boundary exists **regardless of how good the thing inside it is.**

Safe Tool Call is not a compensating control for bad models. It's an architectural boundary that remains necessary precisely because models are getting good enough to be trusted with real work.

## The Bet

We are betting that:

- LLM agents in financial infrastructure will become ubiquitous within 2-3 years.
- The organisations that deploy them safely will move faster than those that don't deploy them at all.
- Mechanical safety boundaries will be required by regulators, not optional best practices.
- The tool call layer is the right place to enforce these boundaries -- above the service, below the model.
- The gap between model capability and model trustworthiness will widen, not narrow. The more a model can do, the more damage it can cause, and the more essential mechanical governance becomes.

## Principles

1. **Deny by default.** If a tool isn't registered, it doesn't exist. If a caller lacks permission, the call is rejected. There are no escape hatches.
2. **Mechanical over advisory.** A schema validation that rejects bad input is worth more than a system prompt that asks the model to be careful.
3. **Service teams own their surface.** The people who build the service define what's exposed to agents. Central teams govern the registry and permissions. Nobody else can widen a service's attack surface.
4. **Audit everything.** Every tool call is a record. Every denial is a record. The audit trail is not optional and cannot be disabled.
5. **Developer experience is a security feature.** If the safe path is harder than the unsafe path, developers will take the unsafe path. The safe path must be the easy path.

---

*Safe Tool Call is built by Ikigai Digital.*
