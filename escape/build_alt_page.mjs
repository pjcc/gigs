// Generates a self-contained Clashfinder-style page at ../public/alt/index.html
// using the merged events from working_data.json + ig_parsed.json.
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const OUT = path.join(HERE, "../public/alt/index.html");

const wd = JSON.parse(fs.readFileSync(path.join(HERE, "working_data.json"), "utf8"));
const ig = JSON.parse(fs.readFileSync(path.join(HERE, "ig_parsed.json"), "utf8"));

const igById = new Map(ig.events.map(e => [e.id, e]));
const igNoLine = new Map(ig.no_lineup_found_via_ig.map(e => [e.id, e]));

const KEEP_EXISTING_LINEUP = new Set([
  "F-HR-NFII","S-HR-NFII","S-HP-GP","S-NTB-SHV",
  "F-FR-EF","F-FR-FORM","S-FR-FST","S-RH-FAKE","S-AB-OFFIE","F-RB-FL",
  "F-DAL-SF","S-DAL-PSY","U-DAL-GAR",
  "F-VLK-SP","S-VLK-EX","F-PAT-H30","S-PAT-SD","S-QT-UJ",
  "F-BR-FF","F-BR-SN","S-BR-LT","U-BR-BB","U-BR-SAL","U-BR-MPH",
  "F-C2-DC","S-C2-PSQ","U-C2-J5","U-CHL-BL","U-HR-WIMP",
  "F-BD-PCH","F-BD-MIT","S-BD-AK","U-BD-SH",
  "S-CoB-JC","U-CoB-JC","U-RH-SS","U-FR-OC",
  "F-FOW-MB","S-FOW-PB","F-BG-ALT","S-BG-ALT","F-AB-SLACK"
]);

const events = wd.events.map(ev => {
  const m = igById.get(ev.id);
  const n = igNoLine.get(ev.id);
  if (m) {
    if (m.lineup && !KEEP_EXISTING_LINEUP.has(ev.id)) ev.lineup = m.lineup;
    if (m.start && !ev.start) ev.start = m.start;
    if (m.end && !ev.end) ev.end = m.end;
    if (m.tickets && !ev.tickets) ev.tickets = m.tickets;
    if (m.notes_extra) ev.notes = (ev.notes ? ev.notes + " · " : "") + m.notes_extra;
  }
  if (n) ev.notes = (ev.notes ? ev.notes + " · " : "") + (n.notes || "Lineup not in IG post.");
  return ev;
});

function parseLineup(raw) {
  if (!raw) return [];
  const entries = raw.split("|").map(s => s.trim()).filter(Boolean).map(s => {
    // Match "Name (HH:MM)" or "Name (HH:MM-HH:MM)" — handles trailing details inside parens too.
    const m = s.match(/^(.+?)\s*\((\d{1,2}[:.]\d{2})(?:\s*[-–—]\s*\d{1,2}[:.]\d{2})?\)\s*$/);
    if (m) {
      const name = m[1].trim();
      const timeStr = m[2].replace(".", ":");
      const [h, mn] = timeStr.split(":").map(Number);
      const startMin = (h < 8 ? h + 24 : h) * 60 + mn;
      return { name, time: timeStr, startMin };
    }
    return { name: s, time: null, startMin: Number.POSITIVE_INFINITY };
  });
  // Sort chronologically; entries without a time stable-sort to the end.
  return entries.sort((a, b) => a.startMin - b.startMin);
}

// If every lineup entry has a time and there are 2+, explode into per-act sub-events.
// Each sub-event's end = next act's start (or parent's end for the last).
function explode(e, parsed) {
  if (parsed.length < 2 || parsed.some(a => !a.time)) return null;
  return parsed.map((act, i) => {
    const next = parsed[i + 1];
    return {
      id: e.id + "-" + i,
      date: e.date, day: e.day, venue: e.venue,
      event: act.name,
      parentEvent: e.event,
      genre: e.genre || "music",
      start: act.time,
      end: next ? next.time : (e.end || ""),
      lineupRaw: "",
      lineup: [],
      tickets: e.tickets || "",
      link: e.link || "",
      notes: e.notes || ""
    };
  });
}

