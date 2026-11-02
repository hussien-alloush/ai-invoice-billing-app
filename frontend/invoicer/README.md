# Invoicer Frontend

This folder contains the React/Vite frontend for the Invoicer application. It
uses the real backend API; the old mock-data setup instructions no longer
describe the current project.

## Run locally

From this directory:

```powershell
npm install
npm run dev
```

The frontend expects the backend to be running at `http://localhost:8000`.
Vite proxies `/api` requests there; see `vite.config.js`.

## Commands

```powershell
npm run lint
npm run build
npm run preview
```

For a complete explanation of the user workflows, backend, database, setup,
configuration, and feature boundaries, see the repository's
[Project Guide](../../PROJECT_GUIDE.md).
