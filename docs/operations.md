# Operations UI

The System → Operations entry provides overview, registered topology, agents, workflows with trace links, traces, incidents with acknowledgement, costs, connectors and authorized scope. Data comes from the companion backend operations APIs through the existing session/CSRF request helper. Views poll every five or ten seconds, retain explicit stale/error/empty states and use bounded pagination. Topology depicts registered configured dependencies; costs are estimates. Backend authorization is authoritative.

Build and verify with `npm ci`, `npm run build`, `npm run lint` and `npm run test:unit`. Start a local production preview with `GENIE_BACKEND_URL=http://127.0.0.1:18080 npm run preview -- --host 127.0.0.1 --port 13000`. The backend deployment directions are in genie-company-os/docs/operations.md.

For automated browser validation use `GENIE_E2E_USERNAME=owner GENIE_E2E_PASSWORD='<local test password>' npm run test:operations`; see the script for optional URL/browser executable/screenshot settings. It exercises real views plus explicitly mocked unavailable/degraded states. Chromium launch is blocked in the local macOS sandbox; live in-app browser checks supplement the included runnable script. Production JWT tenant selection and direct operations SSE publishing are subsequent integration work.
