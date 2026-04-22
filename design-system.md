# kmansgolf Design System
**Repository:** `kmansgolf.github.io`
**Last updated:** 2026-04-22
**Maintained by:** Kevin (kmansgolf)

This is the single source of truth for all visual and structural decisions across the kmansgolf app suite. Every app references this document. When in doubt, check here first.

---

## Suite Overview

| App | Folder | Status |
|-----|--------|--------|
| The Tee Box | `/` (root) | Live — homepage/hub |
| The Range | `/range/` | Live — practice tracker |
| The Bunker | `/bunker/` | Live — side games/money |
| The Fairway | `/fairway/` | Live — tournament tracker |
| The Caddie | `/caddie/` | Live — mental game & strategy |
| The Green | `/green/` | Not started — putting coach |

---

## Architecture — 5-File Modular Split

Every app uses this exact structure. Never collapse back to a monolith.

```
[app]/
├── index.html          Shell + all HTML screens
├── [app]-style.css     All CSS + theme overrides
├── [app]-data.js       Static data arrays and content
├── [app]-engine.js     Analytics, scoring, business logic
└── [app]-app.js        Auth, state, UI, session flow
```

**Rules:**
- Output only the changed file when editing. Never regenerate the full monolith.
- Always update the correct file automatically — do not ask which file to edit.
- CSS lives exclusively in `[app]-style.css`. No inline styles.
- Business logic lives in `[app]-engine.js`. No logic in `index.html`.

---

## Color Tokens

### Dark Mode (Default)

```css
:root {
  --bg:             #000000;
  --surface:        #1c1c1e;
  --surface-raised: #2c2c2e;
  --surface-input:  #1a1a1c;

  --text:           #ffffff;
  --text-secondary: #ffffff;
  --text-muted:     #c0c0c0;

  --gold:           #e8b84b;
  --gold-dim:       rgba(232,184,75,0.15);
  --green:          #3ddc84;
  --green-dim:      rgba(61,220,132,0.12);
  --red:            #e05c5c;
  --red-dim:        rgba(224,92,92,0.12);

  --border:         rgba(255,255,255,0.09);
  --border-strong:  rgba(255,255,255,0.18);

  --font-display: 'Barlow Condensed', sans-serif;
  --font-body:    'Barlow', sans-serif;
  --font-mono:    'DM Mono', monospace;

  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;

  --header-bg: #1c1c1e;
  --header-h:  56px;
}
```

### Light Mode Override

Applied via `[data-theme="light"]` on the root element.

```css
[data-theme="light"] {
  --bg:             #dcdcdf;
  --surface:        #ffffff;
  --surface-raised: #e4e4e8;
  --surface-input:  #ebebef;

  --text:           #000000;
  --text-secondary: #000000;
  --text-muted:     #000000;

  --gold:           #8a6200;
  --gold-dim:       rgba(138,98,0,0.12);
  --green:          #145e32;
  --green-dim:      rgba(20,94,50,0.10);
  --red:            #9b1c1c;
  --red-dim:        rgba(155,28,28,0.10);

  --border:         rgba(0,0,0,0.22);
  --border-strong:  rgba(0,0,0,0.40);
}
```

### Fixed Elements — Never Use Tokens Here

The header and tab strip are **always dark in both modes**. All colors inside them must be hardcoded — never use CSS tokens that invert with the theme.

```css
/* Header bar */
.app-header {
  background: #1c1c1e !important;
  border-bottom: 0.5px solid rgba(255,255,255,0.08);
}

/* Logo — "kmans" always white, "golf" always bright green */
.header-logo-text        { color: #ffffff; }
.header-logo-text span   { color: #3ddc84; }  /* NEVER var(--green) */

/* Center app name label */
.header-center { color: rgba(255,255,255,0.5); }  /* NEVER var(--text-muted) */

/* Icon buttons (theme toggle, help, etc.) */
.icon-btn {
  color: #ffffff;
  border: 0.5px solid rgba(255,255,255,0.3);
}

/* Tab strip */
.tab-strip {
  background: #1c1c1e !important;
  border-bottom: 0.5px solid rgba(255,255,255,0.08);
}

/* Tab buttons */
.tab-btn         { color: rgba(255,255,255,0.5); }          /* NEVER var(--text-muted) */
.tab-btn.active  { color: #3ddc84; border-bottom-color: #3ddc84; }  /* NEVER var(--green) */
```

