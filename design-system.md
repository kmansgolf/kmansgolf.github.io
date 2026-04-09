# kmansgolf Design System
**Repository:** `kmansgolf.github.io`
**Last updated:** 2026-04-09
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
| The Caddie | `/caddie/` | Planned — mental game |
| The Green | `/green/` | In development — putting coach |

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
--n:   #0d2340;   /* Background */
--nm:  #152e50;   /* Card background */
--nc:  #1a3558;   /* Card alt / secondary surface */
--g:   #e8b84b;   /* Gold */
--gr:  #2ecc71;   /* Green */
--w:   #f5f0e8;   /* Primary text */
--d:   #8ba4c0;   /* Muted / secondary text */
--err: #e05c5c;   /* Error / fail — use sparingly */
```

### Light Mode Override

Applied via `[data-theme="light"]` on the root element.

```css
--n:   #f2f2f4;   /* Background */
--nm:  #ffffff;   /* Card background */
--nc:  #ffffff;   /* Card alt */
--g:   #d4a030;   /* Gold (slightly darker for contrast) */
--gr:  #27a85e;   /* Green (slightly darker for contrast) */
--w:   #1a1a2e;   /* Primary text */
--d:   #5a6a7a;   /* Muted text */
--err: #c0392b;   /* Error / fail */
```

### Fixed Elements (never inverted)

These stay dark in both light and dark mode:

```css
/* Header bar */
background: #1c1c1e;

/* Bottom navigation */
background: #1c1c1e;
```

**Why:** Full white inversion causes disappearing text. Headers and nav staying dark preserves readability and visual consistency across modes.

---

## Color Rules — Semantic Usage

These rules are non-negotiable. Color communicates meaning.

| Color | Token | Use for | Never use for |
|-------|-------|---------|---------------|
| Gold | `--g` | Scores, data, numbers, stats, active nav item | Progress, success states, decoration |
| Green | `--gr` | Progress, positive outcomes, active nav indicator, passing status | Score display, data |
| Red | `--err` | Fail states, assessment failures, errors | Decoration, warnings, anything non-critical |
| Muted | `--d` | Secondary text, labels, not-yet-assessed states | Primary content |

**Assessment / status badge states:**
- Pass → Green `--gr`
- Needs Work → Gold `--g`
- Not Yet Assessed → Muted `--d`
- Fail → Red `--err`

---

## Typography

All fonts loaded from Google Fonts with `font-display: swap`.

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Font | Family | Use for |
|------|--------|---------|
| Barlow Condensed | `'Barlow Condensed', sans-serif` | All headings, app names, section titles |
| Barlow | `'Barlow', sans-serif` | Body text, labels, descriptions, buttons |
| DM Mono | `'DM Mono', monospace` | All numbers — scores, distances, stats, dates, percentages |

**Rule:** Any number displayed in the UI uses DM Mono. No exceptions.

---

## Logo & Wordmark

### Inline treatment (used in app headers):
```
kmansgolf · THE [APP NAME]
```
- `kmans` — white/cream (`--w`)
- `golf` — green (`#3ddc84`)
- ` · THE RANGE` etc — white/cream, smaller weight
- Entire wordmark is clickable, links to homepage (`/`)

### Homepage hero:
```
Your Game
Tracked
```
- "Tracked" renders in green (`--gr`)
- No periods

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

### Bottom nav (primary)
- Fixed to bottom of screen
- Background: `#1c1c1e` (always dark)
- Active item indicator: Gold `--g`
- Active nav icon/label: Gold `--g`
- Inactive: Muted `--d`
- 4–5 items max per app

### Header bar
- Fixed to top
- Background: `#1c1c1e` (always dark)
- Contains: wordmark left, theme toggle right
- Height: ~52px

---

## PWA

Every app includes a manifest and is installable.

```json
{
  "name": "kmansgolf · [App Name]",
  "short_name": "[App Name]",
  "start_url": "/[app]/",
  "display": "standalone",
  "background_color": "#0d2340",
  "theme_color": "#0d2340",
  "icons": [...]
}
```

---

## Interaction Patterns

