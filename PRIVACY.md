# Privacy Policy — Producer (Focus Extension)

_Last updated: 2026-06-30_

Producer is a Chrome extension that blocks distracting websites and URLs during
focus sessions. This policy explains what data the extension handles.

## Data we collect

**None is sent to us.** Producer has no account system, no analytics, and no
remote backend operated by the developer. We do not collect, sell, or share any
personal information.

## Data stored on your device

All of your data is stored locally in your browser via the Chrome storage API
(`chrome.storage.local`) and never leaves your device except as described in
"Network requests" below. This includes:

- Block/allow rules and the modes (rule sets) you create
- Focus session history and timers (counts, durations, names)
- Appearance and block-page personalization settings, including any background
  image you choose to add (stored as local data)

You can remove this data at any time by clearing the extension's rules/sessions
from its interface, or by removing the extension from Chrome.

## Network requests

Producer makes one type of outbound request: to `api.forismatic.com` to fetch a
public motivational quote shown on the block page. This request contains **no
personal data and no information about you or the sites you visit** — it only
asks the public quote service for a random quote. If the request fails, a
built-in default quote is shown instead.

The extension makes no other network requests.

## Permissions and why they are needed

- **storage** — to save your rules, sessions, and settings locally.
- **tabs** — to detect when a tab navigates to a blocked site and to reload or
  redirect affected tabs when your rules change.
- **host access (`<all_urls>`)** — the content script must run on every site so
  it can check the current URL against your block rules and show the block page.
  URLs are evaluated locally on your device and are never transmitted anywhere.

## Changes to this policy

If this policy changes, the updated version will be published at the same
location with a revised "Last updated" date.

## Contact

Questions about this policy can be sent to: adrian40001@gmail.com
