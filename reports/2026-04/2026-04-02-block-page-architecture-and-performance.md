# Development Report — 2026-04-02 — Block Page Architecture & Performance

## Summary

Moved the block page from being injected by `content.js` into a standalone `blocked.html` extension page, improving performance, enabling Producer's own favicon on blocked tabs, and cleanly separating blocking logic from blocked-page UI.

---

## Changes

### Separate block page architecture (`4a02670`)

- Moved the block page from being injected via `content.js` into a standalone `blocked.html` file served directly as an extension page.
- `content.js` now redirects blocked navigations to the extension's `blocked.html` URL rather than injecting HTML inline.
- **Benefits**:
  - Eliminates the performance cost of injecting and running the block page UI as part of the content script context on every blocked tab.
  - Allows Producer's own favicon to be displayed on the browser tab when a site is blocked.
  - Cleaner separation of concerns between content script (navigation interception) and block page (UI and user actions).

### Blocked-tab memory usage reduction (`4a02670`)

- Optimised the handling of blocked tabs to reduce memory consumption.
- The previous approach accumulated overhead as more tabs were blocked during a session; the new approach clears unnecessary in-memory references once a tab's blocked status has been established and communicated to the block page.

### Manifest and resource updates (`4a02670`, `d460de3`)

- Updated `manifest.json` to declare `blocked.html` as a web-accessible resource.
- Added Producer's icon to the manifest's icon declarations so it appears correctly on the Chrome extensions management page (`chrome://extensions`).

---

## Technical Notes

- `manifest.json` — `blocked.html` declared as web-accessible resource; Producer icon entries added
- `content.js` — block redirect updated to navigate to `blocked.html` extension URL instead of injecting inline HTML
- `blocked.html` — new standalone block page file with full UI structure
- `blocked.js` — new script powering the standalone block page (timers, buttons, stats)
- `background.js` — minor adjustments to blocked-tab tracking and memory management
