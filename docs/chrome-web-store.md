# Publish Threadline to the Chrome Web Store

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
rm -f /tmp/threadline-store.zip
(cd dist && zip -qr /tmp/threadline-store.zip .)
unzip -l /tmp/threadline-store.zip | sed -n '1,40p'
```

`manifest.json` must be at the ZIP root. Do not upload a ZIP that contains a top-level `dist/` directory.

Check the built manifest before every submission:

```sh
jq '{name, version, description, permissions, optional_host_permissions}' dist/manifest.json
```

Every update must increase the manifest version.

## 3. Prepare the listing

Suggested fields:

- **Title:** Threadline
- **Summary:** Turn open tabs into clear, named groups with your chosen LLM.
- **Category:** Productivity
- **Language:** English
- **Homepage:** `https://github.com/iurysza/threadline-tabs`
- **Support:** `https://github.com/iurysza/threadline-tabs/issues`
- **Privacy policy:** publish [`docs/privacy.md`](privacy.md) at a stable public URL and use that URL in the dashboard

Suggested detailed description:

> Threadline organises the tabs in your current Chrome window into clear, named groups using an LLM you choose.
>
> Choose Workstream, Topic, Intent, or a custom grouping criterion. Threadline leaves pinned, split-view, ambiguous, and singleton tabs alone. One-click Undo restores the previous tab order, membership, group name, colour, and collapsed state for tabs that still exist.
>
> Threadline supports OpenAI, Anthropic, Google Generative AI, and OpenAI-compatible services. Your API key stays in this Chrome profile. Threadline has no account, backend, analytics, or telemetry.

Avoid keyword lists or claims that are not visible in the product.

## 4. Create store images

Required assets:

- 128×128 PNG store icon. `public/icons/icon-128.png` is the current source; verify that its artwork has suitable transparent padding.
- At least one full-bleed screenshot at 1280×800 or 640×400. Up to five are allowed.
- One 440×280 PNG or JPEG small promotional tile.

Optional:

- One 1400×560 PNG or JPEG marquee tile.
- A YouTube demo video.

Useful screenshot set:

1. Provider setup and the local-storage privacy message.
2. Workstream, Topic, and Intent selection in the popup.
3. A real Chrome window before grouping.
4. The same window grouped as named workstreams.
5. Undo restoring the original layout.

Use current product UI, square corners, no padding, and little overlaid text. Follow Google's [image requirements](https://developer.chrome.com/docs/webstore/images).

## 5. Complete Privacy practices

### Single purpose

> Organise tabs in the active Chrome window into named groups using a user-configured LLM, with one-step Undo.

### Permission justifications

**`tabs`**

> Reads tab IDs, titles, URLs, positions, pinned state, and split-view state in the active window so Threadline can classify eligible tabs, create groups, and restore the previous layout. Threadline does not read page contents.

**`tabGroups`**

> Creates and names Chrome tab groups, reads existing group metadata, and restores group title, colour, collapsed state, and membership during Undo.

**`storage`**

> Stores provider settings and custom criteria in profile-local storage. Stores one pending or ready Undo snapshot in session storage so recovery survives service-worker suspension.

**Optional host permissions**

> Connects directly to the LLM provider configured by the user. Threadline requests access from a Save-settings gesture and requests the configured provider origin. HTTPS covers remote providers; HTTP is limited to localhost and 127.0.0.1 for local models and testing.

### Remote code

Select **No, I am not using remote code**. Provider responses are treated as untrusted data and validated against a bundled schema. All executable JavaScript ships in the extension package.

### Data disclosure

Disclose at least:

- **Web history:** eligible tab titles and minimised URLs are sent to the user-selected provider to perform grouping.
- **Authentication information:** the user-supplied provider API key is stored locally and sent only to authenticate requests to that provider.
- **User-provided content:** custom criterion names and instructions may be sent as part of the grouping request.

Certify that data is used only for Threadline's single purpose and is not sold, used for advertising, or transferred for unrelated purposes. The public privacy policy and in-product copy must name the user-selected LLM provider as the receiving third party.

## 6. Set distribution and reviewer access

For a cautious first submission:

1. Choose **Private** and add trusted testers, or choose **Unlisted** for link-only installation.
2. Select the intended regions.
3. Use deferred publishing when submitting for review if the public launch needs a final manual checkpoint.

Threadline needs a working provider to demonstrate grouping. In the dashboard's **Test instructions** tab, provide a temporary, budget-limited provider credential and exact model ID. Store it only in the dashboard, never in the repository. Revoke it after review.

Suggested reviewer flow:

1. Open Threadline Settings.
2. Choose the supplied provider and model.
3. Enter the temporary key and save.
4. Open at least three ordinary tabs.
5. Choose Workstream and organise the current window.
6. Confirm named groups appear.
7. Select Undo and confirm the original layout returns.

## 7. Upload and submit

1. In the Developer Dashboard, select **Add new item**.
2. Upload `/tmp/threadline-store.zip`.
3. Complete **Store Listing**, **Privacy**, **Distribution**, and **Test instructions**.
4. Select **Submit for Review**.
5. Choose automatic or deferred publishing.

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

Before the first submission:

- create the required 1280×800 screenshot and 440×280 promo tile;
- publish the privacy policy at a stable public URL;
- register and verify the long-term publisher account;
- prepare a temporary reviewer credential and test instructions;
- run `bun run check` and the unpacked Chrome smoke against the exact ZIP contents.
