# Threadline

Threadline turns the tabs in your current Chrome window into clear, named groups using an LLM you control. Choose a grouping lens, organise once, and undo the result if it is not useful.

## What it does

- **Workstream** groups tabs that support the same active task or deliverable.
- **Topic** groups tabs that cover the same subject.
- **Intent** groups tabs used for the same immediate activity, such as comparing or writing.
- **Custom criteria** let you add your own grouping instruction and remove it later.
- **Undo** restores the previous tab order, membership, group name, colour, and collapsed state for tabs that still exist.

Threadline groups the active window only when you press **Organise current window**. It does not watch tab events or reorganise tabs automatically. Pinned and split-view tabs are left alone. Ambiguous tabs and one-tab classifications stay ungrouped.

## Providers

Threadline uses the Vercel AI SDK directly from its Manifest V3 service worker. It supports:

- OpenAI
- Anthropic
- Google Generative AI
- OpenAI-compatible services, including a custom base URL and local models

Enter the exact model identifier supplied by your provider. A custom remote base URL must use HTTPS. Localhost and `127.0.0.1` may use HTTP.

## Privacy and permissions

Your API key is stored in `chrome.storage.local` in this Chrome profile. It is not synced and is restricted to trusted extension pages. Threadline has no account, backend, analytics, or telemetry.

A classification request sends only:

- the tab title;
- a minimised URL with credentials, query, and fragment removed (local file paths are removed);
- a temporary reference such as `T1`.

Threadline never reads page contents, browsing history, bookmarks, cookies, or form data. Tab metadata is treated as untrusted input and cannot invoke tools. The settings page asks Chrome for network access to the configured provider origin only when you press **Save settings**. See [Privacy](docs/privacy.md) for the full boundary.

## Develop with Bun

Requirements: Bun 1.1.34 or newer and a Chrome version that supports the Split View tab metadata used by the extension.

```sh
bun install
bun run dev
bun run check
```

Useful commands:

```sh
bun run typecheck   # strict TypeScript
bun run lint        # Oxlint, warnings fail
bun run test        # browser-free domain, application, adapter, and React tests
bun run build       # production extension in dist/
```

The functional core under `src/domain/` has no Chrome dependency. Application use cases depend on ports and run against in-memory fakes. Chrome storage, tab mutation, permissions, and AI SDK calls live under `src/adapters/`.

## Load the unpacked extension

1. Run `bun run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository’s `dist/` directory.
5. Open Threadline’s settings, choose a provider, enter a key and model, and press **Save settings**.
6. Open the toolbar popup, choose a criterion, and press **Organise current window**.
7. Press **Undo last grouping** to restore the previous layout.

The production manifest requests `tabs`, `tabGroups`, and `storage`. Provider host patterns are optional; Chrome grants only the origin approved from Settings.

For a credential-free browser smoke, run `bun run mock:provider`, choose **OpenAI-compatible**, enter the printed base URL, model `threadline-fixture`, and any non-empty fixture key. The server groups `T1` and `T2`; it is development-only and is not included in `dist/`.

## Failure behavior

Settings and provider output are validated before tabs change. Authentication, rate-limit, connection, permission, and invalid-output failures use short messages that never include keys or provider response bodies. Before the first tab mutation, Threadline stores a pending snapshot in `chrome.storage.session`. A partial failure triggers restoration; if restoration also fails, Undo retains the recovery snapshot.

## Current limits

- Chrome only.
- Active window only.
- One level of Undo.
- Tabs closed after grouping cannot be restored.
- Custom providers must implement the OpenAI-style API expected by the AI SDK adapter.
- Exact restoration is best-effort if the user moves, opens, or closes tabs while a provider request or Undo is running.
