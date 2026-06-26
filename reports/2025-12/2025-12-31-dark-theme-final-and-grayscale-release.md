# Development Report — 2025-12-31 — Dark Theme Finalised & Grayscale Mode Released

## Summary

Dark theme committed to the main branch and grayscale mode moved out of testing and released as a live feature, completing the six-theme lineup.

---

## Changes

### Dark theme finalised (`df64d89`)

Dark theme fully integrated and committed, completing the theme lineup at six options: blue, red, dark, orange, purple, and teal.

### Grayscale mode released (`df64d89`)

- Grayscale mode moved out of testing and committed as a live feature under the Personalise tab.
- When enabled, all browser tabs are displayed in black and white during active focus mode sessions, reducing visual distraction from colour-rich websites.
- Setting is persisted per mode and toggled from the Personalise tab — it activates and deactivates automatically alongside focus mode.

---

## Technical Notes

- `popup.js` — grayscale mode toggle, persistence, and activation/deactivation tied to focus mode state
- `popup.css` — dark theme finalised; grayscale CSS filter rule applied to tab content
- `popup.html` — Personalise tab updated with grayscale toggle control
- `background.js` — grayscale state message handling to apply/remove the filter across active tabs
- `content.js` — grayscale filter application on tab load based on current focus mode state
