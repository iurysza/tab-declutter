# Dev Log

Status: Not started

## 2026-08-07 — Extension implementation

Status: Automated implementation complete; unpacked Chrome smoke pending

### Completed

- Scaffolded a Bun, Vite 8, React 19, TypeScript, CRXJS Manifest V3 extension with packaged icons and fonts.
- Added a browser-free functional core for criteria, eligibility, URL minimisation, prompts, schema validation, classification normalisation, deterministic colours, settings parsing, and restore planning.
- Added application ports and use cases for popup state, current-window grouping, crash-recoverable pending transactions, compensation after partial mutation, and one-level Undo.
- Added Vercel AI SDK adapters for OpenAI, Anthropic, Google, and OpenAI-compatible endpoints; provider failures map to safe errors without keys or response bodies.
- Added Chrome adapters for active-window capture, grouping, order/group restoration, trusted local storage, session Undo storage, and exact provider-origin permission requests.
- Added a typed service-worker message protocol and synchronous listener registration with safe asynchronous responses.
- Added the compact Threadline popup and focused settings page, including Workstream/Topic/Intent selection, custom criterion add/edit/remove, provider/model/key/base URL fields, setup/errors/status, and Undo.
- Added privacy and development documentation, executable build-contract checks, and a credential-free OpenAI-compatible fixture.
- Commits: `38c8b6c`, `b103358`, `7cfcdb1`, `d931a62`.

### Validation

- `bun run check` passed: strict TypeScript, Oxlint with warnings denied, 21 Vitest tests across 6 files, production build, and project-contract verification.
- Domain/application/UI/adapter tests cover pinned and split-view exclusion, prompt-injection-shaped metadata, URL redaction, built-in/custom criteria, invalid/singleton/duplicate model output, provider/base URL parsing, exact permission requests, local versus session storage, grouping/restoration calls, pending compensation, popup grouping/Undo, custom criterion persistence, and permission denial.
- `bun run build` produced a 0.91 kB manifest, local popup/options assets, a module service worker, and no content scripts. Required permissions are exactly `tabs`, `tabGroups`, and `storage`; provider hosts are optional.
- The service-worker bundle is 561.29 kB (136.09 kB gzip), primarily the four approved AI SDK provider adapters. Vite reports its standard chunk-size advisory; no arbitrary warning limit was added.
- The real AI SDK OpenAI-compatible adapter successfully returned a schema-validated group from `scripts/mock-provider.ts` without a real credential.
- Secret-pattern scan and `git diff --check` passed.

### Remaining validation

- The unpacked extension has not yet been driven through Chrome. The parent should run `bun run mock:provider`, load `dist/`, group representative tabs, verify names/membership, press Undo, inspect popup/options visually, deny one permission request, and exercise one provider failure. No browser-smoke success is claimed here.

## 2026-08-07 — Final failure-boundary pass

- Added safe UI responses for rejected service-worker messages and settings load/save operations.
- Split Chrome capture, grouping, and restore failures into accurate actionable messages.
- Commit: `72e1f4f`.
- Re-ran `bun run check`: 21 tests passed, lint/typecheck/project verification passed, and the final service-worker bundle is 561.41 kB (136.13 kB gzip). The unpacked Chrome smoke remains pending as recorded above.
