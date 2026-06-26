# Development Report — 2026-04-04 — Favicon Fallback & Personalise Tab Rework

## Summary

Refined the favicon strategy with a Producer fallback for sites without their own favicon, fixed Allow Once to not interfere with focus mode deactivation, and shipped a comprehensive rework of the Personalise tab with custom block page title/message, theme-linked colours, background images, and toggle controls for optional elements.

---

## Changes

### Favicon fallback for sites without a favicon (`1201b4f`)

- The block page now displays the blocked site's own favicon by default, but falls back to Producer's favicon when the original site has none.
- Balances the two previous approaches — sites with favicons remain easily identifiable, while favicon-less tabs now show Producer's icon instead of a blank.

### Allow Once — prevented reload on focus deactivation (`1201b4f`)

- **Root cause**: the focus mode deactivation logic reloaded all tabs that were on the block page. "Allow Once" tabs had already navigated away from `blocked.html`, but the reload check was not accounting for this.
- **Fix**: the deactivation logic now checks whether a tab is currently showing `blocked.html` before reloading it. Tabs that have already been allowed through are left untouched.

### Personalise tab rework (`f0beb1b`)

- **Editable block page title and message**: users can customise the heading and body text shown on the block page.
- **Theme-linked colours**: block page colours automatically sync with the active popup theme unless the user has set a custom override.
- **Background image**: users can set a background image via a direct URL input, a local file import, or a remove button to clear it.
- **Quote visibility toggle**: users can show or hide the motivational quote section on the block page.
- **Utility button visibility**: users can choose whether Allow Once and Add Exception appear on the block page, hiding them for a more locked-down focus experience.
- All settings are wired end-to-end through popup, background, content, and block page messaging and storage, applying consistently across all open blocked tabs without requiring a full reload.

### Bug fixes from Personalise rework (`f0beb1b`)

- Fixed a regression where theme changes were not updating default block page colours unless the user had previously set a custom colour.
- Fixed local image imports to guard against large file sizes and storage quota failures, with file size validation and a graceful error notification on quota exceeded.
- Improved dark theme button contrast on the block page.
- Fixed line-break rendering from textarea inputs so newlines in the custom message are preserved correctly on the block page.
- Fixed block page layout to keep content contained within its bounds when a background image is set.

### Inline styles extracted to `popup.css` (`f0beb1b`)

Moved all inline styles from `popup.html` into `popup.css`, eliminating the pattern of inline `style` attributes throughout the HTML file and making styles maintainable in one place.

---

## Technical Notes

- `blocked.html` / `blocked.js` — favicon fallback logic; Allow Once reload prevention; custom title, message, colours, background image, quote, and button visibility applied from storage
- `popup.js` — Personalise tab rework (all settings controls, preview, storage wiring); theme-change colour sync; image import size validation
- `popup.html` — Personalise tab HTML restructured; inline styles removed
- `popup.css` — all previously inline styles extracted here; new Personalise tab component styles
- `background.js` — message handlers for personalisation settings applied to open blocked tabs
- `content.js` — personalisation settings passed through to `blocked.html` on block redirect