// Trim to fields the page actually uses
const pageEvents = events.flatMap(e => {
  const parsed = parseLineup(e.lineup);
  const sub = explode(e, parsed);
  if (sub) return sub;
  return [{
    id: e.id, date: e.date, day: e.day, venue: e.venue, event: e.event,
    parentEvent: null,
    genre: e.genre || "music",
    start: e.start || "", end: e.end || "",
    lineupRaw: e.lineup || "",
    lineup: parsed,
    tickets: e.tickets || "",
    link: e.link || "", notes: e.notes || ""
  }];
});

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Alt Escape — Brighton 15-17 May 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #1a1a1e;
      --bg-card: #242428;
      --bg-card-hi: #2e2e34;
      --text: #e8e6e3;
      --text-muted: #9a9894;
      --text-faint: #6a6864;
      --accent: #d95738;
      --accent-soft: rgba(217, 87, 56, 0.18);
      --teal: #4ecdc4;
      --border: #35353a;
      --border-light: #2c2c30;
      --gutter-w: 56px;
      --venue-w: 118px;
      --hour-h: 64px;
      --header-h: 38px;
    }

    html, body { background: var(--bg); color: var(--text); font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }
    body { min-height: 100vh; display: flex; flex-direction: column; }
    a { color: var(--teal); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 5;
      background: var(--bg);
      padding: 14px 20px 10px;
      border-bottom: 1px solid var(--border);
    }
    .topbar h1 {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .topbar .sub {
      color: var(--text-muted);
      font-size: 12px;
      margin-top: 2px;
    }
    .controls {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 10px;
      align-items: center;
    }
    .day-tab, .pill, .genre-pill {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .day-tab:hover, .pill:hover, .genre-pill:hover { color: var(--text); border-color: var(--text-muted); }
    .day-tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }
    .pill.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
    .genre-pill[data-genre="music"].active    { background: rgba(78,205,196,0.15); color: #4ecdc4; border-color: #4ecdc4; }
    .genre-pill[data-genre="comedy"].active   { background: rgba(255,199,44,0.15);  color: #ffc72c; border-color: #ffc72c; }
    .genre-pill[data-genre="theatre"].active  { background: rgba(175,122,232,0.15); color: #af7ae8; border-color: #af7ae8; }
    .saved-count { color: var(--accent); font-weight: 600; }
    .spacer { flex: 1; }

    .page-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    #gutter-host {
      flex-shrink: 0;
      width: var(--gutter-w);
      background: var(--bg);
      border-right: 1px solid var(--border-light);
      z-index: 4;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .grid-wrap {
      flex: 1;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    .grid {
      display: flex;
      flex-direction: row;
      min-height: 100%;
    }

    .venue-col {
      border-right: 1px solid var(--border-light);
      position: relative;
      flex-shrink: 0;
      width: var(--venue-w);
    }

    .gutter-header {
      flex-shrink: 0;
      background: var(--bg);
      height: var(--header-h);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      padding: 0 6px;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }

    .gutter-body-clip {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .gutter-body {
      will-change: transform;
    }

    .venue-header {
      position: sticky;
      top: 0;
      z-index: 3;
      background: var(--bg);
      height: var(--header-h);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      padding: 0 6px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border-light);
      color: var(--text);
      line-height: 1.15;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .venue-header:hover { background: var(--bg-card-hi); }
    .venue-col.venue-saved .venue-header {
      background: var(--accent-soft);
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .venue-col.venue-saved .venue-body {
      background-color: rgba(217, 87, 56, 0.04);
    }

    .gutter-body, .venue-body {
      position: relative;
      background-image: repeating-linear-gradient(
        to bottom,
        var(--border-light) 0 1px,
        transparent 1px var(--hour-h)
      );
    }

    .hour-label {
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: var(--text-faint);
      transform: translateY(-50%);
      pointer-events: none;
    }
    .hour-label.major { color: var(--text-muted); font-weight: 500; }

    .event {
      position: absolute;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 8px;
      cursor: pointer;
      overflow: hidden;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .event:hover { background: var(--bg-card-hi); border-color: var(--text-faint); }
    .event.saved {
      background: var(--accent-soft);
      border-color: var(--accent);
      box-shadow: inset 0 0 0 1px var(--accent);
    }
    .event.saved .event-name { color: var(--text); }
    .event-name {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.22;
      color: var(--text);
    }
    .event-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .event-lineup {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.35;
      word-break: break-word;
    }
    .event-lineup-list {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      font-size: 10px;
      line-height: 1.4;
      color: var(--text-muted);
    }
    .event-lineup-list li {
      display: flex;
      gap: 6px;
      padding: 1px 0;
    }
    .lineup-time {
      font-variant-numeric: tabular-nums;
      color: var(--text-faint);
      flex: 0 0 36px;
    }
    .lineup-name {
      flex: 1;
      color: var(--text-muted);
    }
    .lineup-name.untimed {
      color: var(--text-faint);
      font-style: italic;
    }

    .event.untimed {
      border-style: dashed;
      border-color: var(--text-faint);
    }
    .event.untimed .event-time::after {
      content: "no time announced";
      color: var(--text-faint);
      font-style: italic;
    }

    .empty {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 20;
      padding: 20px;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      width: 100%;
      max-width: 460px;
      max-height: 86vh;
      overflow: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      animation: pop 0.15s ease-out;
    }
    @keyframes pop {
      from { transform: scale(0.96); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .modal-head {
      padding: 18px 20px 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .modal-title {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .modal-close {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 6px;
      font-size: 18px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover { background: var(--border); color: var(--text); }
    .modal-body { padding: 14px 20px 6px; }
    .modal-row {
      display: flex;
      gap: 10px;
      padding: 4px 0;
      font-size: 13px;
    }
    .modal-row .label {
      flex: 0 0 70px;
      color: var(--text-faint);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.04em;
      padding-top: 3px;
    }
    .modal-row .value { flex: 1; color: var(--text); }
    .modal-row .value a { color: var(--teal); word-break: break-all; }
    .modal-lineup {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .modal-lineup li {
      display: flex;
      gap: 8px;
      padding: 3px 0;
      font-size: 13px;
      border-bottom: 1px solid var(--border-light);
    }
    .modal-lineup li:last-child { border-bottom: none; }
    .modal-lineup .lt {
      flex: 0 0 52px;
      color: var(--text-faint);
      font-variant-numeric: tabular-nums;
    }
    .modal-lineup .ln { flex: 1; color: var(--text); }
    .modal-lineup .ln.untimed { color: var(--text-muted); font-style: italic; }
    .modal-notes {
      margin-top: 6px;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      padding: 8px 10px;
      background: var(--bg);
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
    .modal-foot {
      padding: 14px 20px 18px;
      display: flex;
      gap: 10px;
      border-top: 1px solid var(--border);
    }
    .modal-foot .btn {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text);
    }
    .modal-foot .btn-fav {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    .modal-foot .btn-fav:hover { background: var(--accent-hover, #e5654a); }
    .modal-foot .btn-fav.is-saved {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent);
    }
    .modal-foot .btn-link {
      background: transparent;
      color: var(--text-muted);
    }
    .modal-foot .btn-link:hover { color: var(--text); border-color: var(--text-muted); }

    .legend {
      padding: 10px 20px;
      font-size: 11px;
      color: var(--text-faint);
      border-top: 1px solid var(--border);
      background: var(--bg);
    }
    .legend a { color: var(--text-muted); }

    @media (max-width: 720px) {
      :root { --venue-w: 92px; --hour-h: 56px; --gutter-w: 48px; }
      .topbar { padding: 10px 12px 8px; }
      .topbar h1 { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>Alt Escape — Brighton 15–17 May 2026</h1>
    <div class="sub">Unofficial gigs around Great Escape weekend. Tap a block to save it.</div>
    <div class="controls">
      <button class="day-tab active" data-day="Fri">Fri 15</button>
      <button class="day-tab" data-day="Sat">Sat 16</button>
      <button class="day-tab" data-day="Sun">Sun 17</button>
      <span class="spacer"></span>
      <button class="genre-pill active" data-genre="music">Music</button>
      <button class="genre-pill active" data-genre="comedy">Comedy</button>
      <button class="genre-pill active" data-genre="theatre">Theatre</button>
      <button class="pill" id="toggle-saved">Saved gigs <span class="saved-count" id="saved-count">0</span></button>
      <button class="pill" id="toggle-saved-venues">Saved venues <span class="saved-count" id="saved-venues-count">0</span></button>
      <button class="pill" id="clear-saved">Clear all</button>
    </div>
  </div>

  <div class="page-body">
    <div id="gutter-host"></div>
    <div class="grid-wrap" id="grid-wrap">
      <div class="grid" id="grid"></div>
    </div>
  </div>

  <div class="legend">
    Data from Brighton Music Blog, Rival Cults, Clashfinder &amp; Instagram captions. Times approximate. <span id="counts"></span>
  </div>

  <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal" id="modal" role="document"></div>
  </div>

  <script>
    const EVENTS = ${JSON.stringify(pageEvents)};
    const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
    const SAVED_KEY = "alt-saved-v1";
    const SAVED_VENUES_KEY = "alt-saved-venues-v1";
    const HOUR_PX = 64;
    const MOBILE_HOUR_PX = 56;
    const DEFAULT_DURATION_MIN = 90;
    const UNTIMED_BLOCK_MIN = 60;

    let saved = new Set();
    let savedVenues = new Set();
    try { saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); } catch {}
    try { savedVenues = new Set(JSON.parse(localStorage.getItem(SAVED_VENUES_KEY) || "[]")); } catch {}
    let currentDay = "Fri";
    let showSavedOnly = false;
    let showSavedVenuesOnly = false;
    let activeGenres = new Set(["music", "comedy", "theatre"]);

    function persistSaved() { localStorage.setItem(SAVED_KEY, JSON.stringify([...saved])); }
    function persistSavedVenues() { localStorage.setItem(SAVED_VENUES_KEY, JSON.stringify([...savedVenues])); }

    function parseMin(s) {
      if (!s) return null;
      const m = String(s).match(/^(\\d{1,2}):(\\d{2})$/);
      if (!m) return null;
      const h = +m[1], mn = +m[2];
      return (h < 8 ? h + 24 : h) * 60 + mn;
    }

    function formatHourLabel(min) {
      const h = Math.floor(min / 60) % 24;
      return String(h).padStart(2, "0") + ":00";
    }

    function assignLanes(events) {
      // events sorted by start. returns array same length with .lane and total .lanes
      const lanes = [];
      const out = [];
      for (const e of events) {
        const s = e._startMin;
        const en = e._endMin;
        let assigned = -1;
        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i] <= s) { lanes[i] = en; assigned = i; break; }
        }
        if (assigned === -1) { lanes.push(en); assigned = lanes.length - 1; }
        out.push({ ...e, lane: assigned });
      }
      return { items: out, total: Math.max(1, lanes.length) };
    }

    function render() {
      const dayEvents = EVENTS.filter(e => e.day === currentDay && activeGenres.has(e.genre));
      const filtered = showSavedOnly ? dayEvents.filter(e => saved.has(e.id)) : dayEvents;

      const grid = document.getElementById("grid");
      grid.innerHTML = "";

      if (filtered.length === 0) {
        grid.style.width = "100%";
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = showSavedOnly ? "Nothing saved for " + currentDay + " yet." : "No events for " + currentDay;
        grid.appendChild(empty);
        updateCount();
        return;
      }

      // Annotate events with start/end minutes
      for (const e of filtered) {
        e._startMin = parseMin(e.start);
        const endMin = parseMin(e.end);
        if (e._startMin !== null) {
          e._endMin = endMin !== null && endMin > e._startMin
            ? endMin
            : e._startMin + DEFAULT_DURATION_MIN;
        } else {
          e._startMin = null;
          e._endMin = null;
        }
      }

      // Compute grid bounds from timed events
      const timed = filtered.filter(e => e._startMin !== null);
      let minMin = null, maxMin = null;
      for (const e of timed) {
        if (minMin === null || e._startMin < minMin) minMin = e._startMin;
        if (maxMin === null || e._endMin > maxMin) maxMin = e._endMin;
      }
      if (minMin === null) { minMin = 12 * 60; maxMin = 23 * 60; }
      const gridStart = Math.floor(minMin / 60) * 60;
      const gridEnd = Math.ceil(maxMin / 60) * 60;
      const totalMin = gridEnd - gridStart;
      const hourPx = window.innerWidth <= 720 ? MOBILE_HOUR_PX : HOUR_PX;
      const pxPerMin = hourPx / 60;

      // Untimed events: stack above the timeline using negative offsets
      const untimedByVenue = new Map();
      for (const e of filtered) {
        if (e._startMin === null) {
          if (!untimedByVenue.has(e.venue)) untimedByVenue.set(e.venue, []);
          untimedByVenue.get(e.venue).push(e);
        }
      }
      const maxUntimedCount = [...untimedByVenue.values()].reduce((m, a) => Math.max(m, a.length), 0);
      const untimedAreaPx = maxUntimedCount * (UNTIMED_BLOCK_MIN + 4);

      const gridBodyHeight = totalMin * pxPerMin + untimedAreaPx + 8;

      // Group timed events by venue
      const venuesMap = new Map();
      for (const e of filtered) {
        if (!venuesMap.has(e.venue)) venuesMap.set(e.venue, []);
        venuesMap.get(e.venue).push(e);
      }
      const allVenues = [...venuesMap.keys()].sort((a, b) => a.localeCompare(b));
      const venues = showSavedVenuesOnly ? allVenues.filter(v => savedVenues.has(v)) : allVenues;

      grid.style.setProperty("--hour-h", hourPx + "px");

      // Gutter column — lives outside grid-wrap so it never scrolls horizontally
      const gutterHost = document.getElementById("gutter-host");
      gutterHost.innerHTML = "";
      const gh = document.createElement("div");
      gh.className = "gutter-header";
      gh.textContent = currentDay + " " + (currentDay === "Fri" ? "15" : currentDay === "Sat" ? "16" : "17");
      gutterHost.appendChild(gh);
      const gbClip = document.createElement("div");
      gbClip.className = "gutter-body-clip";
      const gb = document.createElement("div");
      gb.className = "gutter-body";
      gb.style.height = gridBodyHeight + "px";
      // Hour labels (positioned within timed area only — offset by untimedAreaPx)
      for (let m = gridStart; m <= gridEnd; m += 60) {
        const label = document.createElement("div");
        label.className = "hour-label" + (m % 180 === 0 ? " major" : "");
        const offset = untimedAreaPx + (m - gridStart) * pxPerMin;
        label.style.top = offset + "px";
        label.textContent = formatHourLabel(m);
        gb.appendChild(label);
      }
      gbClip.appendChild(gb);
      gutterHost.appendChild(gbClip);

      // Venue columns
      for (const v of venues) {
        const col = document.createElement("div");
        col.className = "venue-col" + (savedVenues.has(v) ? " venue-saved" : "");
        const hdr = document.createElement("div");
        hdr.className = "venue-header";
        hdr.textContent = v;
        hdr.title = "Click to highlight venue";
        hdr.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (savedVenues.has(v)) savedVenues.delete(v); else savedVenues.add(v);
          persistSavedVenues();
          col.classList.toggle("venue-saved");
          updateCount();
        });
        col.appendChild(hdr);
        const body = document.createElement("div");
        body.className = "venue-body";
        body.style.height = gridBodyHeight + "px";

        const vEvents = venuesMap.get(v).slice().sort((a, b) => (a._startMin ?? 99999) - (b._startMin ?? 99999));
        const vTimed = vEvents.filter(e => e._startMin !== null);
        const vUntimed = vEvents.filter(e => e._startMin === null);

        // Untimed blocks at top
        vUntimed.forEach((e, idx) => {
          const el = createEventEl(e, true);
          el.style.top = (idx * (UNTIMED_BLOCK_MIN + 4)) + "px";
          el.style.left = "3px";
          el.style.right = "3px";
          el.style.height = UNTIMED_BLOCK_MIN + "px";
          body.appendChild(el);
        });

        // Timed blocks with lane assignment for overlaps
        const { items, total: nLanes } = assignLanes(vTimed);
        for (const it of items) {
          const el = createEventEl(it, false);
          const topPx = untimedAreaPx + (it._startMin - gridStart) * pxPerMin;
          const heightPx = (it._endMin - it._startMin) * pxPerMin - 2;
          const laneFracW = 1 / nLanes;
          el.style.top = topPx + "px";
          el.style.height = Math.max(28, heightPx) + "px";
          el.style.left = "calc(" + (it.lane * laneFracW * 100) + "% + 3px)";
          el.style.right = "calc(" + ((nLanes - 1 - it.lane) * laneFracW * 100) + "% + 3px)";
          body.appendChild(el);
        }

        col.appendChild(body);
        grid.appendChild(col);
      }

      updateCount();
    }

    function createEventEl(e, untimed) {
      const el = document.createElement("div");
      el.className = "event" + (saved.has(e.id) ? " saved" : "") + (untimed ? " untimed" : "");
      el.dataset.id = e.id;
      el.title = "Tap for details · " + e.event;

      const name = document.createElement("div");
      name.className = "event-name";
      name.textContent = e.event;
      el.appendChild(name);

      const time = document.createElement("div");
      time.className = "event-time";
      time.textContent = untimed ? "" : (e.start + (e.end ? " – " + e.end : ""));
      el.appendChild(time);

      if (Array.isArray(e.lineup) && e.lineup.length) {
        const list = document.createElement("ul");
        list.className = "event-lineup-list";
        const hasTimes = e.lineup.some(ent => ent.time);
        for (const ent of e.lineup) {
          const li = document.createElement("li");
          if (hasTimes) {
            const t = document.createElement("span");
            t.className = "lineup-time";
            t.textContent = ent.time || "";
            li.appendChild(t);
          }
          const n = document.createElement("span");
          n.className = "lineup-name" + (ent.time ? "" : " untimed");
          n.textContent = ent.name;
          li.appendChild(n);
          list.appendChild(li);
        }
        el.appendChild(list);
      }

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openModal(e.id);
      });

      return el;
    }

    function updateCount() {
      const c = document.getElementById("saved-count");
      c.textContent = saved.size;
      document.getElementById("saved-venues-count").textContent = savedVenues.size;
      const total = EVENTS.length;
      const fri = EVENTS.filter(e => e.day === "Fri").length;
      const sat = EVENTS.filter(e => e.day === "Sat").length;
      const sun = EVENTS.filter(e => e.day === "Sun").length;
      const venueBit = savedVenues.size ? " · " + savedVenues.size + " venues highlighted" : "";
      document.getElementById("counts").textContent =
        total + " events · Fri " + fri + " · Sat " + sat + " · Sun " + sun + " · " + saved.size + " saved" + venueBit;
    }

    // ===== Modal =====
    const modalOverlay = document.getElementById("modal-overlay");
    const modal = document.getElementById("modal");

    function openModal(id) {
      const e = EVENTS_BY_ID[id];
      if (!e) return;
      renderModal(e);
      modalOverlay.classList.add("open");
      modalOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modalOverlay.classList.remove("open");
      modalOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function renderModal(e) {
      modal.innerHTML = "";
      // Head
      const head = document.createElement("div");
      head.className = "modal-head";
      const title = document.createElement("div");
      title.className = "modal-title";
      title.textContent = e.event;
      if (e.parentEvent) {
        const sub = document.createElement("div");
        sub.style.cssText = "font-size:11px;font-weight:400;color:var(--text-muted);margin-top:3px;";
        sub.textContent = e.parentEvent;
        title.appendChild(sub);
      }
      head.appendChild(title);
      const closeBtn = document.createElement("button");
      closeBtn.className = "modal-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", closeModal);
      head.appendChild(closeBtn);
      modal.appendChild(head);

      // Body
      const body = document.createElement("div");
      body.className = "modal-body";
      const dayLabel = e.day + " " + (e.day === "Fri" ? "15" : e.day === "Sat" ? "16" : "17") + " May 2026";
      body.appendChild(modalRow("When", e.start ? dayLabel + " · " + e.start + (e.end ? " – " + e.end : "") : dayLabel + " · time TBA"));
      body.appendChild(modalRow("Venue", e.venue));
      if (e.tickets) body.appendChild(modalRow("Tickets", e.tickets));

      if (Array.isArray(e.lineup) && e.lineup.length) {
        const labelRow = document.createElement("div");
        labelRow.className = "modal-row";
        const lbl = document.createElement("div"); lbl.className = "label"; lbl.textContent = "Lineup";
        const val = document.createElement("div"); val.className = "value";
        const ul = document.createElement("ul"); ul.className = "modal-lineup";
        for (const ent of e.lineup) {
          const li = document.createElement("li");
          const t = document.createElement("span"); t.className = "lt"; t.textContent = ent.time || "—";
          const n = document.createElement("span"); n.className = "ln" + (ent.time ? "" : " untimed"); n.textContent = ent.name;
          li.appendChild(t); li.appendChild(n);
          ul.appendChild(li);
        }
        val.appendChild(ul);
        labelRow.appendChild(lbl); labelRow.appendChild(val);
        body.appendChild(labelRow);
      }

      if (e.notes) {
        const notesWrap = document.createElement("div");
        notesWrap.className = "modal-notes";
        notesWrap.textContent = e.notes;
        body.appendChild(notesWrap);
      }
      modal.appendChild(body);

      // Foot — favorite + link
      const foot = document.createElement("div");
      foot.className = "modal-foot";

      const fav = document.createElement("button");
      const isSaved = saved.has(e.id);
      fav.className = "btn btn-fav" + (isSaved ? " is-saved" : "");
      fav.textContent = isSaved ? "★ Saved" : "☆ Save";
      fav.addEventListener("click", () => {
        if (saved.has(e.id)) saved.delete(e.id); else saved.add(e.id);
        persistSaved();
        const now = saved.has(e.id);
        fav.classList.toggle("is-saved", now);
        fav.textContent = now ? "★ Saved" : "☆ Save";
        // Sync block in the grid
        const block = document.querySelector('.event[data-id="' + cssEscape(e.id) + '"]');
        if (block) block.classList.toggle("saved", now);
        updateCount();
      });
      foot.appendChild(fav);

      if (e.link) {
        const link = document.createElement("a");
        link.className = "btn btn-link";
        link.href = e.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "flex";
        link.style.alignItems = "center";
        link.style.justifyContent = "center";
        link.style.textDecoration = "none";
        link.textContent = linkLabel(e.link);
        foot.appendChild(link);
      }
      modal.appendChild(foot);
    }

    function modalRow(label, value) {
      const row = document.createElement("div");
      row.className = "modal-row";
      const lbl = document.createElement("div"); lbl.className = "label"; lbl.textContent = label;
      const val = document.createElement("div"); val.className = "value"; val.textContent = value;
      row.appendChild(lbl); row.appendChild(val);
      return row;
    }

    function linkLabel(url) {
      try {
        const h = new URL(url).hostname.replace(/^www\\./, "");
        if (h.includes("instagram")) return "Open Instagram ↗";
        if (h.includes("facebook")) return "Open Facebook ↗";
        if (h.includes("dice.fm")) return "Open DICE ↗";
        if (h.includes("seetickets")) return "See Tickets ↗";
        if (h.includes("axs")) return "Open AXS ↗";
        return "Open " + h + " ↗";
      } catch { return "Open link ↗"; }
    }

    function cssEscape(s) {
      return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\\\"');
    }

    modalOverlay.addEventListener("click", (ev) => {
      if (ev.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && modalOverlay.classList.contains("open")) closeModal();
    });

    document.querySelectorAll(".genre-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const g = btn.dataset.genre;
        if (activeGenres.has(g)) {
          if (activeGenres.size === 1) return; // keep at least one
          activeGenres.delete(g);
          btn.classList.remove("active");
        } else {
          activeGenres.add(g);
          btn.classList.add("active");
        }
        render();
      });
    });

    document.querySelectorAll(".day-tab").forEach(t => {
      t.addEventListener("click", () => {
        document.querySelectorAll(".day-tab").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        currentDay = t.dataset.day;
        const gw = document.getElementById("grid-wrap");
        gw.scrollTop = 0;
        gw.scrollLeft = 0;
        render();
      });
    });

    document.getElementById("toggle-saved").addEventListener("click", function() {
      showSavedOnly = !showSavedOnly;
      this.classList.toggle("active", showSavedOnly);
      render();
    });

    document.getElementById("toggle-saved-venues").addEventListener("click", function() {
      showSavedVenuesOnly = !showSavedVenuesOnly;
      this.classList.toggle("active", showSavedVenuesOnly);
      render();
    });

    document.getElementById("clear-saved").addEventListener("click", () => {
      if (saved.size === 0 && savedVenues.size === 0) return;
      const bits = [];
      if (saved.size) bits.push(saved.size + " event" + (saved.size === 1 ? "" : "s"));
      if (savedVenues.size) bits.push(savedVenues.size + " venue" + (savedVenues.size === 1 ? "" : "s"));
      if (!confirm("Clear " + bits.join(" and ") + "?")) return;
      saved = new Set();
      savedVenues = new Set();
      persistSaved();
      persistSavedVenues();
      render();
    });

    // Re-render on resize if px-per-hour changes class
    let lastNarrow = window.innerWidth <= 720;
    window.addEventListener("resize", () => {
      const nowNarrow = window.innerWidth <= 720;
      if (nowNarrow !== lastNarrow) { lastNarrow = nowNarrow; render(); }
    });

    // Sync gutter vertical scroll with grid-wrap
    document.getElementById("grid-wrap").addEventListener("scroll", function() {
      const gb = document.querySelector(".gutter-body");
      if (gb) gb.style.transform = "translateY(-" + this.scrollTop + "px)";
    }, { passive: true });

    render();
  </script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, "utf8");
console.log(`Wrote ${pageEvents.length} events to ${OUT} (${html.length} bytes)`);

