# Development Report — 2026-04-03 — Favicon Revert & Add Exception / File URL Fixes

## Summary

Reverted the block page favicon back to the original site's favicon for better tab identification, and fixed the Add Exception button and `file://` URL handling after the Modes architecture migration.

---

## Changes

### Block page favicon reverted to original site (`7b9557c`)

- Reverted the block page's favicon back to displaying the blocked site's own favicon rather than Producer's icon.
- Keeps browser tabs more informative when multiple tabs are open, as the site's favicon provides a visual cue about which site was blocked.

### Add Exception fix (`7b9557c`)

- Fixed the Add Exception button on the block page to correctly write the allowed URL into the currently active Mode's rule set.
- **Root cause**: after the Modes migration, rule sets moved from a flat `customRules` array to `customModes`, but the Add Exception handler was still targeting the old structure.

### File URL fix (`7b9557c`)

- Fixed handling of `file://` protocol URLs so they are correctly recognised and matched against rules in the Modes rules list.
- Previously, `file://` URLs were being passed through rule matching in a form that caused them to fail comparisons, meaning file-based pages could not be properly blocked or allowed.

---

## Technical Notes

- `blocked.html` / `blocked.js` — favicon logic reverted to use the originating site's favicon
- `background.js` — Add Exception message handler updated to target the correct mode's rule set; `file://` URL normalisation in rule matching
- `popup.js` — file URL display fix in rules list items
