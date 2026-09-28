---
description: How Settings saves provider configuration, requests Chrome host access, and handles partial failures.
---

# Provider access and settings

The Options page owns provider configuration. Unlike the popup, [`Options.tsx`](../../src/options/Options.tsx) calls [`chrome-storage.ts`](../../src/adapters/chrome/chrome-storage.ts) and [`chrome-permissions.ts`](../../src/adapters/chrome/chrome-permissions.ts) directly. Its **Save settings** handler requests host access before writing settings. Grouping runs in the service worker. See the [architecture guide](README.md) for the grouping and Undo flows.

## Saving a provider

When the user selects **Save settings**, `Options.save` takes these steps in order:

1. `parseProviderSettings` in [`domain/settings.ts`](../../src/domain/settings.ts) checks the provider, nonempty API key and model ID, and base URL. OpenAI-compatible providers need a base URL. Custom URLs must use HTTPS, except HTTP on `localhost`, `127.0.0.1`, or `[::1]`. `customCriterionSchema` checks every custom lens before any Chrome call.
2. `requestProviderPermission` asks Chrome for `providerOriginPattern(settings)`, an origin-wide match such as `https://api.openai.com/*`. The manifest declares optional hosts; the request asks for the configured origin, not every optional host. If Chrome denies the request, nothing is saved.
3. `saveOptionsData` writes the provider settings and custom lenses to `chrome.storage.local` in one `set` call. If the saved provider had a different origin, `removeProviderPermission` then asks Chrome to remove access to the old origin.

The storage adapter reads custom lenses through `customCriterionSchema` and discards invalid stored entries. It reads provider settings as `unknown`; [`groupCurrentWindow`](../../src/application/group-current-window.ts) validates them again before grouping. `getPopupState` uses that same parser to decide whether the popup is configured. A valid configuration does **not** imply Chrome still grants network access: grouping separately calls `permission.contains` and returns `permission-missing` if access was removed.

## Partial failures

This is not an atomic transaction across Chrome permissions and storage. [`Options.test.tsx`](../../src/options/Options.test.tsx) covers the main outcomes:

| Point of failure | Saved settings | Host access | Notice |
| --- | --- | --- | --- |
| Validation or permission request denied | Unchanged | No new grant from a denied request | Error; nothing saved |
| Storage write rejects after permission succeeds | Not established by the error | The new grant may remain; the code does not revoke it | "Settings could not be saved. Try again." |
| Old-origin removal fails after storage succeeds | New settings saved | Old and new origins may both remain allowed | "Settings saved, but Chrome could not remove access to the previous provider" |

The last two host-access outcomes follow from the order of calls in `Options.save`; the tests assert the error notice and whether removal was called, not Chrome's storage or permission state after a failure. A successful save to the same origin does not remove that origin. The service worker checks access on every grouping request, not just when Settings is saved.

`chrome.storage.local` also holds the selected lens. The popup saves a selection through `select-criterion`; the shortcut reads that stored ID. If a deleted custom lens was selected, [`getPopupState`](../../src/application/get-popup-state.ts) stores the Project fallback when the popup next loads. See the [privacy policy](../../docs/privacy.md) for what is stored and sent to the provider.
