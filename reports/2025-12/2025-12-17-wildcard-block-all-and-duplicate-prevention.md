# Development Report — 2025-12-17 — Wildcard Block-All, Duplicate Prevention & Rules List Fix

## Summary

Added a wildcard `*` rule enabling a strict whitelist-mode workflow where all sites are blocked by default and users add Allow exceptions. Also introduced duplicate detection for both wildcard and URL rules, and fixed the rules list scroll-container height.

---

## Changes

### Wildcard block-all feature (`19c6f1b`)

- Users can now add `"*"` as a rule URL to block all websites at once, enabling a strict whitelist-mode workflow.
- After adding the wildcard, users build up Allow exceptions for the specific sites they want to keep accessible — inverting the normal block-list model into an allow-list model.
- The wildcard rule is clearly labelled with a 🌐 icon wherever it appears in the rules list to distinguish it from regular domain rules.

### Duplicate wildcard prevention (`19c6f1b`)

A guard prevents more than one wildcard rule from being added to the same rule set. If the user attempts to add `"*"` when a wildcard already exists, an error notification is shown and the input is cleared.

### Duplicate URL detection (`19c6f1b`)

Before saving a new rule, the extension checks whether the entered URL already exists in the current rule set. Duplicate URLs trigger an error notification, preventing redundant or conflicting rules from accumulating silently.

### Automatic URL input clearing on errors (`19c6f1b`)

On any validation error — duplicate URL, duplicate wildcard, or invalid URL — the URL input field is automatically cleared after the error notification, so the user can immediately type a correction without manually deleting the invalid entry.

### Rules list scroll-container height fix (`19c6f1b`)

Fixed the scroll-container height for the rules list, setting it to a consistent `80px` to prevent layout shifts and ensure the container renders at the correct size regardless of how many rules are loaded.

---

## Technical Notes

- `popup.js` — wildcard rule logic, duplicate detection, input clearing on error, rules list rendering
- `popup.html` — rules list scroll-container height adjustment
- `popup.css` — wildcard icon and label styling
