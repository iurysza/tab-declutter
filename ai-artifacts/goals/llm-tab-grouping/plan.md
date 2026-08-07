# Plan

## Solution approach

Build a client-only Manifest V3 extension. A compact React popup sends typed commands to an event-driven service worker. The service worker composes an application service from four ports: current-window tabs, local/session storage, model classification, and provider-origin permissions. Pure domain modules decide eligibility, build prompts, validate and normalise model output, assign deterministic group colours, and build undo restore plans.

Use Vercel AI SDK 7 with `Output.object()` and Zod. Official adapters cover OpenAI, Anthropic, and Google; `@ai-sdk/openai-compatible` covers custom OpenAI-style endpoints and base URLs. Flue is intentionally not used because its durable conversation/server runtime solves a larger problem and would add a backend to a one-shot local action. See [ADR-0001](../../../docs/decisions/ADR-0001-use-ai-sdk-in-service-worker.md).

The grouping transaction is:

1. Query and parse the active window, retaining a complete pre-action snapshot and deriving eligible tab candidates.
2. Convert candidates to opaque request references and send only reference, title, and a minimised URL without credentials, query, or fragment to the configured provider.
3. Schema-validate and normalise the response before any browser mutation.
4. Persist a pending transaction containing the pre-action snapshot in `chrome.storage.session`.
5. Ungroup eligible tabs, create the useful multi-tab groups, and name/colour them.
6. Mark the pending snapshot as the latest ready Undo state only after every mutation succeeds.
7. On Undo, ungroup surviving affected tabs, restore their order, recreate prior groups, and restore name, colour, and collapsed state.
8. If step 5 fails part-way, run step 7 immediately as compensation; retain recoverable pending state if compensation fails, and return one safe error.

## UI direction

**Subject and job:** a calm utility for people switching between concurrent work. The popup’s one job is to turn the current window into named threads without becoming another tab manager.

- **Palette:** Ink `#18212f`, Canvas `#f6f7fb`, Thread `#5a63d8`, Signal `#f26b4b`, Line `#dde1ec`, Success `#19745a`.
- **Type:** Archivo Variable for interface and headings; IBM Plex Mono for provider/status metadata. Both ship inside the extension.
- **Layout:** one compact popup column; one wider settings column with two stacked sections. No dashboard cards or decorative metrics.
- **Signature:** a small thread rail—three offset lines ending in one signal node—appears in the mark and progress state. It represents scattered tabs resolving into one workstream.
- **Motion:** one progress transition while classification runs; honour reduced-motion preferences.

```text
Popup                              Options
┌ Tab Declutter              settings ┌ Tab Declutter settings
│ Turn this window into threads    │ Provider
│ Group by [Workstream ▾]           │ [provider] [model]
│ Same active task or deliverable   │ [API key] [base URL]
│ [ Organise current window ]       │ disclosure + Save
│ 3 groups · 11 tabs                │
│ [Undo]                            │ Custom criteria
└──────────────────────────────────  │ [name] [instruction] [remove]
                                     │ [Add criterion]
                                     └──────────────────────────────
```

## Implementation steps

### 1. Scaffold the extension and quality gates

