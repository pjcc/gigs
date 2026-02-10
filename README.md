# Gig Tracker

A single-page web app for tracking music gigs and concerts, backed by a Google Sheet. No Google login required for users - access is controlled by a shared password.

## Features

- Add, edit, and delete gigs
- Track who's interested and who's bought tickets
- Card view, table view, and edit history
- Upcoming gigs sorted by date; past gigs greyed out
- Dark mode by default, with a light mode toggle
- Person list persisted to the sheet
- Simple password-based access (no Google account needed)
- Fully client-side frontend, deployable as a static site

---

## How It Works

The frontend is a React app that talks to a Google Apps Script web app. The Apps Script runs as you (the sheet owner) and handles all reads and writes. Users only need the password - they never interact with Google directly.

```
Browser  →  Apps Script (runs as you)  →  Google Sheet
```

---

## Setup

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it whatever you like (e.g. "Gig Tracker").
3. You don't need to set up any tabs - the script creates them automatically.

### 2. Add the Apps Script

1. In your spreadsheet, go to **Extensions > Apps Script**.
2. This opens the script editor. Delete any code already there.
3. Copy the entire contents of `apps-script/Code.gs` from this project and paste it in.
4. Near the top, change `PASSWORD` to whatever you want the shared password to be:
   ```javascript
   const PASSWORD = 'your-secret-password';
   ```
5. Click **Save** (Ctrl+S / Cmd+S).

### 3. Deploy the Apps Script

1. In the script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description**: Gig Tracker API (or whatever you like)
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**.
5. You'll be asked to authorise the script. Click **Authorise access**, choose your Google account, and grant the permissions.
   - If you see "Google hasn't verified this app", click **Advanced > Go to Gig Tracker API (unsafe)**. This is safe - it's your own script.
6. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

### 4. Configure and run the frontend

1. Install [Node.js](https://nodejs.org/) 18+ if you haven't already.
2. Unzip the project and open a terminal in the folder.
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` and paste your Web app URL:
   ```
   VITE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
   ```
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Open [http://localhost:5173](http://localhost:5173).
7. Enter your name and the password you set in step 2. Done.

---

## Updating the Apps Script

If you edit the Apps Script code after deploying, you need to create a **new deployment** (or update the existing one) for changes to take effect:

1. In the script editor, click **Deploy > Manage deployments**.
2. Click the pencil icon on your deployment.
3. Under **Version**, select **New version**.
4. Click **Deploy**.

The URL stays the same so you don't need to update `.env`.

---

## Deploying the Frontend

### Build

```bash
npm run build
```

Creates a `dist/` folder with static files.

### GitHub Pages (at pjcc.github.io/gigs)

The `vite.config.js` has `base: '/gigs/'` already set.

**Option A - push built files:**
```bash
npm run build
cd dist
git init
git checkout -b main
git add -A
git commit -m "Deploy"
git remote add origin https://github.com/pjcc/gigs.git
git push -u origin main --force
```

Then in GitHub repo settings > Pages, set source to **main** branch, **/ (root)**.

**Option B - GitHub Actions:**

Add `VITE_SCRIPT_URL` as a repository secret, then use a workflow that runs `npm ci && npm run build` and deploys the `dist/` folder. See the deployment guide for a full workflow YAML.

### Netlify / Vercel

Connect the repo, set build command to `npm run build`, publish directory to `dist`, and add `VITE_SCRIPT_URL` as an environment variable.

---

## Sheet Structure

Created automatically on first request. Four tabs:

**Gigs**: Band, Location, Price, Date, Interested, Tickets Bought, Notes, Link

**People**: Name

**History**: Timestamp, User, Action, Band, Summary

---

## Security Notes

- The password is stored in the Apps Script source, which only you can see.
- The password is checked server-side in Apps Script on every request.
- On the client, the password is stored in `localStorage` to persist the session.
- The Apps Script runs as your Google account, so it has access to your sheets. The script only touches the one spreadsheet it's attached to.
- Anyone with the password can read and write gig data. This is by design for a shared-among-friends app.

---

## Tech Stack

- [React 18](https://react.dev/) — UI
- [Vite](https://vitejs.dev/) — Build tool
- [Google Apps Script](https://developers.google.com/apps-script) — Backend
- No other runtime dependencies
