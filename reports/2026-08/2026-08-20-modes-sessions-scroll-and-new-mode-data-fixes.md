# Development Report — 2026-08-20 — No YouTube Suggestions Feature, Active-Item Auto-Scroll & New-Mode Data Preservation

## Summary

One new per-mode feature and two fixes made today, the fixes both aimed at
reducing friction when reopening pages inside the popup:

1. Modes can now hide YouTube's algorithmic video suggestions — the
   recommended videos beside the player and the ones layered over it — so a
   focus session keeps the user on the video they actually opened.
2. The Modes list and Session History list now automatically scroll to keep
   the currently active mode/session visible when the page is opened,
   instead of always starting from the top and potentially hiding it below
   the fold.
3. Creating a new mode no longer loses the name (or any other in-progress
   field) when the user navigates to that mode's other pages — such as the
   full Rules list — before saving it.

## Commits

- `c965314` — adding no youtube suggestions mode feature
- `ab447e9` — adding small visual fixes to Modes/Sessions pages

---

## No YouTube Suggestions Mode Feature

### Recommended videos hidden while focus mode is active

Modes now offer a second optional feature alongside Grayscale on their
Features page: **No YouTube Suggestions**. When it is enabled on the active
mode and focus mode is running, YouTube's algorithmic suggestions are hidden
so only the video the user deliberately opened stays on screen — the
recommended-videos column to the right of the player (and the same list where
it stacks below the video on narrow layouts), plus the suggestions layered
over the player itself when a video is paused or ends.

The playlist queue and live chat share that sidebar and are deliberately left
visible, since they belong to the video being watched rather than to the
algorithm. The feature applies only on YouTube; every other site is untouched.
Like Grayscale, it is stored per mode — so one mode can strip suggestions
while another leaves YouTube as it is — and it follows focus mode on and off,
applying to already-open tabs instantly without a reload.

### Mode feature delivery generalized beyond a single feature

The popup previously pushed one grayscale flag out to every tab. That path now
carries the whole set of the active mode's features in a single message, each
resolved as "focus mode is active AND the active mode enables it". Tabs apply
features from that message, from their initial storage read, and from the
storage-change listener, so a feature switches on or off the moment it is
toggled — whether the change comes from the mode's Features page, from
starting or stopping focus, or from switching to another mode.

---

## Active-Item Auto-Scroll

### Modes list and Session History open scrolled to the active item

Previously, opening the Modes tab or the Session History page always reset
the scroll position to the top of the list. If the active mode wasn't among
the first three modes shown, or the active session wasn't among the last
four sessions shown, the user had to manually scroll down every time just to
see what was currently active.

Both lists now scroll themselves, on open, just far enough to bring the
active item fully into view at the bottom of the visible area — but only
when it wouldn't already be visible without scrolling. A mode or session
that's already among the first items shown is left exactly as before, with
no unnecessary scroll jump.

---

## New-Mode Data Preservation

### Mode data no longer erased by navigating within the new-mode page

While creating a new mode, clicking the "Rules" section title to open that
mode's full Rules page previously wiped the name (and any other in-progress
field) already typed into the new mode form — forcing the user to retype it
after coming back. Going to the mode's Features page didn't have this
problem, so the two pages behaved inconsistently.

The cause was that the edit view unconditionally cleared its input fields
every time it was shown — including when it was simply being redisplayed
after returning from a sub-page of the same in-progress mode, not just when
starting a brand-new create/edit session.

Inputs are now only cleared at the two points that actually start a fresh
session — creating a new mode or opening an existing one for editing.
Moving between a new mode's own pages (Features, Rules, All Rules, etc.) now
keeps everything the user has entered. Data is still cleared as expected
when the user actually leaves the new-mode flow: clicking Cancel, going back
to the modes list, or switching to a different tab.

---

## Technical Notes

- `src/content.ts` — new `toggleYoutubeRecommendations()` hides `#related`,
  `ytd-watch-next-secondary-results-renderer`, `.ytp-endscreen-content`,
  `.ytp-ce-element`, `.ytp-pause-overlay` and `.ytp-suggestion-set` behind an
  `isYoutube()` host check; style injection factored out of
  `toggleGrayscaleFilter()` into shared `injectStyle()` / `removeStyle()`
  helpers; the `applyModeFeatures` message replaces `toggleGrayscale` and
  carries every feature flag, with the initial storage read and the
  `storage.onChanged` listener driving both features.
- `src/popup.ts` — `broadcastGrayscaleState()` renamed to
  `broadcastModeFeatures()`, dropping its redundant `enabled` argument and
  deriving each flag from `isActive` plus the active mode's settings;
  `modeYoutubeRecommendationsToggleView` wired through
  `loadModeSettingsToView()` and `saveModeSettingsFromView()`;
  `hideYoutubeRecommendationsEnabled` persisted by `saveState()` for content
  script initialization and defaulted in `startCreatingRuleSet()` and
  `loadModeSettings()`.
- `src/types.d.ts` — `ModeSettings.hideYoutubeRecommendationsEnabled`, plus
  `grayscaleEnabled` / `hideYoutubeRecommendationsEnabled` on
  `RuntimeMessage` for the `applyModeFeatures` payload.
- `popup.html` — second feature card on the Features page with the
  `modeYoutubeRecommendationsToggleView` toggle.
- `src/popup.ts` — `scrollActiveItemIntoView()` computes the minimal scroll
  offset needed to reveal a list item at the bottom of its scroll container,
  doing nothing if the item is already visible; `scrollActiveRuleSetIntoView()`
  and `scrollActiveSessionIntoView()` apply it to the modes list and session
  history list respectively, called from `showRulesMainView()` and
  `showSessionHistoryView()`. `switchTab()` now calls `resetScrollPosition()`
  before the tab-specific `show*View()` methods run, so their active-item
  alignment isn't immediately reset back to the top.
- `clearAllInputs()` moved out of `showRulesEditView()` (which runs on every
  return to that view) and into `startCreatingRuleSet()` and `editRuleSet()`,
  the two entry points that actually begin a new create/edit session.
