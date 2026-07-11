# Producer — Focus Extension 🎯

A Chrome extension (Manifest V3) that boosts productivity by blocking
distracting websites and specific URLs during focus sessions. Organize your
block rules into reusable **modes**, run timed **focus sessions**, keep some
sites blocked **permanently**, and customize the block page to your taste.

---

## Key Features

- **Modes** — group block/allow rules into named rule sets and switch between
  them; one mode is active at a time.
- **Focus sessions** — toggle focus on/off; each session tracks focused time,
  break time, and how many blocks it triggered.
- **Flexible rules** — block whole domains, specific URLs, allow exceptions, or
  allow a blocked page only when a query parameter matches.
- **Permanent rules** — mark a rule as always-on so it blocks even when focus is
  off, independent of any session.
- **Block-all wildcard** — block every site with a single `*` rule and use
  allow rules to carve out exceptions.
- **Customizable block page** — themes, custom colors, title, message,
  optional motivational quotes, a background image, and toggleable action
  buttons.
- **Per-mode features** — optional behaviors such as **Grayscale** (drains
  color from every page while focus is active).
- **On-the-fly updates** — changing rules instantly reloads or redirects only
  the affected tabs; blocked tabs return to their original page the moment a
  rule is removed.
- **Import / export** — move rule sets between machines with a simple text file.
- **Stats & history** — session history with editable names, plus averages for
  focused time and session length.
- **Privacy-first** — all data is stored locally; nothing about you or the sites
  you visit is sent anywhere (see [PRIVACY.md](PRIVACY.md)).

---

## Installation

Producer is written in TypeScript and compiled to plain JavaScript in `dist/`,
which is committed to the repo — so it loads directly as an unpacked extension
with no install step.

