# Genie Company OS Control Plane

React/TypeScript control plane for the [Genie Company OS backend](https://github.com/PradeepKGunnala/genie-company-os). The browser and Tauri desktop app share one interface. Mission, agent, approval, budget, memory, audit, and health data come from the backend; the interface never makes governance decisions.

## Requirements

- Node.js 22.18+ and npm
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
- Trading exposes the separate owner-approved paper ledger and backtest evidence. Evaluation, Personal & Career and DroneOS retain their existing integration placeholders.

See [architecture and follow-up work](docs/architecture.md) for boundaries and the remaining milestones from the implementation guide.


## Consolidated control center

Overview preserves the live organization hierarchy, mission command bar, daily counters,
approval inbox, recent missions and audit activity. Agents retain hierarchy and card views.
The sidebar adds Connections and Model updates, plus detailed budgets, costs, policies,
autonomy and emergency controls. Original routes remain available. Detailed mission controls,
ledger filtering, agent registry metrics and overview metrics are linked from their original pages.
Icons use the existing Lucide/SVG system; the control-center weekday follows the device date.

For a complete mission form use **Missions → New mission** or `/missions/new`.
Select required external connections, set constraints, save a draft or create and start.
If start fails, the saved mission remains available for inspection and retry.
Connections supports named public HTTPS JSON sources and stored Bearer/API-key credentials,
agent grants, access checks, rotation and disconnection. Polygon/paper configuration is also
available. Backend role, tenant, subscription and approval controls remain authoritative.

```bash
GENIE_BACKEND_URL=http://127.0.0.1:8080 npm run dev -- --host 127.0.0.1 --port 3000
npm run build
npm run lint
node --test src/features/*.test.mjs
```

The backend main must include the Connections follow-up PR. For a credential-free sample,
allow `api.github.com` on the backend, add `https://api.github.com/repos/octocat/Hello-World/languages`
with NONE authentication and CEO access, then select it in a short research mission.
Connection checks verify reads, not strategy approval or successful mission completion.

Request correlation identifiers work on both HTTPS/localhost and plain HTTP private network
addresses; identifiers are tracing metadata, never authentication tokens. Development networking
and Tailscale are local operations, not public hosting. Production needs a same-origin HTTPS
reverse proxy; do not publish development test passwords or encryption keys.

Limits: personal/evaluation/DroneOS placeholders remain visible; generic connection writes and
OAuth are not implemented; trading remains paper-only with explicit owner approval. Production
builds currently warn about a large main bundle. Tauri packaging of the added detailed screens
has not been validated in this change.
