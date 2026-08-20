# Development Report — 2026-08-02 — Rule Type Inline Editing, New-Tab Link Block Fixes & Permanent Rule Recognition

## Summary

Three separate updates made today:

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
3. Fixed a bug where adding a rule that was already marked permanent in a
   different mode didn't get recognized as permanent in the new mode — the
   block itself still worked (the original mode's permanent rule kept
   enforcing it), but the new mode's copy showed as a regular, non-permanent
   rule instead of reflecting its already-permanent status.

## Commits

- `d260a41` — adding rule type update feature
- `b6942da` — fixing redirect page blocking bug

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

## Permanent Rule Recognition Fix

### Rules now recognize their permanent status across modes

Adding a rule that's identical (same type and URL/domain) to a rule already
marked permanent in another mode now automatically marks the new one
permanent too — including the "make permanent" button showing as active.
Previously, permanent status only synced to rules that already existed at
the moment the original rule was toggled permanent, so a matching rule added
to a different mode afterward stayed unmarked even though the same URL was
already being enforced as a permanent block. The same inheritance now also
applies when editing an existing rule's URL inline so that it matches an
already-permanent rule elsewhere.

### Rule comparison consolidated around one helper

The places that compared two rules for equality by manually checking their
type/URL (or param key/value) fields — the permanent-toggle sync-across-modes
logic and the allow-parameter duplicate check — now reuse the existing
`rulesHaveSameTarget()` helper (previously only used by rule-type
conversion) instead of re-implementing the same comparison inline.

---

## Technical Notes

- `src/popup.ts` — `editRuleTypeInline()` for the inline rule-type select,
  wired into both `renderRulesList()` and `renderAllRulesList()`;
  `convertRuleType()` / `getParamPartsFromRule()` for URL-to-param
  conversion; `rulesHaveSameTarget()` shared by duplicate detection, the
  permanent-toggle cross-mode sync, and the new `isRulePermanentElsewhere()`,
  which makes `addRule()` and `editRuleUrlInline()` inherit an existing
  permanent flag automatically
- `src/content.ts` — `opensInNewTab` check before reacting to a blocked
  link click; new-tab blocks now send `reportBlock` directly instead of
  calling `blockPage()`; `checkAndBlock()` re-verifies against
  `window.location.href` after the background responds and retries (max 5)
  on a live-URL mismatch; `debouncedCheck()` always reads the live URL when
  its timer fires instead of a URL captured when it was scheduled
