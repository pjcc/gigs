/**
 * API service for the Gig Tracker.
 *
 * All requests go to a Google Apps Script web app which
 * handles reads and writes to the backing spreadsheet.
 * Auth is a simple shared password.
 */

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

// ---- Storage ----

const STORAGE_KEY = 'gig-tracker-session';

export function getSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(name, password) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, password }));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ---- API Call ----

async function apiCall(payload) {
  const resp = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  // Apps Script may return text/plain, parse manually
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response from server');
  }
}

// ---- Auth ----

export async function checkPassword(password) {
  const result = await apiCall({ action: 'auth', password });
  return result.ok === true;
}

// ---- Data ----

export async function fetchAll(password) {
  const result = await apiCall({ action: 'getAll', password });
  if (!result.ok) throw new Error(result.error || 'Failed to load data');
  return {
    gigs: result.gigs,
    people: result.people,
    history: result.history,
  };
}

export async function addGig(password, user, gig) {
  const result = await apiCall({
    action: 'addGig',
    password,
    user,
    gig,
  });
  if (!result.ok) throw new Error(result.error || 'Failed to add gig');
}

export async function updateGig(password, user, gig, summary) {
  const result = await apiCall({
    action: 'updateGig',
    password,
    user,
    gig,
    summary,
  });
  if (!result.ok) throw new Error(result.error || 'Failed to update gig');
}

export async function removeGig(password, user, gig) {
  const summary = `${gig.location}, ${gig.date}`;
  const result = await apiCall({
    action: 'deleteGig',
    password,
    user,
    rowIndex: gig.rowIndex,
    band: gig.band,
    summary,
  });
  if (!result.ok) throw new Error(result.error || 'Failed to delete gig');
}

export async function addPerson(password, name) {
  const result = await apiCall({
    action: 'addPerson',
    password,
    name,
  });
  if (!result.ok) throw new Error(result.error || 'Failed to add person');
}

// ---- Diff ----

export function buildDiffSummary(oldGig, newGig) {
  const changes = [];

  if (oldGig.band !== newGig.band) {
    changes.push(`Band: "${oldGig.band}" → "${newGig.band}"`);
  }
  if (oldGig.location !== newGig.location) {
    changes.push(`Venue: "${oldGig.location}" → "${newGig.location}"`);
  }
  if (oldGig.date !== newGig.date) {
    changes.push(`Date: ${oldGig.date} → ${newGig.date}`);
  }

  const oldPrice = oldGig.price != null ? String(oldGig.price) : '';
  const newPrice = newGig.price != null ? String(newGig.price) : '';
  if (oldPrice !== newPrice) {
    changes.push(`Price: ${oldPrice || 'none'} → ${newPrice || 'none'}`);
  }

  const oldInt = (oldGig.interested || []).join(', ');
  const newInt = (newGig.interested || []).join(', ');
  if (oldInt !== newInt) {
    changes.push(`Interested: [${oldInt || 'none'}] → [${newInt || 'none'}]`);
  }

  const oldTix = (oldGig.ticketsBought || []).join(', ');
  const newTix = (newGig.ticketsBought || []).join(', ');
  if (oldTix !== newTix) {
    changes.push(`Tickets: [${oldTix || 'none'}] → [${newTix || 'none'}]`);
  }

  if ((oldGig.notes || '') !== (newGig.notes || '')) {
    changes.push('Notes updated');
  }
  if ((oldGig.link || '') !== (newGig.link || '')) {
    changes.push('Link updated');
  }

  return changes.length > 0 ? changes.join('; ') : 'No changes detected';
}

// ---- Event Logging ----

export function logEvent(password, user, eventType, summary) {
  console.log('logEvent called:', eventType, user);
  apiCall({
    action: 'logEvent',
    password,
    user,
    eventType,
    summary,
  })
    .then((res) => console.log('logEvent response:', res))
    .catch((err) => console.error('logEvent failed:', err));
}

const LAST_VISIT_KEY = 'gig-tracker-last-visit';
const VISIT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function logVisitIfStale(password, user) {
  const now = Date.now();
  const last = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0', 10);
  if (now - last > VISIT_INTERVAL_MS) {
    localStorage.setItem(LAST_VISIT_KEY, String(now));
    logEvent(password, user, 'Visited', '');
  }
}
