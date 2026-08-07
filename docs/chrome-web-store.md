# Publish Tab Declutter to the Chrome Web Store

Status: not submitted.

This checklist follows the current [Chrome Web Store publishing documentation](https://developer.chrome.com/docs/webstore/publish).

## 1. Prepare the publisher account

1. Open the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Register as a Chrome Web Store developer and pay the one-time registration fee.
3. Enable 2-Step Verification on the publishing Google account.
4. Set the required publisher name.
5. Add and verify the contact email. Use an address that will be monitored for review, warning, and takedown notices.

Google does not let a developer account change its email later. Use the intended long-term publishing identity.

## 2. Build the upload package

Run the full gate before packaging:

```sh
bun install --frozen-lockfile
bun run check
rm -f /tmp/tab-declutter-store.zip
(cd dist && zip -qr /tmp/tab-declutter-store.zip .)
unzip -l /tmp/tab-declutter-store.zip | sed -n '1,40p'
```

`manifest.json` must be at the ZIP root. Do not upload a ZIP that contains a top-level `dist/` directory.

Check the built manifest before every submission:

```sh
jq '{name, version, description, permissions, optional_host_permissions}' dist/manifest.json
```

Every update must increase the manifest version.

## 3. Prepare the listing

Use the public GitHub repository for homepage and support:

- **Homepage:** `https://github.com/iurysza/tab-declutter`
- **Support:** `https://github.com/iurysza/tab-declutter/issues`

### Store Listing fields

- **Title:** Tab Declutter
- **Summary (short description):** Group open tabs into named workstreams with your chosen LLM—private, local, one-click Undo.
- **Category:** Productivity
- **Language:** English
- **Privacy policy:** `https://github.com/iurysza/tab-declutter/blob/main/docs/privacy.md`

### Detailed description

Problem

> A crowded Chrome window hides the tabs you actually need. Tab groups only help when someone names and maintains them.

Outcome

> Tab Declutter turns the tabs in your current Chrome window into named groups with your own LLM. Choose Workstream, Topic, Intent, or a custom lens, then click **Organise current window**. Pinned and split-view tabs stay untouched; ambiguous tabs and singletons stay ungrouped. One-click Undo restores the original order, membership, group name, colour, and collapsed state for tabs that still exist.

How it works

> 1. Open the popup and pick a grouping lens.
> 2. Tab Declutter sends only eligible tab titles and minimised URLs, plus the selected instruction, to the provider you configured.
> 3. The provider returns suggested group names and tab memberships.
> 4. Tab Declutter creates the groups in the active window. If anything goes wrong, Undo reverts the change.

Privacy and trust

> Your API key and settings live in `chrome.storage.local`; the recoverable Undo snapshot lives in `chrome.storage.session`. Tab Declutter has no account, backend, analytics, telemetry, content scripts, or remote code. No data is sold or used for advertising.

Support

> File bugs and feature requests at `https://github.com/iurysza/tab-declutter/issues`.

Avoid keyword lists, repeated terms, or claims that are not visible in the product.

## 4. Create store images

Required assets:

- 128×128 PNG store icon with transparent padding (`public/icons/icon-128.png` and `store-assets/icon-128.png`).
- At least one full-bleed screenshot at 1280×800 or 640×400. Up to five are allowed.
- One 440×280 PNG or JPEG small promotional tile (`store-assets/promo-tile-440x280.png`).

Suggested set:

1. **Outcome hero:** a real Chrome window grouped into meaningful workstreams (e.g., “Ship feature”, “Compare pricing”, “Review docs”).
2. The popup showing Workstream, Topic, Intent, and a custom criterion.
3. BYOK settings with provider, model, key, and base URL fields plus the local-storage privacy message.
4. Undo restoring the previous layout.
5. A narrow permissions grant prompt triggered by **Save settings**.

Use current product UI, square corners, no padding, and little overlaid text. Follow Google's [image requirements](https://developer.chrome.com/docs/webstore/images).

Editable sources and a generation script are in `store-assets/`.

## 5. Complete Privacy practices

### Single purpose

> Organise tabs in the active Chrome window into named groups using a user-configured LLM, with one-step Undo.

### Permission justifications

**`tabs`**

> Reads tab IDs, titles, URLs, positions, pinned state, and split-view state in the active window so Tab Declutter can classify eligible tabs, create groups, and restore the previous layout. Tab Declutter does not read page contents.

**`tabGroups`**

> Creates and names Chrome tab groups, reads existing group metadata, and restores group title, colour, collapsed state, and membership during Undo.

**`storage`**

> Stores provider settings and custom criteria in profile-local storage. Stores one pending or ready Undo snapshot in session storage so recovery survives service-worker suspension.

**`optional_host_permissions`** (`https://*/*`, `http://localhost/*`, `http://127.0.0.1/*`, `http://[::1]/*`)

> Tab Declutter connects directly to the LLM provider you choose, using your own key. Because OpenAI-compatible providers can be any HTTPS origin, the manifest declares a broad HTTPS optional host permission; at runtime Tab Declutter requests access only to the exact origin shown in **Save settings**, and only when you press that button. Native OpenAI, Anthropic, and Google providers use their fixed origins. HTTP is limited to `localhost`, `127.0.0.1`, and `[::1]` for local models and development.

### Remote code

Select **No, I am not using remote code**. Provider responses are treated as untrusted data and validated against a bundled schema. All executable JavaScript ships in the extension package.

### Data disclosure

Disclose at least:

- **Web history:** eligible tab titles and minimised URLs are sent directly to the LLM provider you selected so it can suggest groups.
- **Authentication information:** your provider API key is stored in `chrome.storage.local` and is sent only to authenticate requests to that provider.
- **User-provided content:** custom criterion names and instructions are sent as part of the grouping request.

Certify that data is used only for Tab Declutter's single purpose and is not sold, used for advertising, or transferred for unrelated purposes. The public privacy policy and in-product copy name the user-selected LLM provider as the receiving third party.

## 6. Set distribution and reviewer access

For this first listing:

1. Choose **Public** visibility.
2. Select all intended regions or keep the default.
3. Choose **automatic publishing after review** unless the dashboard forces a different option.
4. Enable dashboard notifications for review/support messages.

Tab Declutter needs a working provider to demonstrate grouping. In the dashboard's **Test instructions** tab, provide a temporary, budget-limited provider credential and exact model ID. Store it only in the dashboard, never in the repository. Revoke it after review.

If a disposable reviewer credential is not available, treat that as the only honest blocker and do not fabricate credentials.

Suggested reviewer flow:

1. Open Tab Declutter **Settings** from the popup.
2. Choose the supplied provider and enter the exact model ID from the Test instructions.
3. Paste the temporary API key and select **Save settings**, then approve the exact provider origin.
4. Open at least three ordinary tabs in the current window.
5. Open the popup, choose **Workstream**, and select **Organise current window**.
6. Confirm named groups appear in the active window.
7. Select **Undo last grouping** and confirm the original order, membership, and group names return.

## 7. Upload and submit

1. In the Developer Dashboard, select **Add new item**.
2. Upload `/tmp/tab-declutter-store.zip`.
3. Complete **Store Listing**, **Privacy**, **Distribution**, and **Test instructions**.
4. Select **Submit for Review**.
5. Choose **automatic publishing after review** if prompted.

Most reviews finish within a few days, but they can take weeks. New developers, new extensions, `tabs`, and broad optional host patterns can increase review time.

## 8. Automate later updates

The [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api) can upload and publish later versions after the first item and dashboard metadata exist.

Setup requires:

1. A Google Cloud project with the Chrome Web Store API enabled.
2. An OAuth consent screen and OAuth client, or a service account with publisher access.
3. The `https://www.googleapis.com/auth/chromewebstore` scope.
4. The publisher ID and extension ID from the Developer Dashboard.
5. OAuth client credentials and refresh token stored only in CI secrets.

The v2 endpoints upload a ZIP to an existing item, fetch upload status, submit it for review, cancel a submission, and publish. Visibility changes must first be published manually from the dashboard.

## Readiness gaps

Repository work done on `release/chrome-store`:

- transparent padding added to the 128×128 store icon;
- 1280×800 outcome-led screenshot and 440×280 promo tile created under `store-assets/`;
- privacy policy linked to the public `main` branch URL above;
- optional host permissions include IPv6 loopback and match the runtime origin logic;
- previous provider origin is revoked after the new origin is saved and granted;
- listing copy follows problem → outcome → how it works → privacy/trust → support;
- permission justifications explain the broad HTTPS declaration and the exact runtime origin request.

Dashboard-only tasks that remain:

- register and verify the long-term publisher account;
- fill Store Listing, Privacy, Distribution, and Test instructions;
- upload `/tmp/tab-declutter-store.zip` and submit for review;
- prepare a temporary reviewer credential and exact model ID for Test instructions.

Honest blocker: a disposable reviewer credential and model ID must be supplied in the dashboard's Test instructions before submission. Do not invent credentials.
