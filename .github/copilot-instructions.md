# AI Agent Instructions — Agent Dashboard MVP

Purpose: Real-time visual coordination UI for multi-agent development (docs, logs, live activity) targeting an external project via `AGENT_PROJECT_PATH`.

Architecture (React + Express)
- Frontend: React 18 + Vite + Tailwind + Framer Motion + Zustand.
- Backend: Express (proxied by Vite) + partial Socket.io.
- Key files: [src/App.jsx](src/App.jsx), [src/components/DocumentationViewer.jsx](src/components/DocumentationViewer.jsx), [src/components/ManualAgentInput.jsx](src/components/ManualAgentInput.jsx), [server/index.js](server/index.js).

Dev Workflow
- Install/run: `npm install` → `npm run dev` (5173) and `npm run server` (3001).
- Point to a project: `export AGENT_PROJECT_PATH="/absolute/path/to/project"`.
- Quick checks:
  - Docs: http://localhost:3001/api/docs/README.md (serves from `AGENT_PROJECT_PATH`).
  - Logs: POST http://localhost:3001/api/log-entry, GET `/api/log-entries?limit=20`.
  - Stats (optional): GET `/api/stats` — if 404, define route in [server/index.js](server/index.js) before `httpServer.listen()`.

Critical Data Flow
- External Agent → ManualAgentInput → POST `/api/log-entry` → `agent-conversation.log`.
- DocumentationViewer → GET `/api/docs/:filename` → read-only markdown from target project.
- Fallback: If backend unavailable, UI writes/reads localStorage (graceful degradation).

Component & UI Conventions
- Functional components, Tailwind-only styling (dark theme defaults: `bg-slate-900`, `text-slate-400`).
- Use Framer Motion for enter/hover transitions; follow `initial → animate → transition` pattern.
- Include JSDoc header with agent signature + timestamp on new components.

Backend Endpoints (implemented)
- `GET /api/docs/:filename` → { success, content } from `AGENT_PROJECT_PATH`.
- `POST /api/log-entry` → append structured entry to `agent-conversation.log`.
- `GET /api/log-entries?limit=20` → recent entries for UI.
- Known pitfall: `/api/stats` may be undefined; wire it up if stats cards read 0.

Error Handling Patterns
- Prefer friendly UI messages; log diagnostic context to console.
- ManualAgentInput: try backend, else localStorage fallback (keep entry structure consistent).

When Extending
- New UI surfaces should not block on backend; add optimistic UI with localStorage backup.
- If adding sockets: reuse existing connection pattern in [src/App.jsx](src/App.jsx) / [src/components/DocumentationViewer.jsx](src/components/DocumentationViewer.jsx); emit file-change events, debounce UI updates.

MVP Scope Reminder
- Graph visualizations and advanced sockets are partial; prioritize docs/logs flows and stability over roadmap items.

Last Reviewed: 2026-01-09 (based on README and recent test report)