### Swipe-down to refresh
- Enabled on: Home screen, History screens
- Disabled on: Active scoring/input screens (prevents accidental refresh mid-session)

### Pinch zoom
- Enabled on all apps, all screens
- Never disable user scaling

### Unsaved data guards
- `beforeunload` event warns on active sessions with unsaved data
- Logo tap during active session shows confirmation dialog before navigating away

### Animations
- Transitions: 200–300ms ease
- No janky or distracting animations — utility first
- Loading states: simple opacity fade, not spinners

---

## Deployment Structure

```
kmansgolf.github.io/           → The Tee Box (homepage)
kmansgolf.github.io/range/     → The Range
kmansgolf.github.io/bunker/    → The Bunker
kmansgolf.github.io/fairway/   → The Fairway
kmansgolf.github.io/caddie/    → The Caddie (planned)
kmansgolf.github.io/green/     → The Green
```

**GitHub Pages note:** To create a subfolder, type `[folder]/index.html` in the GitHub filename field — GitHub auto-creates the directory. Repo must be named `kmansgolf.github.io` exactly for root-level serving.

---

## Backend & Data

| Layer | Tool | Status |
|-------|------|--------|
| Client storage | `localStorage` | Active — all apps |
| Multi-user backend | Supabase | Planned — parked until real testing data exists |
| Live data scraping | Cloudflare Workers | Planned — The Fairway live tabs |
| Member database | GitHub Actions (weekly scrape) | Planned |
| Gist sync | GitHub Gist | The Bunker only — left as-is until Supabase |

---

## App-Specific Notes

### The Range
- Gate Combine scoring system: G-{line}-{pace} codes
- Two-format putting within Gate Combine
- PIN recovery via 6-character code shown once at account creation
- Reserved username list in place
- Export/import/load test data in Profile screen

### The Fairway
- Live data tabs (Pairings, Leaderboard, Skins, Watch) require Cloudflare Worker
- API calls fail on GitHub Pages without auth headers — do not attempt direct API calls
- Per-tour login planned: Regular Tour ID 55097 (C Flight), Senior Tour ID 17956 (B Flight)

### The Bunker
- Wolf payouts: pairwise settlement — every player settles with every other based on point difference × bet amount
- Gist sync left as-is until Supabase

### The Caddie
- Mental game app — two modes: Range/Practice and On-Course
- Mental scorecard: binary Y/N per shot (Calculate / Create / Execute) per Lardon's Pre-Shot Pyramid
- Credit: *Mental scorecard based on Dr. Michael Lardon's Pre-Shot Pyramid from Mastering Golf's Mental Game*
- Tempo: 3-tone system (takeaway → top → impact), 3:1 ratio locked in, 5 named speed presets on slider
- WELD calculator: Wind / Elevation / Lie / Distance — two modes (Competition / Casual)
- Course strategy: *Based on Scott Fawcett's DECADE system and Mark Broadie's strokes gained research*

### The Green
- Personal putting & short game coach — Sieckmann system
- Private/personal use — not publicly promoted
- Credit: *Practice system based on James Sieckmann's Your Putting Solution and Your Short Game Solution*
- 4 assessment modules matching book exactly
- Journal: 4 sections — Assessments, Technical Plan, Training Plan, Personal Growth
- Training modules: Chapters 3–9, cards fill in progressively
- Modular: Short game book added as separate Train section when ready

---

## Attributions & Credits

| Content | Credit | Where shown |
|---------|--------|-------------|
| Mental scorecard / Pre-Shot Pyramid | Dr. Michael Lardon, *Mastering Golf's Mental Game* | The Caddie — How to Use section |
| Course strategy | Scott Fawcett's DECADE system + Mark Broadie's strokes gained research | The Caddie — Strategy section |
| Putting & short game system | James Sieckmann, *Your Putting Solution* + *Your Short Game Solution* | The Green — footer |

---

## Development Principles

- **Short, direct responses** — no filler, no padding
- **Visual mockups over descriptions** for design decisions
- **Mobile-first** — phone screen shows 6–8 sentences; design for that constraint
- **Output only changed files** — never regenerate everything
- **No monoliths** — always 5-file split
- **Casual player first** — complexity is opt-in, not default
