# Swagger & Subsystem Deployment Models

This document explains two common approaches for running and exposing Swagger API documentation for a system composed of multiple subsystems (Time, Leaves, Payroll, Recruitment, etc.). It describes the trade-offs between running a unified application that serves all subsystems on one port (Unified-Port Model) versus running each subsystem as an independent process on its own port (Per-Subsystem Ports Model). It also provides recommended commands and integration notes for testing and deployment.

## Models

- **Unified-Port Model**

  - Description: All subsystem modules are registered in a single NestJS `AppModule` and the application is started once. Swagger aggregates all controllers and exposes a single combined API doc (e.g. `/api/docs`).
  - How we implemented it in this repository: `backend/src/main.ts` creates a single Swagger document when starting the full `AppModule` and exposes it at `/api/docs`.

- **Per-Subsystem Ports Model**
  - Description: Each subsystem can be started independently (its own NestJS entrypoint), listens on its own port, and exposes its own Swagger UI (e.g. `/time/docs`). This is useful for isolated development and when subsystems live in separate repos.
  - How we implemented it in this repository: `backend/src/time-mangement/main.ts` provides a dedicated entrypoint for the Time subsystem and exposes Swagger at `/time/docs` when started alone.

## Pros & Cons

- Unified-Port Model

  - Pros:
    - Single Swagger UI showing all APIs — convenient for integration testing and QA.
    - Simpler local run (one process to manage).
    - Easier to produce one combined OpenAPI JSON for automated tools.
  - Cons:
    - Developers working on one subsystem may need the entire app dependencies running locally.
    - Larger memory/CPU footprint when running everything together.

- Per-Subsystem Ports Model
  - Pros:
    - Subsystems can be developed, run, and tested independently.
    - Matches the microservice/separate-repo workflow — teams can own repos and CI pipelines.
    - Faster feedback loops for small changes.
  - Cons:
    - Swagger is split across multiple UIs — requires an aggregator or separate visits to each docs page for a full view.
    - Integration requires orchestrating multiple processes (or containers) with ports and networking.

## Recommended workflow

- Development / Feature Work

  - Run the subsystem you're working on standalone (Per-Subsystem Ports Model). This minimizes overhead and speeds up iteration.
  - Use the subsystem Swagger (e.g. `http://localhost:3001/time/docs`) to test endpoints quickly.

- Integration / QA
  - Start the full application (Unified-Port Model) to validate cross-subsystem flows and to see a single aggregated Swagger at `http://localhost:3000/api/docs`.
  - For CI integration tests, you can either:
    - Start the full app in the CI environment, or
    - Start multiple subsystems as separate services and run integration tests against their ports.

## How to run (examples)

- Start the full app (Unified-Port):

```bash
# from `backend/`
unset START_SUBSYSTEM
npm run start
# open http://localhost:3000/api/docs
```

- Start only the Time subsystem (Per-Subsystem):

```bash
# from `backend/` (bash)
export START_SUBSYSTEM=time
export TIME_PORT=3001
npm run start
# open http://localhost:3001/time/docs
```

Notes:

- On Windows PowerShell adjust syntax accordingly (use `$env:START_SUBSYSTEM='time'` etc.).
- If you prefer compiled builds:

```bash
npm run build
export START_SUBSYSTEM=time
export TIME_PORT=3001
node dist/main.js
```

## Swagger aggregation strategies (optional)

- If you want a single Swagger UI while still running subsystems independently, consider:
  - Generating OpenAPI JSON files from each subsystem and using a simple UI that can switch between them, or
  - Merging OpenAPI specs (tools: `swagger-cli bundle` / `openapi-merge-cli`) during a local aggregation step, or
  - Adding a small aggregator service that proxies the individual subsystems' OpenAPI JSON and presents a combined UI.

## Networking, CORS & Ports

- When running multiple subsystems, assign each a stable port (e.g. 3001, 3002, 3003) and document them in developer README.
- Ensure CORS is configured if you access APIs from a browser-based UI running on a different origin.
- Windows firewall or corporate proxies may block ports — use allowed ports or run services inside containers if necessary.

## Deployment notes

- Both models are deployable. In production you may choose either:

  - Unified deployment (single service that includes all subsystems), or
  - Multiple services (one per subsystem) that communicate over internal network or API gateway.

- Integration phase: running services separately in their own repos is fine — design stable API contracts (OpenAPI specs) and use versioning to prevent breakage when assembling subsystems.

## Quick checklist for teams

- Decide default local development mode: Unified or Per-Subsystem.
- If Per-Subsystem, pick port ranges and document them.
- Ensure each subsystem provides an OpenAPI/Swagger JSON export (for CI and aggregation).
- Add health endpoints and readiness checks for integration tests.

---

If you want, I can:

- Add a short `docs/README.md` entry that lists exact commands per OS for each subsystem, or
- Add a small aggregator script that fetches individual OpenAPI JSON files and writes a single combined `openapi.json` for local use.

End of document.
