# Control plane architecture

The browser entry point runs on Vite and uses same-origin `/api/v1/**` calls. The Tauri entry point bundles the same React build; one Rust IPC command forwards GET/POST requests to the local Java service, storing its session and CSRF cookies in a per-process HTTP client. Both paths use the same DTO-facing API client. The renderer holds only current UI state and display models; the Java service owns persisted state, policy, audit, and approval decisions. Avoid putting privileged tokens, backend credentials, or governance logic in the renderer.

Server data is cached by TanStack Query; view selection lives in Zustand. The browser subscribes to control-plane SSE events and invalidates queries on change. Desktop polls every 10 seconds because its backend connection runs through the local Rust bridge. The mission DAG is drawn from the backend's graph response. Failed or absent backend calls show error and empty states instead of fabricated operational data.

## Remaining milestones

The attached implementation guide describes a broader platform. These screens are the first backend-backed slice; the following require contracts or integration work:

1. Dedicated evaluation, trading, personal/career, DroneOS, model, tool, connector, and settings APIs and their workflows.
2. Desktop service supervision (start/restart backend), remote/hybrid backend selection, and connection health/reconnect controls.
3. Additional governance surfaces: autonomy editing, policy inspection, approval detail, per-agent kill switch, and budget changes.
4. Paginated timelines, richer task traces, memory provenance detail, graph layout for large DAGs, and role-aware accessibility testing.
5. Browser integration tests with a running backend and desktop packaging tests on supported operating systems. Verify mission creation to graph, approval to resume, agent disable, emergency stop, restart and reconnect, and no renderer secrets.

The existing backend's `/api/v1/missions` creation/start endpoints are distinct from its owner-protected control-plane endpoints. Authorization for those endpoints must be verified/enforced by the backend before relying on UI role gating. Frontend role checks only control presentation.