**Why:** CSS tokens invert in light mode. Using `var(--green)` in a tab turns it dark forest green (`#145e32`). Using `var(--text-muted)` turns labels black. Hardcoding is the only reliable way to keep the header and tabs visually identical across themes.

---

## Color Rules — Semantic Usage

These rules are non-negotiable. Color communicates meaning.

| Color | Token | Use for | Never use for |
|-------|-------|---------|---------------|
| Gold | `--gold` | Scores, data, numbers, stats | Progress, success, decoration |
| Green | `--green` | Progress, actions, active states, passing status | Score display, data |
| Red | `--red` | Fail states, errors | Decoration, warnings, non-critical states |
| Muted | `--text-muted` | Secondary text, labels — **content area only** | Anything in the header or tab strip |

**Assessment / status badge states:**
- Pass → `--green`
- Needs Work → `--gold`
- Not Yet Assessed → `--text-muted`
- Fail → `--red`

---

## Typography

All fonts loaded from Google Fonts with `font-display: swap`.

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Barlow Condensed | 32px | 800 |
| Accordion header | Barlow Condensed | 19px | 700 |
| Player name | Barlow | 17px | 600 |
| Body text | Barlow | 16px | 400 |
| Numbers/data | DM Mono | 15px | 400 |
| Section label | Barlow Condensed | 13px | 700, green, uppercase |
| Metadata label | DM Mono | 11px | 400, muted, uppercase |

**Rules:**
- Any number displayed in the UI uses DM Mono. No exceptions.
- Hierarchy via size and letter-spacing only — not color (in content areas).
- All text white in dark mode, black in light mode — except header/tabs which are always white.

---

## Landscape Orientation

Uses `[data-size="landscape"]` attribute set by JS — not a media query.

- All font sizes ~20–25% larger
- Single column layout (never two-column split)
- Header shrinks to 44px (`--header-h: 44px`)

---

## Logo & Wordmark

### Inline treatment (app headers):
```
kmansgolf · THE [APP NAME]
```
- `kmans` — hardcoded `#ffffff`
- `golf` — hardcoded `#3ddc84`
- ` · THE FAIRWAY` etc — `rgba(255,255,255,0.5)`, smaller, DM Mono

### Homepage hero:
```
Your Game
Tracked
```
- "Tracked" renders in `--green`

### SVG assets (stored in each app folder):
- `kmansgolf-wordmark.svg` — horizontal wordmark
- `kmansgolf-icon.svg` — square app icon for PWA manifest

---

## Theme Sync

All apps share a single localStorage key for theme state.

```javascript
// Key
'range_theme'

// Values
'dark'   // default
'light'

// Read
const theme = localStorage.getItem('range_theme') || 'dark';
document.documentElement.setAttribute('data-theme', theme);

// Write (on toggle)
localStorage.setItem('range_theme', newTheme);
document.documentElement.setAttribute('data-theme', newTheme);
```

Toggling theme in any app immediately syncs all other apps on next load.

---

## Navigation

### Header bar
- Fixed to top
- Background: `#1c1c1e !important` (always dark — never inverts)
- All text/colors inside hardcoded (see Fixed Elements above)
- Height: `--header-h` (56px portrait, 44px landscape)

### Tab strip
- Immediately below header, sticky
- Background: `#1c1c1e !important` (always dark — never inverts)
- All tab colors hardcoded (see Fixed Elements above)

### Bottom nav (where used)
- Fixed to bottom of screen
- Background: `#1c1c1e` (always dark)
- Active item: `--gold`
- Inactive: `--text-muted`

---

## PWA

Every app includes a manifest and is installable.

```json
{
  "name": "kmansgolf · [App Name]",
  "short_name": "[App Name]",
  "start_url": "/[app]/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#1c1c1e",
  "icons": [...]
}
```

---

## Interaction Patterns

### Pinch zoom
- Enabled on all apps, all screens
- Never disable user scaling

