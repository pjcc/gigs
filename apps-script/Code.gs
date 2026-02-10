/**
 * Gig Tracker - Apps Script Backend
 *
 * Deploy as a web app:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Set the PASSWORD constant below before deploying.
 */

const PASSWORD = 'CHANGE_ME'; // <-- Set your password here

// Rate limiting: max failed password attempts per minute per IP-ish key
const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const GIGS_SHEET = 'Gigs';
const PEOPLE_SHEET = 'People';
const HISTORY_SHEET = 'History';

const GIG_HEADERS = ['Band', 'Location', 'Price', 'Date', 'Interested', 'Tickets Bought', 'Notes', 'Link'];
const HISTORY_HEADERS = ['Timestamp', 'User', 'Action', 'Band', 'Summary'];

// ---- Entry Points ----

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const result = handleRequest(payload);
    return respond(result);
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

function doGet(e) {
  return respond({ ok: false, error: 'Use POST' });
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Rate Limiting ----

function isRateLimited() {
  var cache = CacheService.getScriptCache();
  var key = 'failed_attempts';
  var raw = cache.get(key);
  if (!raw) return false;
  try {
    var data = JSON.parse(raw);
    return data.count >= MAX_FAILED_ATTEMPTS;
  } catch (e) {
    return false;
  }
}

function recordFailedAttempt() {
  var cache = CacheService.getScriptCache();
  var key = 'failed_attempts';
  var raw = cache.get(key);
  var data = { count: 0 };
  if (raw) {
    try { data = JSON.parse(raw); } catch (e) {}
  }
  data.count++;
  // Cache expires after 60 seconds (rate limit window)
  cache.put(key, JSON.stringify(data), 60);
}

// ---- Router ----

function handleRequest(payload) {
  const { action, password } = payload;

  // Rate limit check
  if (isRateLimited()) {
    return { ok: false, error: 'Too many attempts. Try again in a minute.' };
  }

  // Auth check
  if (action === 'auth') {
    if (password === PASSWORD) {
      return { ok: true };
    }
    recordFailedAttempt();
    return { ok: false };
  }

  if (password !== PASSWORD) {
    recordFailedAttempt();
    return { ok: false, error: 'Invalid password' };
  }

  switch (action) {
    case 'getAll':
      return getAll();
    case 'addGig':
      return addGig(payload);
    case 'updateGig':
      return updateGig(payload);
    case 'deleteGig':
      return deleteGig(payload);
    case 'addPerson':
      return addPerson(payload);
    default:
      return { ok: false, error: 'Unknown action: ' + action };
  }
}

// ---- Bootstrap ----

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let gigsSheet = ss.getSheetByName(GIGS_SHEET);
  if (!gigsSheet) {
    gigsSheet = ss.insertSheet(GIGS_SHEET);
    gigsSheet.getRange(1, 1, 1, GIG_HEADERS.length).setValues([GIG_HEADERS]);
  } else if (gigsSheet.getLastRow() === 0) {
    gigsSheet.getRange(1, 1, 1, GIG_HEADERS.length).setValues([GIG_HEADERS]);
  }

  let peopleSheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!peopleSheet) {
    peopleSheet = ss.insertSheet(PEOPLE_SHEET);
    peopleSheet.getRange(1, 1).setValue('Name');
  } else if (peopleSheet.getLastRow() === 0) {
    peopleSheet.getRange(1, 1).setValue('Name');
  }

  let historySheet = ss.getSheetByName(HISTORY_SHEET);
  if (!historySheet) {
    historySheet = ss.insertSheet(HISTORY_SHEET);
    historySheet.getRange(1, 1, 1, HISTORY_HEADERS.length).setValues([HISTORY_HEADERS]);
  } else if (historySheet.getLastRow() === 0) {
    historySheet.getRange(1, 1, 1, HISTORY_HEADERS.length).setValues([HISTORY_HEADERS]);
  }
}

// ---- Read All ----

function getAll() {
  ensureSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Gigs
  const gigsSheet = ss.getSheetByName(GIGS_SHEET);
  const gigsData = gigsSheet.getLastRow() > 1
    ? gigsSheet.getRange(2, 1, gigsSheet.getLastRow() - 1, GIG_HEADERS.length).getValues()
    : [];

  const gigs = gigsData.map(function(row, i) {
    return {
      rowIndex: i + 2,
      band: row[0] || '',
      location: row[1] || '',
      price: row[2] !== '' && row[2] != null ? Number(row[2]) : null,
      date: formatDateValue(row[3]),
      interested: splitPeople(row[4]),
      ticketsBought: splitPeople(row[5]),
      notes: row[6] || '',
      link: row[7] || '',
    };
  });

  // People
  const peopleSheet = ss.getSheetByName(PEOPLE_SHEET);
  const peopleData = peopleSheet.getLastRow() > 1
    ? peopleSheet.getRange(2, 1, peopleSheet.getLastRow() - 1, 1).getValues()
    : [];
  const people = peopleData.map(function(row) { return row[0]; }).filter(Boolean);

  // History
  const historySheet = ss.getSheetByName(HISTORY_SHEET);
  const historyData = historySheet.getLastRow() > 1
    ? historySheet.getRange(2, 1, historySheet.getLastRow() - 1, HISTORY_HEADERS.length).getValues()
    : [];
  const history = historyData.map(function(row) {
    return {
      timestamp: row[0] || '',
      user: row[1] || '',
      action: row[2] || '',
      band: row[3] || '',
      summary: row[4] || '',
    };
  }).reverse();

  return { ok: true, gigs: gigs, people: people, history: history };
}

// ---- Gig CRUD ----

function addGig(payload) {
  ensureSheets();
  var gig = payload.gig;
  var user = payload.user || 'unknown';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(GIGS_SHEET);

  sheet.appendRow([
    gig.band,
    gig.location,
    gig.price != null && gig.price !== '' ? Number(gig.price) : '',
    gig.date,
    (gig.interested || []).join(', '),
    (gig.ticketsBought || []).join(', '),
    gig.notes || '',
    gig.link || '',
  ]);

  logHistory(user, 'Added', gig.band, gig.location + ', ' + gig.date);
  return { ok: true };
}

function updateGig(payload) {
  ensureSheets();
  var gig = payload.gig;
  var summary = payload.summary || 'Updated';
  var user = payload.user || 'unknown';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(GIGS_SHEET);

  var row = [
    gig.band,
    gig.location,
    gig.price != null && gig.price !== '' ? Number(gig.price) : '',
    gig.date,
    (gig.interested || []).join(', '),
    (gig.ticketsBought || []).join(', '),
    gig.notes || '',
    gig.link || '',
  ];

  sheet.getRange(gig.rowIndex, 1, 1, row.length).setValues([row]);

  logHistory(user, 'Edited', gig.band, summary);
  return { ok: true };
}

function deleteGig(payload) {
  ensureSheets();
  var user = payload.user || 'unknown';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(GIGS_SHEET);

  sheet.deleteRow(payload.rowIndex);

  logHistory(user, 'Deleted', payload.band, payload.summary || '');
  return { ok: true };
}

// ---- People ----

function addPerson(payload) {
  ensureSheets();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PEOPLE_SHEET);
  sheet.appendRow([payload.name]);
  return { ok: true };
}

// ---- History ----

function logHistory(user, action, band, summary) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HISTORY_SHEET);
  sheet.appendRow([new Date().toISOString(), user, action, band, summary]);
}

// ---- Helpers ----

function splitPeople(val) {
  if (!val) return [];
  return String(val).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

function formatDateValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val);
}
