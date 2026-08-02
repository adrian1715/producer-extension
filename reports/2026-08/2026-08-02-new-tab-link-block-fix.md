# Development Report — 2026-08-02 — Rule Type Inline Editing & New-Tab Link Block Fixes

## Summary

Two separate updates made today:

1. Added inline editing for rule types in both rule list views. Users can now
   double-click a rule's type label and switch it between Block Domain, Block
   URL, Allow URL, and Allow Parameter without deleting and recreating the
   rule.
2. Fixed two related bugs where an already-allowed page could get wrongly
   blocked because of how sites open links and rewrite the address bar:
   - Clicking a link meant to open in a new tab (`target="_blank"`, or a
     ctrl/cmd/shift-click) could replace the **current** page with the
     blocked page, even when the current page itself was allowed.
   - After that first fix, the new tab opened correctly, but the
     **original** tab could still get blocked moments later because the
     site's own click handler rewrote the current tab's URL via the History
     API (e.g. a YouTube-style `youtube.com/redirect?...` tracking URL)
     before settling back on the real, allowed page — and the extension
     acted on that transient URL.

## Commits

- `5cd1d3d` — adding rule type update feature
- `601a6e4` — fixing redirect page blocking bug

---

## Rule Type Inline Editing

### Editable rule type labels

Rule type labels now behave like the existing editable rule value field:
double-clicking the label opens a compact select control directly inside the
rule item. The select is available in both the mini rules list inside Mode
Settings and the complete All Rules page.

The editor opens with the rule's current type shown as the selected state, while
only the other rule type options are selectable. This avoids accidental no-op
updates and fixes the earlier issue where the select always appeared to start on
Block Domain regardless of the actual rule type.

### Rule shape conversion between URL rules and parameter rules

Changing between URL-like rules and Allow Parameter now preserves the most useful
part of the existing rule:

- Allow Parameter `?param=test` changed to Block Domain, Block URL, or Allow URL
  becomes `param`.
- Block Domain, Block URL, or Allow URL with value `test` changed to Allow
  Parameter becomes `?test=any`.

This keeps the conversion predictable when moving back and forth between rule
types, even though Allow Parameter stores a key/value pair while the other rule
types store a single URL value.

### Duplicate protection during type changes

Rule type changes now check for an existing rule with the same final type and
target before saving. If the converted rule would duplicate another rule in the
mode, the edit is rejected with the existing duplicate-rule notification instead
of silently creating overlapping entries.

---

## New-Tab Link Block Fixes

### New-tab links no longer affect the current page

The link-click interceptor in `src/content.ts` now checks whether a click
would open its target in a new tab or window — `target="_blank"`, or a
ctrl/cmd/shift-click — before deciding how to react to a blocked link.

Previously, any blocked link click called `blockPage()` on the current tab
regardless of whether the link was meant to open elsewhere, replacing the
current page with the blocked page. Since a link's `href` can point to an
intermediate redirect that resolves under a root domain blocked by an active
rule, this could clobber an already-allowed page even though neither the page
the user was on nor the link's eventual destination were meant to be blocked.

New-tab clicks that resolve to a blocked URL are now stopped from opening at
all, and the block is still recorded in the session's block count, but the
current tab is left untouched — consistent with how blocked `window.open()`
calls were already handled.

### Blocking decisions now re-verify against the live URL before acting

This was the deeper cause of the current-tab getting blocked. Blocking
decisions are async — the content script asks the background script "should
this URL be blocked?" and waits for a reply. Many sites, YouTube included,
rewrite the tab's address bar through `history.pushState`/`replaceState` for
internal click tracking, briefly pointing it at a "redirect" URL that matches
a block rule, before immediately replacing it again with the real (allowed)
destination — without ever loading a new page. If the background's answer
for that transient URL came back after the address bar had already moved on,
the extension would block a page the tab never actually stayed on.

`checkAndBlock()` now re-reads `window.location.href` right after the
background responds. If the tab has already moved to a different URL in the
meantime, the stale answer is discarded and the check is re-run against
wherever the tab actually is now (bounded to a few retries so a
pathologically URL-churning page can't loop forever — anything left
unresolved is still caught by the existing poll/observer fallbacks). Only
once the checked URL and the live URL agree does a block actually happen.

This fix is generic to any site using the History API for this kind of
transient "redirect" URL, not specific to YouTube. Genuine server-side HTTP
redirects were already unaffected by this whole class of bug, since Chrome
doesn't create a document or run content scripts for a plain 3xx response —
only the page a tab actually lands on and renders ever triggers a block
check.

The debounced URL-change check (`debouncedCheck()`, used by the
`pushState`/`replaceState` overrides and the `popstate`/`hashchange`/
mutation-observer/poll listeners) was simplified to always read
`window.location.href` at the moment its timer fires instead of trusting a
URL captured when it was scheduled, for the same reason.

---

## Technical Notes

### Rule Type Inline Editing

- Added `editRuleTypeInline()` in `src/popup.ts` to render the inline select,
  disable dragging while editing on the All Rules page, save on change, and
  restore the display state after save or cancel.
- Added shared conversion helpers for rule type updates:
  `convertRuleType()`, `getParamPartsFromRule()`, and
  `rulesHaveSameTarget()`.
- Wired the rule type double-click handler into both `renderRulesList()` and
  `renderAllRulesList()`.
- Rebuilt `dist/popup.js` with `npm run build`.
- Verified `npm run build` passes. `git diff --check` only reports the
  repository's existing CRLF normalization warnings.

### New-Tab Link Block Fixes

- Added an `opensInNewTab` check (`target="_blank"` attribute plus
  ctrl/meta/shift modifier keys) to the click handler in `src/content.ts`.
- When a new-tab click resolves to a blocked URL, the extension now sends a
  `reportBlock` message directly instead of calling `blockPage()`, so the
  session block counter still increments without navigating the current tab.
- `checkAndBlock(url, attempt)` in `src/content.ts` now compares
  `window.location.href` against the URL it just checked after the
  `checkBlock` response returns, and recurses onto the live URL (max 5
  attempts) instead of blocking on stale data.
- `debouncedCheck()` no longer takes a URL parameter — it always reads
  `window.location.href` when its timer fires; all call sites (`pushState`/
  `replaceState` overrides, `popstate`, `hashchange`, `producer-urlchange`,
  the mutation observer, and the polling fallback) updated accordingly.
- Rebuilt `dist/content.js` with `npm run build`; `npx tsc --noEmit` passes
  with no new errors.