### Unsaved data guards
- `beforeunload` event warns on active sessions with unsaved data
- Logo tap during active session shows confirmation dialog before navigating away

### Animations
- Transitions: 150–200ms ease
- No janky or distracting animations — utility first
- Loading states: simple opacity fade, not spinners

---

## Deployment Structure

```
kmansgolf.github.io/           → The Tee Box (homepage)
kmansgolf.github.io/range/     → The Range
kmansgolf.github.io/bunker/    → The Bunker
kmansgolf.github.io/fairway/   → The Fairway
kmansgolf.github.io/caddie/    → The Caddie
kmansgolf.github.io/green/     → The Green (not started)
```

**GitHub Pages note:** To create a subfolder, type `[folder]/index.html` in the GitHub filename field — GitHub auto-creates the directory. Repo must be named `kmansgolf.github.io` exactly for root-level serving.

---

## Backend & Data

| Layer | Tool | Status |
|-------|------|--------|
| Client storage | `localStorage` | Active — all apps |
| Live data proxy | Cloudflare Worker (`kmansgolf.kemiman74.workers.dev`) | Active — The Fairway |
| Multi-user backend | Supabase | Planned — parked until real testing data exists |
| Member database | GitHub Actions (weekly scrape) | Planned |
| Gist sync | GitHub Gist | The Bunker only — left as-is until Supabase |

**Worker note:** Changes to `cloudflare-worker.js` require manual deploy via Cloudflare dashboard or `wrangler deploy`. GitHub push alone does NOT update the Worker.

---

## App-Specific Notes

### The Range
- Gate Combine scoring: G-{line}-{pace} codes (e.g. G-C-Z = 3pts)
- PIN recovery via 6-character code shown once at account creation
- Reserved username list in place
- Export/import/load test data in Profile screen
- Supabase migration parked until real testing data exists

### The Fairway
- Live data via Cloudflare Worker — do not attempt direct API calls from GitHub Pages
- Regular Tour domain: `amateurgolftour.net` | Senior Tour domain: `senioramateurgolftour.net`
- Pairings grouping key: `startHole|group|teeTime` (composite — "group" alone is unreliable)
- `/standings` Worker route: briefing written, not yet coded

### The Bunker
- Wolf payouts: pairwise settlement — every player vs. every other by point difference × bet
- 16 Columbus-area courses with verified hole-by-hole data
- Modular file split pending

### The Caddie
- WELD calculator: crosswind formula `Drift (ft) = windSpd × distance ÷ 100`
- Mental scorecard: binary C/C/E per shot per Lardon's Pre-Shot Pyramid
- Round Awareness bar: collapsed by default, 5 tracked mistake types
- Credit: *Mental scorecard — Dr. Michael Lardon. Strategy — Scott Fawcett's DECADE system + Mark Broadie's strokes gained research.*

### The Green
- Personal putting & short game coach — Sieckmann system
- Private/personal use — not publicly promoted
- Credit: *James Sieckmann, Your Putting Solution + Your Short Game Solution*
- Not yet started

---

## Attributions & Credits

| Content | Credit | Where shown |
|---------|--------|-------------|
| Mental scorecard / Pre-Shot Pyramid | Dr. Michael Lardon, *Mastering Golf's Mental Game* | The Caddie |
| Course strategy | Scott Fawcett's DECADE system + Mark Broadie's strokes gained research | The Caddie |
| Putting & short game system | James Sieckmann, *Your Putting Solution* + *Your Short Game Solution* | The Green |

---

## Copyright

All files get a copyright header:
- JS: `// © 2026 Kevin Mansfield. All rights reserved.`
- CSS: `/* © 2026 Kevin Mansfield. All rights reserved. */`
- HTML: `<!-- © 2026 Kevin Mansfield. All rights reserved. -->`

---

## Development Principles

- **Framework before code** — data model and design locked before any implementation
- **Modular architecture is non-negotiable** — never collapse files; always edit the correct file
- **Short, direct responses** — no filler
- **Visual mockups over descriptions** for design decisions
- **Mobile-first** — design for outdoor phone use
- **Output only changed files** — never regenerate everything
- **Hardcode header/tab colors** — never use tokens that invert with theme
