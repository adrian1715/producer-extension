# Development Report — 2026-04-05 — Popup Navigation Scroll Reset

## Summary

Fixed scroll position inheritance across all tab switches and subpage navigations so every view is entered from the top, providing consistent and predictable page entry throughout the popup.

---

## Changes

### Scroll-to-top on every tab and subview transition

- Every tab switch and subpage navigation within the popup now resets the scroll position to the top of the view on entry.
- Previously, navigating away from a scrolled view and returning (or entering a new subpage) would inherit the previous scroll position, causing the user to land partway down the page.
- The fix applies to all top-level tabs and nested subpages, including nested scroll containers such as the rules list inside Mode Settings.

---

## Technical Notes

- `popup.js` — scroll reset logic applied to all tab-switch and subpage-navigation handlers; nested scroll containers explicitly targeted and reset
