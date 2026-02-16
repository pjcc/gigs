const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const linkStyle = {
  fontSize: "0.75rem",
  color: "var(--text-light)",
  textDecoration: "none",
};

const sepStyle = {
  fontSize: "0.75rem",
  color: "var(--text-light)",
};

function HeaderLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      onMouseEnter={function (e) {
        e.target.style.color = "var(--text-muted)";
      }}
      onMouseLeave={function (e) {
        e.target.style.color = "var(--text-light)";
      }}
    >
      {children}
    </a>
  );
}

export default function Header({
  onAdd,
  onSignOut,
  onRefresh,
  view,
  onViewChange,
  theme,
  onThemeToggle,
  userName,
  refreshing,
  unseenCount,
}) {
  return (
    <header className="header">
      <div className="header-top-row">
        <h1>Gigsheet max</h1>
        <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
          {userName} — Sign out
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "-4px" }}>
        <HeaderLink href="https://docs.google.com/spreadsheets/d/1LnB95ltEkXCzc2v-I3w2XYF51dWPTbs2jJP0Ns-h4qU/edit?gid=1940085950#gid=1940085950">
          source
        </HeaderLink>
        <span style={sepStyle}>/</span>
        <HeaderLink href="https://www.rivalcults.com/gigs">rivalcults</HeaderLink>
        <span style={sepStyle}>/</span>
        <HeaderLink href="https://docs.google.com/spreadsheets/d/10bPCFonO7jVnXkzpXPcaVxzJwS1iFlJkzsQSRvOYYZo/edit?gid=0#gid=0">
          scraped
        </HeaderLink>
      </div>
      <div className="header-actions">
        <div className="view-toggle">
          <button
            className={view === "cards" ? "active" : ""}
            onClick={function () {
              onViewChange("cards");
            }}
            title="Card view"
          >
            Cards
          </button>
          <button
            className={view === "table" ? "active" : ""}
            onClick={function () {
              onViewChange("table");
            }}
            title="Table view"
          >
            Table
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={function () {
              onViewChange("history");
            }}
            title="Edit history"
            style={{ position: "relative" }}
          >
            History
            {unseenCount > 0 && view !== "history" && <span className="unseen-badge">{unseenCount}</span>}
          </button>
        </div>
        <button className="theme-toggle" onClick={onThemeToggle} title={"Switch to " + (theme === "dark" ? "light" : "dark") + " mode"}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className={"btn-icon" + (refreshing ? " spinning" : "")} onClick={onRefresh} title="Refresh data">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Gig
        </button>
      </div>
    </header>
  );
}