1. Open `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the repository root folder.
4. The Producer icon appears in your toolbar — click it to open the popup.

To modify the source, see [Development workflow](#development-workflow).

---

## Core concepts

- **Mode** — a named set of rules (e.g. "Deep Work", "Studying"). You activate
  one mode at a time; only the active mode's rules are enforced during focus.
- **Focus** — when focus is on (the **Start Producing** button), the active
  mode's rules block matching sites. Turning focus off lifts those blocks.
- **Permanent rule** — blocks its target at all times, whether or not focus is
  on and regardless of which mode is active.
- **Session** — created automatically when you start focus; records focused
  time, break time, and block count, and is kept in your history.

---

## How to use

1. Open the popup and go to the **Modes** tab.
2. Click **New Mode**, give it a name, and open it to add rules.
3. Add one or more rules (see [Rule types](#rule-types) below).
4. **Activate** the mode.
5. On the **Home** tab, click **Start Producing** to begin a focus session.

If you try to start focus with no active mode, Producer will prompt you to
create and activate one first.

---

## Rule types

When adding a rule, pick a type from the dropdown:

### Block Domain

Blocks an entire site and all its subdomains.

- Example: `youtube.com` blocks `youtube.com`, `www.youtube.com`,
  `m.youtube.com`, and every page on the domain.

### Block Specific URL

Blocks only an exact URL or path, leaving the rest of the domain reachable.

- Example: `youtube.com/feed/trending` blocks just that page.
- A bare domain here (e.g. `youtube.com`) blocks only the site's home page.

### Allow Specific URL

An explicit allowlist that takes precedence over block rules. Use it to permit a
page on an otherwise-blocked domain.

- Example: block `instagram.com` but allow `instagram.com/direct/inbox`.

### Allow Parameter

Allows a blocked URL only when a specific query parameter is present (and,
optionally, matches a specific value).

- Example: block `youtube.com/watch` (all videos) but add an Allow Parameter
  rule with key `list` and value `WL` to permit only your Watch Later playlist.
- Leave the value empty to allow the parameter with any value.

### Block All Websites (wildcard)

Add a Block Domain or Block Specific URL rule with the value `*` to block
everything, then use **Allow Specific URL** rules to whitelist the few sites you
need.

---

## The block page

When a blocked site is opened, Producer replaces it with a focus page showing the
blocked URL, a block counter, an optional motivational quote, and your current
session stats. Its action buttons:

- **Allow Once** — bypass this block a single time without changing any rule.
- **Add Exception** — add an Allow rule for this URL to the active mode.
- **Undo Permanent Rule** — shown when the page is blocked by a permanent rule;
  removes that permanent rule.
- **Go Back** / **Close Tab** — leave the page.

When a site is blocked permanently with no active focus session, the
session-stats area is hidden.

---

## Personalization

On the **Personalize** tab you can tailor the block page:

- **Theme** — blue, red, orange, purple, teal, or dark.
- **Primary & accent colors** — fine-tune the palette.
- **Title & message** — set your own block-page copy.
- **Motivational quotes** — show or hide the quote line.
- **Background image** — add one by file upload (up to 2 MB) or by URL.
- **Action buttons** — show or hide the Allow Once / Add Exception buttons.

A live preview reflects changes as you make them.

---

## Features (per mode)

Open a mode's **Features** page to enable optional behaviors for that mode:

- **Grayscale** — while focus is active and this mode is on, every page is
  rendered in grayscale to reduce its pull.

More features are planned.

---

## Import / export

From the rules view you can **Export** the active mode's rules to a text file and
**Import** them back later or on another machine. The format is one rule per
line, `type value`:

```
# comments start with '#'
domain youtube.com
url reddit.com/r/popular
allow youtube.com/playlist?list=WL
allowParam list=WL
```

Imported lines are validated — unknown types and malformed URLs/parameters are
skipped, and the importer reports how many were ignored.

---

## Stats

The **Stats** tab shows your session history (with inline-editable, reorderable
names) plus overall figures such as total sessions, average focused time, and
average session length.

---

## Privacy

All rules, sessions, and settings are stored locally via `chrome.storage.local`.
Producer has no account system, no analytics, and no developer backend. The only
outbound network request fetches a public motivational quote for the block page
and contains no personal data. Full details in [PRIVACY.md](PRIVACY.md).

---

## Project structure

```
producer-extension/
├── manifest.json     # Extension configuration (Manifest V3)
├── popup.html        # Popup UI markup
├── popup.css         # Popup styles
├── blocked.html      # Standalone block page
├── src/              # TypeScript sources
│   ├── popup.ts      # Popup logic and all user-initiated state changes
│   ├── background.ts # Service worker — blocking decisions & session/timer state
│   ├── content.ts    # Content script — enforces blocking on every page
│   ├── blocked.ts    # Block page logic
│   └── types.d.ts    # Shared data-model types (Rule, Mode, Session, messages)
├── dist/             # Compiled JavaScript (what the manifest loads)
├── tsconfig.json     # TypeScript compiler configuration
├── package.json      # Dev dependencies and build scripts
├── icon.png          # Extension/toolbar icon
├── producer-logo.png # Logo used in the popup
├── PRIVACY.md        # Privacy policy
├── readme.md
└── reports/          # Dated development reports
```

## Technical details

- **Manifest version:** 3
- **Permissions:** `storage`, `tabs`
- **Host access:** `<all_urls>` (the content script must read each page's URL to
  decide whether to block it; URLs are evaluated locally and never transmitted)
- **Blocking method:** content-script injection that redirects blocked pages to
  an in-extension block page
- **Storage:** `chrome.storage.local` for all persistence

### Architecture

Three runtime contexts communicate only via Chrome runtime messages and
`chrome.storage.local`:

- **`background.ts` (`ProducerBackground`, service worker)** — the authority on
  blocking decisions and session state. `shouldBlockUrl()` is the single source
  of truth: it checks permanent rules first (always active), then the active
  mode's rules when focus is on. It also tracks the session timer, reloads
  affected tabs when rules change, and discards blocked tabs to save memory.
- **`content.ts` (`ProducerContentScript`)** — injected at `document_start` on
  every page. It checks the URL, redirects to the block page when blocked, and
  intercepts clicks, form submits, history navigation, and `window.open` to
  catch single-page-app navigations.
- **`blocked.html` + `blocked.ts` (`ProducerBlockedPage`)** — the standalone
  block page. It reads its context from URL parameters and storage, polls to
  auto-redirect when a rule is removed, and applies your theme and text.

The **popup (`ProducerPopup`)** owns the UI and writes all state through a
central `saveState()` path, which persists to storage and notifies the
background worker.

---

## Development workflow

The source lives in `src/` as TypeScript and compiles to `dist/`, which is what
the extension actually runs.

```bash
npm install     # once, to get the TypeScript compiler
npm run build   # compile src/ -> dist/
npm run watch   # recompile automatically on save
```

After a rebuild:

- **`src/popup.ts` / `popup.html` / `popup.css`** — take effect the next time
  you open the popup.
- **`src/background.ts`** — click **Reload** on the extension card in
  `chrome://extensions/`.
- **`src/content.ts`** — reload the affected tabs.

---

## Troubleshooting

**Sites aren't being blocked**

- Make sure a mode is **active** and focus is **on** (Start Producing).
- Confirm the rule is in the active mode and the value is correct.
- Refresh the page after adding a rule.

**Can't reach a site you need**

- Add an **Allow Specific URL** or **Allow Parameter** exception, or turn focus
  off temporarily.
- Check for a conflicting **permanent** rule (it blocks even with focus off).

**A change didn't apply**

- Run `npm run build` (or keep `npm run watch` running) so `dist/` is up to
  date, then reload the extension from `chrome://extensions/` after editing
  `src/background.ts`, and reload open tabs for `src/content.ts` changes.

---

## License

Open source — feel free to use and modify as needed.
