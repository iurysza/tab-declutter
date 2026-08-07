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
- Added the compact Tab Declutter popup and focused settings page, including Workstream/Topic/Intent selection, custom criterion add/edit/remove, provider/model/key/base URL fields, setup/errors/status, and Undo.
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

## 2026-08-07 — Manual smoke attempts in Chrome 150

Status: partial

### Completed

- Inspected the options and popup surfaces in the running unpacked extension.
- Verified the settings page loads the provider, model, API key, base URL, and criteria UI.
- Verified the popup loads the current-window grouping UI and the Workstream / Topic / Intent selector.
- Seeded extension storage with fixture provider settings for `openai-compatible`, model `tab-declutter-fixture`, dummy key, and local base URL.
- Created two representative eligible tabs (`https://example.com/` and `https://example.org/`).
- Observed the popup failure state when provider access was missing: `Allow access to the provider in Settings`.
- Retried native capture with Peekaboo against `Google Chrome for Testing`; `peekaboo see --app "Google Chrome for Testing" --json` failed with `Capture failed: No displays available for window capture`.
- Retried frontmost capture after activating Chrome; the same display-capture failure occurred.

## 2026-08-07 — Manual smoke retry after browser restart

Status: partial

### Completed

- Confirmed the clean Chrome for Testing window via `peekaboo list windows --app "Google Chrome for Testing" --json`; window ID `8721` was the visible page window.
- Confirmed Peekaboo still could not capture that window: `peekaboo see --app "Google Chrome for Testing" --window-id 8721 --json` failed with `Capture failed: No displays available for window capture`.
- Loaded the settings page at `chrome-extension://cggbiaollmchknafdbgmcpinpecjbjdd/src/options/index.html` in the clean profile.
- Verified the options page text: provider selector, model/key/base URL inputs, criteria section, and Save settings button.
- Set the options form to `openai-compatible`, model `tab-declutter-fixture`, API key `dummy-fixture-key`, and base URL `http://localhost:63816/v1` with CDP input events.
- Triggered the real Save button with `Runtime.evaluate(..., userGesture:true)` and observed `Saving…` in the UI.

### Not completed

- The permission bubble itself could not be inspected or clicked because Peekaboo window capture failed in this environment.
- `chrome.storage.local` still read back empty after the Save attempt, so the fixture-save assertion is not met.
- Grouping, Undo, safe provider failure on the approved local origin, popup success state, and console/service-worker error checks remain open.

## 2026-08-07 — Manual smoke with native key delivery in Chrome 150

Status: completed, with screenshot capture failure

### Completed

- Resolved the main Chrome for Testing PID as `20751` via `lsof -i :9224` and `ps -p`.
- Filled the options form using `Input.insertText` CDP events so React controlled state updated.
- **Denial assertion**: set provider `openai-compatible`, model `tab-declutter-fixture`, key `dummy-deny-key`, base URL `https://example-provider.com/v1`; clicked Save with `userGesture:true`; sent keycode `53` (Escape) to PID `20751` via `/tmp/send-key-to-pid`.
  - Poll result: options body contained `Provider access was not allowed` and `chrome.permissions.contains({origins:['https://example-provider.com/*']})` returned `false`.
- **Grant and save assertion**: reloaded options, set provider `openai-compatible`, model `tab-declutter-fixture`, key `dummy-fixture-key`, base URL `http://localhost:63816/v1`; clicked Save with `userGesture:true`; sent keycode `36` (Return) to PID `20751`.
  - Poll result: options body contained `Settings saved`, `chrome.permissions.contains({origins:['http://localhost:63816/*']})` returned `true`, and `chrome.storage.local.get('providerSettings')` returned the fixture settings including model `tab-declutter-fixture`.
- **Grouping assertion**: pinned the settings tab (`1777733284`); pre-grouped `https://example.com/` (tab `1777733285`) and `https://example.org/` (tab `1777733286`) as `Before smoke` with `color: blue`, `collapsed: true`; opened the popup and clicked `Organise current window`.
  - Result: `chrome.tabGroups.query()` showed a single group with `title: "Fixture workstream"`, `color: "blue"`, `collapsed: false`, containing both example tabs. The pinned settings tab and the popup tab were not grouped.
- **Undo assertion**: clicked `Undo last grouping` in the popup.
  - Result: both example tabs restored to a group titled `Before smoke`, `color: blue`, `collapsed: true`, at indices `1` and `2` with the pinned settings tab still at index `0`.
- **Safe provider failure assertion**: changed the saved base URL to `http://localhost:63816/bad-path/v1` on the already-approved localhost origin; clicked Save; clicked `Organise current window` in the popup.
  - Result: popup body showed `The provider could not complete the request`. The tab group remained `Before smoke` (no mutation). The error text did not contain the API key or any provider response body.
- **Console/service-worker error inspection**: enabled `Console` and `Runtime` domains on the options and popup targets; no `Console.messageAdded` or `Runtime.exceptionThrown` events were observed during the test sequence.

### Not completed

- Screenshot capture failed in this environment:
  - `Page.captureScreenshot` over CDP timed out for both options and popup targets.
  - `peekaboo see --app "Google Chrome for Testing" --window-id 8721` and screen-capture modes failed with `Capture failed: No displays available for window capture` / `Failed to capture any screens`.
  - `screencapture -l 8721` failed with `could not create image from window`.
  - Existing `/tmp/tab-declutter-options.png` is from an earlier attempt and does not reflect the completed pass; `/tmp/tab-declutter-popup.png` was not created.
