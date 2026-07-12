# Development Report — 2026-07-12 — Drag-and-Drop Reorder Fixes

## Summary

Three fixes to the drag-and-drop reordering behavior shared by the Modes list,
Session History list, and the rule list on the All Rules page. These lists
were carried over as-is by the TypeScript migration, so this is the first
change to their reordering logic since that conversion — all fixes are made
directly in `src/popup.ts` and compiled through to `dist/popup.js`.

## Commits

- Changes are in the working tree, pending commit at the time of writing.

---

## Changes

### Fixed rename-by-double-click conflicting with drag-and-drop reordering

Double-clicking a mode or session name to rename it, then click-dragging across the inline input to select text, was instead picked up by the list's native drag-and-drop as an attempt to drag the whole item. The list item is now marked non-draggable for the duration of the inline rename and restored once the edit is saved or cancelled, so text selection inside the input no longer triggers a drag. Applied to both the Modes list and the Session History list.

### Allowed dropping items in the gaps between other items when reordering

Dragging a mode, session, or rule to reposition it only accepted a drop directly on top of another item — the small gap between two items showed the browser's "not-allowed" cursor and refused the drop, since that space belongs to the list container, not to any item element. Reordering now also works by dropping into the gap between two items, landing the dragged item exactly between them. Applied to the Modes list, Session History list, and the rule list on the All Rules page.

A follow-up fix removed a residual flicker of the same "not-allowed" cursor that could still appear for an instant right as the drag crossed into a new item or into the gap. The browser decides that initial cursor from the `dragenter` event, separately from `dragover` — since only `dragover` was being prevented, `dragenter` could briefly show the disallowed cursor before the next `dragover` corrected it. Both events are now prevented together everywhere the drop is valid.

---

## Technical Notes

- `_attachListReorderDrop(container, itemSelector, onDrop)` helper attaches `dragover`/`dragenter`/`dragleave`/`drop` on the list container itself via `.ondragover`/etc. property assignment (same anti-accumulation reasoning as `_showConfirmModal`), computing the drop index from cursor position instead of relying on the hovered item. Per-item drag handlers now call `stopPropagation()` so a drop directly on an item isn't double-handled by the container fallback. Accounts for the All Rules list rendering newest-first (a later DOM position can be a lower array index).
- Verified with `npm run build` (strict-mode `tsc`, zero errors) after each change, and confirmed the compiled output in `dist/popup.js` contains the new handlers.
