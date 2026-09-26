# ADR-0001: Use AI SDK in the service worker

> **Quick Reference** | Status: Accepted | Date: 2026-08-07
> **Decision**: Call provider models directly from the Manifest V3 service worker through Vercel AI SDK adapters.
> **Context**: Tab grouping is a bounded structured classification, not a durable agent conversation.
> **Alternatives**: Flue agent runtime, hand-written provider fetch clients, hosted proxy
> **Impact**: Provider integration, service worker, permissions, privacy, tests

---

## Context

Tab Declutter needs one structured classification per user action, user-owned provider credentials, arbitrary OpenAI-compatible base URLs, and no hosted service. The extension runtime must survive MV3 suspension without introducing durable conversations or server state.

## Decision

**We will use Vercel AI SDK directly in the extension service worker.**

Use official OpenAI, Anthropic, and Google adapters plus the OpenAI-compatible adapter. Keep AI SDK types inside the adapter and expose one application-owned classification port.

## Alternatives considered

| Option | Pros | Cons | Why not |
|---|---|---|---|
| Flue | Durable agents, tools, provider abstraction | Requires an agent/runtime lifecycle and normally Node or deployed HTTP infrastructure | The job is bounded and needs no conversation, tools, filesystem, or backend |
| Hand-written fetch clients | Smallest theoretical bundle | Reimplements auth, request formats, errors, and structured output for every provider | Long-term provider maintenance outweighs the saved dependency |
| Hosted proxy | Hides provider differences and keys from extension storage | Adds operations, trust, telemetry risk, and a service account boundary | Conflicts with user-owned keys and local-only scope |

## Consequences

- **Positive**: One typed structured-output API spans native and OpenAI-compatible providers without a backend.
- **Negative**: Provider packages increase the service-worker bundle and only OpenAI-style custom protocols work without another adapter.
- **Requires**: Bundle all code locally, request the configured provider origin, translate SDK failures at the adapter edge, and persist no state in service-worker globals.

## Related

- [Architecture guide](../../ai-artifacts/architecture/README.md)
