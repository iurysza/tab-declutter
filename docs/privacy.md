# Privacy policy

Last updated: 26 September 2026, for version 0.2.0.

Tab Declutter runs entirely in your browser. It has no backend, user account, telemetry, advertising, or remote code. Tab Declutter's developer receives none of your data.

## What is stored in your browser

`chrome.storage.local` stores your chosen provider, API key, model ID, optional base URL, last-used lens, and custom lenses. Only trusted extension pages can read it.

`chrome.storage.session` stores one Undo snapshot: tab IDs, tab order, and group names, colors, and collapsed state. Chrome clears it when the browser session ends.

## What is sent to your AI provider

Data is sent only when you select **Group tabs** in the popup or press the keyboard shortcut. It goes directly to the provider you configured. That provider's own privacy policy then applies.

Each request contains:

- the name and instruction of the lens you picked;
- for each eligible tab in the active window: a temporary reference such as `T1`, the tab title, and the URL with credentials, query string, fragment, and local file paths removed.

When you use the **Session** lens, each tab may also include:

- a rounded time since you last used it, such as "just now", "25 min ago", or "yesterday". Exact timestamps are never sent;
- the temporary reference of the tab that opened it, if that tab is still open. Chrome tab IDs are never sent.

Other lenses never send time or opener information.

Your API key is sent only to your configured provider, to authenticate the request.

## What is never collected

Tab Declutter does not read or collect page contents, browsing history, bookmarks, cookies, form data, or your identity. Pinned and split-view tabs are never sent. It does not log API keys, tab data, or provider responses.

## Network access

Chrome asks you to allow access to your provider's address when you select **Save settings**. Tab Declutter requests access to that one address only. When you switch providers, it removes access to the previous one.

## Contact

Report problems at <https://github.com/iurysza/tab-declutter/issues>.
