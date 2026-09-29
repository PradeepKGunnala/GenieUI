# Genie Company OS Control Plane

React/TypeScript control plane for the [Genie Company OS backend](https://github.com/PradeepKGunnala/genie-company-os). The browser and Tauri desktop app share one interface. Mission, agent, approval, budget, memory, audit, and health data come from the backend; the interface never makes governance decisions.

## Requirements

- Node.js 20 and npm
- The Genie backend running at `127.0.0.1:8080`, including its PostgreSQL dependencies and a provisioned owner account. Follow the backend repository's setup instructions. The backend must be started separately for both browser and desktop use.
- For desktop builds: Rust and the [Tauri 2 platform prerequisites](https://v2.tauri.app/start/prerequisites/) (on Linux, WebKit2GTK 4.1 and GTK development packages).

## Browser development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Vite forwards `/api` to the local backend so session cookies and the CSRF token remain same-origin. Sign in with a backend owner or viewer account. No API key belongs in the renderer or source tree.

```bash
npm run typecheck
npm run lint
npm run build
```

`npm run preview` previews the built static UI. Production browser hosting must forward `/api/v1/**` to the backend on the **same origin** and serve `index.html` for client routes; Vite's proxy runs only during development.

## Desktop

```bash
npm run desktop:dev
npm run desktop:build
```

The packaged desktop app loads bundled frontend assets, then calls a narrowly scoped Tauri command for `/api/v1/**` against `127.0.0.1:8080`. Rust maintains the backend session and CSRF cookies in memory, never in the renderer or filesystem. Browser mode receives live SSE invalidations with a 10-second polling fallback; desktop uses the 10-second polling interval. The app opens without the backend and shows a connection message until it starts; the desktop package does **not** install or start the Java service. For desktop build dependencies see the Tauri prerequisites above.

## Current scope

- Overview, mission ledger and execution graph, agent registry, approval inbox, resource charts, memory search, audit trail, and system health with emergency stop.
- Mission creation starts backend execution. Approval, agent state, and emergency stop actions are backend-authorized and audited.
- Evaluation, Trading, Personal & Career, and DroneOS navigation show explicit integration placeholders until those APIs exist.

See [architecture and follow-up work](docs/architecture.md) for boundaries and the remaining milestones from the implementation guide.
