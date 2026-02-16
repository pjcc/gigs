import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getSavedSession,
  saveSession,
  clearSession,
  checkPassword,
  fetchAll,
  addGig,
  updateGig,
  removeGig,
  addPerson,
  buildDiffSummary,
  logEvent,
  logVisitIfStale,
} from "./services/api.js";
import Header from "./components/Header.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import GigList from "./components/GigList.jsx";
import GigForm from "./components/GigForm.jsx";
import HistoryView from "./components/HistoryView.jsx";
import Modal from "./components/Modal.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  // Session: { name, password } or null
  const [session, setSession] = useState(null);
  const [initialising, setInitialising] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [people, setPeople] = useState([]);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [deletingGig, setDeletingGig] = useState(null);
  const [view, setView] = useState("cards");
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => {
    return localStorage.getItem("gig-tracker-last-seen") || "0";
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("gig-tracker-theme");
    return saved || "dark";
  });

  // Compute unseen changes by other users since lastSeen
  const unseenChanges = useMemo(() => {
    if (!session || !history.length) return [];
    return history.filter((h) => {
      if (!h.timestamp) return false;
      // Only count gig actions by other users
      const isGigAction = h.action === "Added" || h.action === "Edited" || h.action === "Deleted";
      const isOtherUser = String(h.user || "").toLowerCase() !== session.name.toLowerCase();
      const isNew = h.timestamp > lastSeen;
      return isGigAction && isOtherUser && isNew;
    });
  }, [history, session, lastSeen]);

  // Map of band name -> most recent change type for card highlights
  const changedGigs = useMemo(() => {
    const map = {};
    // unseenChanges is newest-first, so first match per band wins
    for (const entry of unseenChanges) {
      const key = entry.band;
      if (key && !map[key]) {
        map[key] = entry.action;
      }
    }
    return map;
  }, [unseenChanges]);

  function markAsSeen() {
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem("gig-tracker-last-seen", now);
  }

  function handleViewChange(newView) {
    if (newView === "history") {
      markAsSeen();
    }
    setView(newView);
  }

  // Apply theme
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("gig-tracker-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Toasts
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const saved = getSavedSession();
    if (saved) {
      setSession(saved);
      logVisitIfStale(saved.password, saved.name);
    }
    setInitialising(false);
  }, []);

  // Load data when session changes
  useEffect(() => {
    if (session) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadData(silent = false) {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const data = await fetchAll(session.password);
      setGigs(data.gigs);
      setPeople(data.people);
      setHistory(data.history);
    } catch (err) {
      console.error("Load error:", err);
      if (err.message?.includes("Invalid password")) {
        clearSession();
        setSession(null);
        setLoginError("Session expired. Please sign in again.");
      } else if (!silent) {
        showToast("Failed to load data", "error");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // ---- Login ----

  async function handleLogin(name, password) {
    setLoginError(null);
    try {
      const valid = await checkPassword(password);
      if (valid) {
        saveSession(name, password);
        setSession({ name, password });
        logEvent(password, name, "Logged in", "");
      } else {
        setLoginError("Incorrect password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Could not connect. Check the script URL.");
    }
  }

  function handleSignOut() {
    clearSession();
    setSession(null);
    setGigs([]);
    setPeople([]);
    setHistory([]);
  }

  // ---- Handlers (optimistic - update UI first, API in background) ----

  async function handleAddGig(gig) {
    // Optimistic: add to local state, close modal
    const tempGig = { ...gig, rowIndex: Date.now() }; // temp rowIndex
    setGigs((prev) => [...prev, tempGig]);
    setShowForm(false);
    showToast(`Added "${gig.band}"`);

    try {
      await addGig(session.password, session.name, gig);
      // Sync to get the real rowIndex
      loadData(true);
    } catch (err) {
      console.error("Add error:", err);
      showToast("Failed to save - refreshing...", "error");
      loadData(true);
    }
  }

  async function handleUpdateGig(gig) {
    const summary = editingGig ? buildDiffSummary(editingGig, gig) : "Updated";

    // Optimistic: update local state, close modal
    setGigs((prev) => prev.map((g) => (g.rowIndex === gig.rowIndex ? { ...gig } : g)));
    setEditingGig(null);
    setShowForm(false);
    showToast(`Updated "${gig.band}"`);

    try {
      await updateGig(session.password, session.name, gig, summary);
    } catch (err) {
      console.error("Update error:", err);
      showToast("Failed to save - refreshing...", "error");
      loadData(true);
    }
  }

  async function handleDeleteGig() {
    if (!deletingGig) return;
    const band = deletingGig.band;
    const rowIndex = deletingGig.rowIndex;

    // Optimistic: remove from local state, close modal
    setGigs((prev) => prev.filter((g) => g.rowIndex !== rowIndex));
    setDeletingGig(null);
    showToast(`Deleted "${band}"`);

    try {
      await removeGig(session.password, session.name, deletingGig);
      // Sync to fix row indices after deletion
      loadData(true);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete - refreshing...", "error");
      loadData(true);
    }
  }

  async function handleAddPerson(name) {
    // Optimistic: update state immediately
    setPeople((prev) => (prev.includes(name) ? prev : [...prev, name]));
    try {
      await addPerson(session.password, name);
    } catch (err) {
      console.error("Add person error:", err);
      showToast("Failed to save person", "error");
    }
  }

  // ---- Loading screen ----
  if (initialising) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          Loading...
        </div>
      </div>
    );
  }

  // ---- Login screen ----
  if (!session) {
    return (
      <div className="app">
        <LoginScreen onLogin={handleLogin} error={loginError} />
      </div>
    );
  }

  // ---- Main app ----
  return (
    <div className="app">
      <Header
        onAdd={() => {
          setEditingGig(null);
          setShowForm(true);
        }}
        onSignOut={handleSignOut}
        onRefresh={async () => {
          setRefreshing(true);
          await loadData(true);
          setRefreshing(false);
        }}
        refreshing={refreshing}
        view={view}
        onViewChange={handleViewChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        userName={session.name}
        unseenCount={unseenChanges.length}
      />

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading gigs...
        </div>
      ) : view === "history" ? (
        <HistoryView history={history} />
      ) : (
        <GigList
          gigs={gigs}
          view={view}
          changedGigs={changedGigs}
          onEdit={(gig) => {
            setEditingGig(gig);
            setShowForm(true);
          }}
          onDelete={(gig) => setDeletingGig(gig)}
          onAdd={() => {
            setEditingGig(null);
            setShowForm(true);
          }}
        />
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal
          title={editingGig ? "Edit Gig" : "Add Gig"}
          onClose={() => {
            setShowForm(false);
            setEditingGig(null);
          }}
        >
          <GigForm
            key={editingGig ? `edit-${editingGig.rowIndex}` : "add"}
            gig={editingGig}
            people={people}
            onSubmit={editingGig ? handleUpdateGig : handleAddGig}
            onCancel={() => {
              setShowForm(false);
              setEditingGig(null);
            }}
            onAddPerson={handleAddPerson}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deletingGig && (
        <Modal title="Delete Gig" onClose={() => setDeletingGig(null)}>
          <div className="confirm-delete">
            <p>Are you sure you want to delete this gig?</p>
            <p className="band-name">{deletingGig.band}</p>
          </div>
          <div className="modal-footer" style={{ borderTop: "none", paddingTop: 0 }}>
            <button className="btn btn-secondary" onClick={() => setDeletingGig(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleDeleteGig}>
              Delete
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
