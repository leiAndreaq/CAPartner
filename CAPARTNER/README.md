# CAPartner Admin Web App

The station admin's dashboard for the CAPartner smart-cap system (React 19 + Vite).

Pages: Login (email + password + emailed code), Overview (map and status), Monitoring (manage enforcers and see
vitals), Alerts, Camera (live view and saved clips), Activity Log, Settings.
The page is kept in the address (example: `#/alerts`), so a refresh stays on the same page.

## Run it

You need Node.js and the backend running first.

1. Start the backend: open a terminal in `CAPartner\backend` and run `node index.js` (it listens on port 3000).
2. In this folder run `npm install` (only the first time).
3. Run `npm run dev` and open the address it prints (usually http://localhost:5173).

All calls go to `/api/...`. Vite forwards them to the backend at http://localhost:3000 (see `vite.config.js`).

## Other commands

| Command | What it does |
|---|---|
| `npm run build` | Makes the production files in `dist/` |
| `npm run preview` | Serves the built app (also forwards `/api` to the backend) |
| `npm run lint` | Checks the code for mistakes |

## Where things are

- `src/api.js`: every call to the backend goes through this file.
- `src/alertsWatcher.jsx`: checks for new alerts every 5 seconds and plays the siren.
- `src/pages/`: one file per page (with its own `.css`).
- `src/styles/theme.css`: colors and shared styles from the Figma design.

## Good to know

- The login pass is kept only while the browser tab is open (`sessionStorage`). Log out ends it for good.
- For a real deployment, put this app and the backend behind one web server with HTTPS, and send `/api` to the backend.
