# Brighton Escape Weekend Gig Collation

**Goal:** Collate every gig in Brighton **Fri 15 → Sun 17 May 2026** (the "Great Escape weekend" + preceding Fri), excluding events that are part of the official Great Escape festival programme, into a single Google Sheet sorted by date → venue.

**Owner:** Pro plan — cost-conscious.

---

## Filter rule

EXCLUDE an event only if:
- Event name explicitly contains "The Great Escape" / "TGE Festival", OR
- Primary link is `greatescapefestival.com`.

INCLUDE everything else, including:
- Unofficial parties at official TGE venues (e.g. Hope & Ruin runs official TGE programmes AND "No Friends in the Industry" + "WIMP" — keep the unofficial ones).
- Non-Escape gigs (Peaches @ Dome, John 5, Barrington Levy, Brighton Fringe theatre, etc).

---

## Sources

Primary lists:
- **Brighton Music Blog** unofficial gigs roundup — [brightonmusicblog.co.uk/2026/05/05/unofficial-escape-gigs-2026](https://brightonmusicblog.co.uk/2026/05/05/unofficial-escape-gigs-2026/)
- **Rival Cults** Brighton gigs page — [rivalcults.com/gigs](https://www.rivalcults.com/gigs)

Enrichment sources discovered along the way:
- `hope.pub` — full No Friends in the Industry lineups (both nights, with set times)
- `antifolk.com` — Great Peliscape full lineup with set times
- `thefolklorerooms.co.uk/listings` — Folklore Rooms multi-event coverage
- `alphabetbrighton.com` — Joy RSVP + Offie Mag Social
- `songkick.com` — Pipeline venue page yielded Fri + Sat lineups
- `clashfinder.com/l/tge26` — Bootlegger Alt Escape (new venue!), Slackscape times, Shovel times. Mostly points elsewhere though.
- `meltingvinyl.co.uk/blog/the-great-escape` — Back in the Woods, Gooreat Peliscape, Agenda Collective partials
- `rsvp.joyconcerts.com` — Joy RSVP details
- `brightonandhovenews.org` — Brighton Rock'n'Roll Circus structure

---

## Plan (5 phases)

Plan file: `C:\Users\piers\.claude\plans\i-want-to-collate-agile-flask.md` (approved).

| # | Phase | Status |
|---|-------|--------|
| 1 | Master list from BMB + RivalCults summary pages | ✅ done |
| 2 | Haiku batch subagents for non-IG links (4 batches) + IG links (5 batches) | ✅ done |
| 3 | Sonnet retry for the ~9 venue URLs Haiku couldn't crack (dice.fm, AXS, FB) | ✅ done |
| 3b | Sonnet 3rd pass — chase IG-only lineups via Skiddle / Songkick / venue sites | ✅ done |
| 3c | Playwright headed-mode IG scrape (manual login) for remaining IG-only events | ✅ done |
| 4 | Merge all data, build CSV, upload as Google Sheet | ✅ done |
| 5 | Hand off Sheet URL | ✅ done |

**Final sheet:**
https://docs.google.com/spreadsheets/d/1ofgP5a-X6DhxSojSe2BbsdnjR1mlvdPtjHwruleCnCY/edit

Initial upload was to the work-account Drive (Workspace → personal ownership transfer is blocked), so the CSV was re-imported manually into the personal account and the work-account copy is obsolete.

---

## Side quest: Clashfinder-style page at `/gigs/alt`

Lives in a SEPARATE local repo: `C:\dev\gigs` (Vite + React, base `/gigs/`). Generator script and source data live here in `C:\dev\escape\`.

**Generator:** `C:\dev\escape\build_alt_page.mjs` — reads `working_data.json` + `ig_parsed.json`, applies the same merge rules as `build_csv.mjs`, parses each event's lineup string into `[{time, name}]` sorted chronologically, and emits a fully self-contained `index.html` (~112 KB; embedded data + CSS + vanilla JS, no fetch).

**Act splitting:** Events where every lineup entry has a time and there are 2+ acts are "exploded" into individual per-act blocks at build time (e.g. Slackscape → 6 blocks, FORM Showcase → 7 blocks). Sub-blocks carry a `parentEvent` field shown as a subtitle in the modal. Source data (`working_data.json`) stays one row per event. Currently 12 events are exploded, yielding 175 total grid blocks (Fri 83 / Sat 79 / Sun 13).

```powershell
cd C:\dev\escape
node build_alt_page.mjs     # writes C:\dev\gigs\public\alt\index.html
```

**Target output:** `C:\dev\gigs\public\alt\index.html`. Vite serves `public/` verbatim under the configured base, so it lands at `/gigs/alt/index.html` in dev and `/gigs/alt/` after build.

**Vite middleware** in `C:\dev\gigs\vite.config.js`: I added a tiny `serveStaticIndex` plugin that maps bare directory URLs like `/gigs/alt` and `/gigs/alt/` to `public/alt/index.html` in dev (production static hosts do this natively, so the build doesn't need it).

### Page features

- **Day tabs** Fri 15 / Sat 16 / Sun 17 (Fri default).
- **Clashfinder grid:** venues as columns, hourly time gutter on left, hourly gridlines via repeating-linear-gradient.
- **Time math:** times 00:00–07:59 treated as next day (+24 h) so late-night sets wrap correctly. Grid bounds computed per day from earliest start to latest end, rounded to whole hours.
- **Untimed events** stack at the top of their venue column with a dashed border + "no time announced" italic.
- **Overlapping events** in the same venue auto-split into side-by-side lanes (interval-scheduling style).
- **Lineup rendering:** each artist is its own row, time on the left (tabular-nums, fixed 36 px), name on right. Sorted by `startMin` (00:00 from `Solid Pleasure (00:00)` correctly comes after `23:00`). Artists without an explicit time render at the bottom in italic muted text.

### Interactions

| Action | What happens | Persistence |
|--------|---|---|
| Click an event block | Opens a modal: title (+ parent event subtitle for act-split blocks), when, venue, tickets, full sorted lineup, notes, "Save" button, "Open <host> ↗" external link button. | — |
| "Save" inside modal | Toggles event in `saved` Set. Block in grid gets `.saved` class (accent border + tint). | `localStorage["alt-saved-v1"]` |
| Click a venue header | Toggles that venue in `savedVenues` Set. Column gets accent-tinted header + subtle accent body wash. | `localStorage["alt-saved-venues-v1"]` |
| "Saved gigs" pill | Filters grid to events in the `saved` Set. Shows count badge. | session-only |
| "Saved venues" pill | Filters grid columns to only highlighted venues. Shows count badge. | session-only |
| "Clear all" | Confirms then wipes both saved Sets (events + venues). | — |
| Escape / click overlay | Closes modal. | — |

### Files in the gigs repo (NOT yet pushed)

- `C:\dev\gigs\public\alt\index.html` — generated artifact. Don't hand-edit; re-run the generator.
- `C:\dev\gigs\vite.config.js` — added `serveStaticIndex` plugin (single addition; main React app routes unchanged).

### Files in this repo for the side quest

- `build_alt_page.mjs` — the generator.
- `screenshot_alt.mjs` — Playwright smoke test (renders Fri/Sat/Sun, opens a modal, saves, exports `alt_*.png`). Run after regenerating to sanity-check.
- `alt_*.png` — last screenshot outputs (gitignore-worthy).

### To resume / export elsewhere

Move both repos. Then:
```powershell
cd C:\dev\gigs
npm install
npm run dev          # serves http://localhost:5173/gigs/alt
```
If the data ever changes (i.e., you re-run `build_csv.mjs`), also re-run `build_alt_page.mjs` to refresh the page.

---

## Files in this directory

| File | Purpose |
|------|---------|
| `working_data.json` | Single source of truth. ~80 events with date/venue/event/lineup/tickets/link/source/notes. Lineup blank means still need IG. |
| `scrape_ig.mjs` | Playwright headed script. ~31 IG URLs. Persistent profile in `.pw-profile/` so login is one-shot. |
| `package.json` | Playwright dep. Installed. |
| `ig_results.json` | Output of `scrape_ig.mjs` (created when you run it). Keyed by event ID (I1, I2, etc). |
| `.pw-profile/` | Persistent Chromium profile so IG login survives restarts. |
| `CLAUDE.md` | This file. |

---

## Data notes

- `working_data.json` — 83 source events (one row per event/showcase, not per act). Single source of truth.
- `ig_parsed.json` — IG caption scrape output; merged in at build time by `build_alt_page.mjs`.
- Known data fix: FORM Showcase (F-FR-FORM) was erroneously stored as 01:30–07:00 (Clashfinder used 12-hr times); corrected to 13:00–20:00 with acts at 13:30–19:30 per the official poster.
- The Google Sheet reflects the pre-act-split data (83 rows). The alt page grid has 175 blocks after splitting.

---

## Open decisions

None — all phases complete. Alt page is live locally; push to gigs repo when ready.
