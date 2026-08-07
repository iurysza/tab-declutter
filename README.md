<p align="center">
  <img src="public/icons/icon-128.png" width="96" alt="Tab Declutter icon">
</p>

<h1 align="center">Tab Declutter</h1>

<p align="center"><strong>Turn a crowded Chrome window into named threads.</strong></p>

<p align="center">
  <a href="https://github.com/iurysza/tab-declutter/releases/latest"><img src="https://img.shields.io/github/v/release/iurysza/tab-declutter?display_name=tag&sort=semver" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/Chrome-140%2B-4285F4" alt="Chrome 140 or newer">
  <img src="https://img.shields.io/badge/Manifest-V3-5A63D8" alt="Manifest V3">
</p>

Tab Declutter groups open tabs into named workstreams with your chosen LLM—private, local, one-click Undo.

Pick a grouping lens, organise once, and undo the result in one click.

```text
current window  →  Workstream / Topic / Intent  →  named tab groups  →  Undo
```

## Why

Tab groups help only when someone names and maintains them. Tab Declutter does that work when you ask—never in the background and never across every window.

- **Workstream** groups tabs that support the same task or deliverable.
- **Topic** groups tabs about the same subject.
- **Intent** groups tabs used for the same activity, such as comparing or writing.
- **Custom criteria** let you define another grouping lens.
- **Undo** restores the previous order, membership, group name, colour, and collapsed state for tabs that still exist.

Pinned and split-view tabs stay untouched. Ambiguous tabs and one-tab classifications stay ungrouped.

## Install

Requires Chrome 140 or newer.

1. Download `tab-declutter-v0.1.1.zip` from the [latest release](https://github.com/iurysza/tab-declutter/releases/latest).
2. Unzip it.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Select **Load unpacked** and choose the unzipped folder.

### Build from source

```sh
git clone https://github.com/iurysza/tab-declutter.git
cd tab-declutter
bun install --frozen-lockfile
bun run build
```

Load the generated `dist/` folder from `chrome://extensions`.

## Set up a provider

1. Open Tab Declutter **Settings**.
2. Choose a provider and enter its exact model ID and your API key.
3. For an OpenAI-compatible service, add its base URL.
4. Select **Save settings** and approve access to that provider origin.
5. Open the popup, choose a criterion, and select **Organise current window**.

| Provider | Configuration |
| --- | --- |
| OpenAI | API key and model ID |
| Anthropic | API key and model ID |
| Google Generative AI | API key and model ID |
| OpenAI-compatible | API key, model ID, and base URL |

Remote custom endpoints must use HTTPS. `localhost`, `127.0.0.1`, and `[::1]` may use HTTP for local models and development.

Your API key stays in `chrome.storage.local` in this Chrome profile and is sent only to authenticate requests to your chosen provider. Undo state stays in `chrome.storage.session`. Chrome asks for provider access only after you select **Save settings**.

## Privacy

Tab Declutter has no account, backend, analytics, or telemetry. It uses no content scripts.

A classification request sends the selected grouping instruction plus each eligible tab's title, minimised URL, and temporary reference such as `T1`. Tab Declutter removes URL credentials, query strings, fragments, and local file paths. It never reads page contents, Chrome browsing history, bookmarks, cookies, or form data.

Your API key stays in `chrome.storage.local` in this Chrome profile. Undo state stays in `chrome.storage.session`. Chrome asks for provider access only after you select **Save settings**.

Required permissions:

- `tabs` reads and organises tabs in the active window.
- `tabGroups` creates, names, and restores groups.
- `storage` keeps settings and one recoverable Undo snapshot.

Read the full [privacy policy](docs/privacy.md).

## How grouping stays safe

Tab Declutter validates settings and structured model output before changing a tab. Unknown references, duplicate assignments, blank names, ambiguous results, and singleton groups are discarded.

Before the first mutation, Tab Declutter saves the current layout in session storage. If grouping fails partway through, it restores that snapshot. If restoration also fails, the snapshot remains available through Undo.

## No-key demo

Run the local OpenAI-compatible fixture:

```sh
bun run mock:provider
```

In Settings, choose **OpenAI-compatible**, use the printed base URL, set the model to `tab-declutter-fixture`, and enter any non-empty development key. The fixture groups `T1` and `T2` as **Fixture workstream**.

## Development

Requires Bun 1.1.34 or newer.

```sh
bun install --frozen-lockfile
bun run dev
bun run check
```

`bun run check` runs strict TypeScript, Oxlint, browser-free tests, the production build, and project-contract verification.

The functional core under `src/domain/` has no Chrome dependency. Application use cases depend on ports and run against in-memory fakes. Chrome storage, tab mutation, permissions, and AI SDK calls live under `src/adapters/`.

## Documentation

- [Privacy policy](docs/privacy.md)
- [Chrome Web Store publishing guide](docs/chrome-web-store.md)
- [AI SDK architecture decision](docs/decisions/ADR-0001-use-ai-sdk-in-service-worker.md)

## Limits

- Chrome only.
- Active window only.
- One level of Undo.
- Closed tabs cannot be restored.
- OpenAI-compatible providers must implement the API shape expected by the AI SDK adapter.
- Exact restoration is best-effort if tabs move, open, or close during grouping or Undo.
