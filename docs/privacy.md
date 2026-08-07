# Privacy

Tab Declutter is client-only. It has no backend, user account, telemetry, advertising, or remote code.

## Stored locally

`chrome.storage.local` stores the active provider, API key, model, optional base URL, selected criterion, and custom criteria. The service worker restricts local storage to trusted extension contexts. `chrome.storage.session` stores one crash-recoverable grouping/Undo snapshot containing tab IDs, order, and group metadata; it is scoped to the browser session.

## Sent to the provider

Tab Declutter sends the selected grouping criterion's name and instruction. For each eligible tab in the active window, it also sends a temporary reference, title, and minimised URL. URL credentials, query strings, fragments, and local file paths are removed first. Provider credentials are sent only to the configured provider as required for authentication.

## Never collected

Tab Declutter does not read or collect page contents, Chrome browsing history, bookmarks, cookies, form values, or browser identity. It does not log API keys or provider response bodies. Network permission is requested from a user gesture for the configured origin.
