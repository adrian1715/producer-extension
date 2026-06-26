# Development Report — 2026-05-26 — Permanent Rule Undo Button & Live Sync Fixes

## Summary

Added an undo button to the blocked page that removes a permanent rule without navigating away if the URL is still covered by a focus-mode rule. Fixed several related edge cases: blocked-page tabs being invisible to the reload logic, stale in-memory rules on service worker wake-up, incorrect block counters on new sessions, and a slow first-click experience due to service worker cold-start.

---

## Changes

### Undo Permanent Rule button on the blocked page (`05d6f4e`)

- Added `#undo-permanent-rule-btn` to `blocked.html`, alongside the existing Allow Once and Add Exception actions.
- Button visibility is driven by a dedicated `isPermanent` flag carried end-to-end from `background.js` through to the `blocked.html` URL query parameters, so the correct button appears even when a permanent rule and an active focus-mode rule overlap on the same site.

### Smart navigation after undo (`05d6f4e`)

- After removing a permanent rule, the handler awaits `checkStillBlocked()` before deciding what to do next.
- If the site is truly unblocked it navigates away; if a focus-mode rule still covers it, the page updates in place from the permanent-block view to the focus-mode-block view via `updateBlockTypeUI()` — without a full reload.

### Live permanent-status sync without page reload (`05d6f4e`)

- When a rule's permanent status changes while a tab stays blocked under focus mode (e.g. the lock button is toggled from the popup), background now pushes an `updatePermanentStatus` message directly to the affected tab instead of reloading it.
- `blocked.js` listens for `updatePermanentStatus` and re-checks `isPermanent` on every `checkStillBlocked()` poll, swapping button and stats visibility without a page reload.

### Fixed blocked-page tabs invisible to reload logic (`05d6f4e`)

- **Root cause**: block-status comparisons used `tab.url` directly. For a tab showing `blocked.html`, `tab.url` is the extension's own page URL — not the original site — so it could never match a domain or URL rule, and `wasBlocked` was always computed as `false`.
- **Fix**: compute `urlToCheck` as the decoded original URL via `getBlockedPageOriginalUrl(tab.url)` for any tab currently showing `blocked.html`, and use that for both before-and-after `shouldBlockUrlWith` calls.

### Session block counter correctness (`05d6f4e`)

- `reportBlock` now re-reads `sessionBlocks` from storage before incrementing, so a freshly created or activated session starts from its own persisted counter rather than stale in-memory state from a previous session.
- Block numbers are floored at 1 end-to-end so `Block #0` can never render.
- Pre-existing open tabs are no longer retroactively added to the session counter when focus mode is activated.

### Service worker wake-up on blocked-page load (`05d6f4e`)

- `blocked.js`'s `init()` now fires a fire-and-forget `ping` to background as its very first action, before any `await`.
- Button, visibility, and poll setup run before async theme/quote loading, so the page is fully interactive and the service worker is already awake by the time the user can click a button — instead of the first click stalling while Chrome spins the worker back up.

---

## Technical Notes

- `background.js` — `removePermanentRule` handler; `updatePermanentStatus` push on partial-status change; `urlToCheck` fix using `getBlockedPageOriginalUrl()` in `reloadAffectedTabs`; `isPermanent` added to `checkBlock`/`reportBlock` responses; session counter resync; `ping` handler; `countCurrentlyBlockedTabs` simplified to no-op stub
- `blocked.html` — new `#undo-permanent-rule-btn`
- `blocked.js` — `isPermanent`-driven UI via `updateBlockTypeUI()`; `checkStillBlocked`-based undo flow; `updatePermanentStatus` listener; earlier `ping` and reordered `init()`
- `content.js` — passes `isReload` flag with `reportBlock`; defends `blockNumber` against non-finite/zero values
- `popup.js` — removed `countCurrentlyBlockedTabs` call on focus-mode activation
