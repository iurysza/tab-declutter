# Intent

## Outcome

Build **Tab Declutter**, a Chrome extension that uses the user’s chosen LLM to reorganise tabs in the active window into clear, named groups. The extension should make a cluttered window useful in one action, support three distinct grouping lenses, and let the user undo the latest grouping action.

## Audience and problem

People who keep many tabs open while moving between projects, research, communication, and admin work. Manual grouping is repetitive, and domain-only grouping often misses the active task or purpose connecting tabs from different sites.

## Scope

- A Manifest V3 Chrome extension built with Bun, Vite, React, and TypeScript.
- Manual, on-demand grouping of the active window.
- Built-in Workstream, Topic, and Intent criteria.
- User-created criteria with add, edit, and remove controls.
- Direct calls from the extension service worker to OpenAI, Anthropic, Google, or an OpenAI-compatible endpoint through the Vercel AI SDK.
- User-owned API key, model, and optional base URL stored in the local Chrome profile.
- One-level undo that restores the prior arrangement for tabs that still exist.
- Pure grouping, validation, prompt, and restore-plan logic that runs without Chrome.
- A compact popup for grouping and undo, plus a focused options page for provider and custom-criteria settings.
- Clear user-facing failures, setup documentation, and a loadable unpacked build.

## Non-goals

- Automatic grouping on every tab event.
- Reading page bodies, browser history, bookmarks, or cookies.
- A hosted backend, shared account, telemetry, or cross-device key sync.
- Firefox or Safari support in the first version.
- Chrome Web Store submission or automated publishing.
- Multi-level undo history or restoration of tabs that were closed after grouping.
- A dynamic provider model catalogue.

## Constraints

- Follow the repository `AGENTS.md`, including long-term architecture, no compatibility burden, established libraries, and the simplest complete implementation.
- Keep provider keys out of logs, errors, tests, fixtures, and committed files.
- Ask for cross-origin provider access only from a user gesture and only for the configured origin.
- Treat tab titles and URLs as untrusted data. Send only that metadata and stable per-request tab references to the provider.
- Do not mutate tabs until provider output has been parsed and normalised.
- Roll back a partial browser mutation when practical.
- Use a functional core and imperative shell with explicit ports for Chrome, storage, permissions, and LLM calls.

## Decisions

- Use Vercel AI SDK provider adapters, not Flue. Flue’s durable agent/server model adds a backend and conversation lifecycle that a one-shot, local extension action does not need.
- Use the active Chrome window as the grouping boundary.
- Use **Workstream** for shared task/deliverable, **Topic** for shared subject, and **Intent** for shared immediate activity or purpose.
- Leave ambiguous and singleton tabs ungrouped instead of creating noisy one-tab groups.
- Store one active provider configuration and one latest undo snapshot.
- Use official provider adapters for OpenAI, Anthropic, and Google, plus the OpenAI-compatible adapter for custom providers and base URLs.

## Assumptions

- The user’s instruction to avoid questions and infer decisions is explicit approval of these low-risk product and architecture defaults.
- API keys in `chrome.storage.local` are acceptable for a local, user-owned extension. The UI will state this plainly; the extension cannot provide hardware-backed secret storage.
- HTTPS is required for remote custom endpoints. Loopback HTTP is allowed for local models.
- Model identifiers remain free-form because provider catalogues change faster than the extension.
- Undo restores prior tab order, group membership, group name, colour, and collapsed state where Chrome and surviving tabs permit it.

## Open questions

None.