**Files:** `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `manifest.config.ts`, `src/popup/index.html`, `src/options/index.html`, `src/test/setup.ts`, `public/icons/*`.

- Add React 19, Vite 8, CRXJS, TypeScript, Vercel AI SDK/provider packages, Zod, bundled font packages, Vitest, Testing Library, Chrome types, and Oxlint.
- Define a CRXJS Manifest V3 build with `tabs`, `tabGroups`, and `storage`; declare HTTPS and loopback HTTP as optional host permissions; register the module service worker, popup, options page, and packaged icons.
- Add `dev`, `build`, `test`, `test:watch`, `typecheck`, `lint`, and aggregate `check` Bun scripts.
- Keep all executable code bundled locally so extension CSP does not depend on remote code.

**Verification:** `bun install`; manifest structure assertions; `bun run typecheck`; `bun run build`; inspect `dist/manifest.json` and confirm there is no content script or remote script.

### 2. Build the functional core test-first

**Files:** `src/domain/result.ts`, `src/domain/tabs.ts`, `src/domain/criteria.ts`, `src/domain/settings.ts`, `src/domain/classification.ts`, `src/domain/prompt.ts`, `src/domain/undo.ts`, matching `*.test.ts` files.

- Define immutable domain types for tab candidates, complete window snapshots, prior groups, criteria, provider settings, model classifications, normalised grouping plans, restore plans, and safe application errors.
- Parse provider settings at the storage boundary. Require non-empty key/model, a base URL for custom providers, HTTPS for remote overrides, and allow HTTP only for loopback hosts. Derive the exact runtime origin permission pattern as a pure function.
- Define Workstream, Topic, and Intent instructions. Build prompts that label tab metadata as untrusted, separate the criterion from the metadata JSON, require multi-tab groups, and prohibit invented references.
- Convert Chrome IDs to request-scoped opaque references. Minimise URLs by stripping credentials, query, and fragment before prompt construction, and avoid exposing local file paths. Normalise schema-valid output by trimming names, rejecting unknown references, assigning each tab at most once, dropping singleton groups, and deriving ungrouped tabs.
- Build a deterministic restore plan for surviving tabs from a pre-action snapshot.

**Verification:** table-driven Vitest coverage for eligibility, all built-in prompts, custom prompts, prompt-injection-shaped titles, URL/base-URL parsing, origin patterns, duplicate/unknown references, whitespace names, singleton removal, deterministic colours, missing tabs, and restore ordering.

### 3. Add application orchestration behind ports

**Files:** `src/application/ports.ts`, `src/application/group-current-window.ts`, `src/application/undo-last-grouping.ts`, `src/application/get-popup-state.ts`, `src/application/runtime-messages.ts`, matching tests and in-memory fakes.

- Own sequencing in small application use cases. Ports expose current-window snapshot/apply/restore, settings and custom-criterion storage, undo storage, provider classification, and permission checks.
- `groupCurrentWindow` validates configuration and permission, captures the snapshot, classifies, normalises, writes a pending transaction only immediately before the first mutation, applies only a non-empty plan, marks Undo ready after success, and compensates with restore after a partial apply failure.
- `undoLastGrouping` restores a ready or recoverable pending snapshot and clears it only after success. A pending record temporarily preserves the previous ready snapshot so a clean compensation can reinstate the earlier one-level Undo state.
- Return typed result values with stable error codes; map them to short user messages at the runtime boundary.
- Keep API keys out of command payloads and error values.

**Verification:** integration-style tests with in-memory ports cover the happy path, no useful groups, invalid settings, too few tabs, missing permission, provider failure, invalid output, partial mutation plus compensation, successful undo, failed undo retention, and no-secret error serialization.

### 4. Implement AI SDK and Chrome edge adapters

**Files:** `src/adapters/ai/create-model.ts`, `src/adapters/ai/ai-sdk-classifier.ts`, `src/adapters/ai/provider-errors.ts`, `src/adapters/chrome/chrome-workspace.ts`, `src/adapters/chrome/chrome-storage.ts`, `src/adapters/chrome/chrome-permissions.ts`, adapter tests.

- Create provider models with `createOpenAI`, `createAnthropic`, `createGoogleGenerativeAI`, or `createOpenAICompatible`, applying the user’s model, key, and optional base URL.
- Call `generateText` with `Output.object()` and the classification schema. Translate provider auth, rate-limit, network, and invalid-output failures into safe application errors without response bodies or credentials.
- Wrap `chrome.tabs` and `chrome.tabGroups`. Query the active normal window; resolve group metadata; exclude pinned, unstable, and split-view tabs; ungroup before regrouping; apply deterministic colours; and restore order and prior group metadata from a restore plan.
- Store provider/custom-criterion settings only in `chrome.storage.local`, set storage access to trusted extension contexts, and store one crash-recoverable transaction/undo record in `chrome.storage.session` so service-worker suspension cannot strand a partial mutation without a restore path.
- Request an exact configured origin from the options page’s Save gesture and only check permission from the service worker.

**Verification:** adapter tests use injected AI/fetch or Chrome-shaped fakes to verify provider selection/base URL wiring, safe error translation, Chrome call ordering, snapshot capture, grouping, compensation, restoration, local versus session storage, and exact permission requests.

### 5. Compose the service worker and runtime protocol

**Files:** `src/background/index.ts`, `src/application/runtime-messages.ts`, runtime-message tests.

- Compose concrete adapters at the entrypoint only.
- Register listeners synchronously, use callback-plus-`return true` messaging so asynchronous work survives the message, and persist all state needed across worker suspension.
- Support typed commands for popup state, group, undo, criterion selection, and options opening. Parse every incoming message before dispatch.
- Return safe serialisable success/error responses.

**Verification:** protocol parser and dispatch tests reject malformed messages and prove API keys never cross the runtime message boundary; production build contains one module service worker.

### 6. Build the compact React surfaces

**Files:** `src/ui/theme.css`, `src/ui/components/*`, `src/popup/main.tsx`, `src/popup/Popup.tsx`, `src/options/main.tsx`, `src/options/Options.tsx`, UI tests.

- Implement the approved cool-neutral visual system, bundled typography, thread-rail mark/progress state, keyboard focus, disabled/loading states, and reduced motion.
- Popup: criterion selector with descriptions, one primary Organise action, configured/setup state, concise result/error status, settings access, and Undo only when available.
- Options: provider selector, free-form model, masked key, optional base URL, local-storage/privacy disclosure, custom criteria rows, Add/Remove controls, and one Save action that requests the exact provider-origin permission before persistence.
- Keep labels literal and errors actionable: for example, “Add a provider first”, “Allow access to api.example.com”, and “The model did not return usable groups”.

**Verification:** Testing Library tests exercise first-run setup, built-in/custom selection, loading lockout, grouping success, errors, Undo, provider-specific base URL behavior, add/edit/remove criteria, permission denial, save success, accessible names, and keyboard operation. Build the pages in production mode and inspect at popup and options viewport sizes.

### 7. Document, package, and verify the real extension flow

**Files:** `README.md`, optional `docs/privacy.md`, `ai-artifacts/goals/llm-tab-grouping/dev-log.md`.

- Replace the placeholder README with architecture, privacy boundary, supported providers, Bun setup/check/build commands, unpacked Chrome loading steps, use flow, limitations, and troubleshooting.
- Run the complete automated gate and inspect the built archive contents, permissions, CSP, and bundle output.
- Launch a separate Chrome test profile with `dist/` loaded unpacked. Use a local OpenAI-compatible fixture endpoint so no real key is required. Open representative tabs, save the local provider, group by Workstream, confirm names and membership, click Undo, and confirm the prior groups/order return. Also inspect options and popup visually and exercise one denied-permission and one provider-error path.
- Append commands, outcomes, manual evidence, and any honest limitation to the dev log.

**Verification:** `bun run check`; `git diff --check`; clean `git status`; unpacked-load smoke; real group/undo smoke against the local fixture; no secret-like values in tracked files; review the final implementation against every fact below.

## Fact coverage

| Facts | Implementation | Automated verification |
|---|---|---|
| 1, 22 | Steps 1 and 7 | typecheck, lint, test, production build, manifest assertions |
| 2, 3 | Steps 2–5 | eligibility and application/Chrome adapter tests |
| 4–6 | Step 2 | built-in criterion and prompt tests |
| 7 | Steps 3 and 6 | storage/application and options UI tests |
| 8, 14 | Step 2 | classification normalisation tests |
| 9, 10 | Steps 2, 4, and 6 | settings parser, provider factory, and options tests |
| 11, 12 | Steps 3, 4, and 6 | storage and exact-permission adapter tests |
| 13 | Steps 2–5 | prompt payload and runtime protocol tests plus bundle inspection |
| 15, 17 | Steps 3–5 | failure/no-mutation and compensation tests |
| 16 | Steps 2–6 | restore-plan, Chrome adapter, application, and popup tests |
| 18, 19 | Step 6 | React behavior/accessibility tests and manual visual inspection |
| 20, 21 | Steps 2 and 3 | browser-free domain and in-memory application suites |
| 23 | Step 7 | README content assertions/manual review |

## Risks and mitigations

- **Provider/model structured-output variation:** AI SDK validates the schema. Unsupported or malformed output becomes one clear no-mutation error; do not add provider-specific parsing heuristics.
- **Tab state changes during an LLM call:** refetch surviving tab IDs before mutation and skip vanished tabs. Never invent replacement IDs.
- **Partial Chrome mutation:** capture first, compensate on failure, and preserve the undo snapshot until a complete restore succeeds.
- **MV3 service-worker suspension:** register listeners synchronously, persist a pending snapshot before the first mutation, and do not rely on module globals for user state.
- **Prompt injection in titles/URLs:** send metadata as explicitly untrusted JSON, expose no model tools, schema-check output, and allow the result to affect only grouping of supplied references.
- **Broad provider ecosystem:** official adapters cover three native APIs; custom support is explicitly OpenAI-compatible rather than pretending every proprietary protocol is interchangeable.
- **Local API-key exposure:** disclose that Chrome local storage is profile-local rather than hardware-backed, restrict storage to trusted extension contexts, and never log or sync keys.
- **Optional wildcard declaration:** the manifest declares broad optional patterns so arbitrary endpoints are possible, but runtime requests ask for only the configured origin.

## Accepted assumptions

- Chrome only, active window only, manual grouping only, latest-action undo only.
- One active provider configuration; free-form model identifiers; no remote model catalogue.
- No server or extension telemetry.
- Empty useful classification is a successful no-op with a clear status, not an error.

## Remaining non-blocking unknowns

None.
