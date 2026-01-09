# AI Agent Instructions — Agent Dashboard MVP

**Purpose**: Real-time visual coordination UI for multi-agent development (docs, logs, live activity) targeting an external project via `AGENT_PROJECT_PATH`.

## ⚠️ CRITICAL SAFEGUARDS — READ FIRST

### Before Making ANY Changes:
1. **COMMUNICATE FIRST**: Describe planned changes and get user approval for anything touching >1 file or >50 lines
2. **CREATE SAFETY BRANCH**: `git checkout -b ai/[agent-name]/[feature]` before major refactors
3. **VERIFY EXISTING FEATURES**: Run `npm run dev` + `npm run server` to see current functionality — DO NOT remove working features
4. **ASK CLARIFYING QUESTIONS**: If requirements are vague, ask 3+ specific questions before coding

### NEVER Do This Without Explicit Permission:
- ❌ Remove existing components that are imported/used (ManualAgentInput, DocumentationViewer, TaskRouter, etc.)
- ❌ Restructure entire App.jsx or change navigation system
- ❌ Delete views/features without confirming they're unused
- ❌ Create 3+ new files for "refactoring" without explaining why
- ❌ Change core data flows (WebSocket patterns, localStorage fallbacks)

### Recovery Commands (teach users these):
```bash
# Undo all uncommitted changes
git stash push -u -m "AI_CHANGES_$(date +%Y%m%d_%H%M%S)"

# Return to last good commit
git reset --hard HEAD

# See stashed changes later
git stash list && git stash show stash@{0}
```

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

## Git Workflow for Safety

**Branch-First Pattern** (prevents destructive changes)
```bash
# Before major refactors:
git checkout -b ai/[agent]/[feature-name]

# Commit incrementally:
git add -A && git commit -m "[agent]: [specific change]"

# If user says "undo" or breaks:
git checkout main  # Back to working version
git branch -D ai/[agent]/[feature-name]  # Delete bad attempt

# If approved:
git checkout main && git merge ai/[agent]/[feature-name] && git push
```

**Current Working Features** (DO NOT remove):
- Manual Agent Input (logs to backend + localStorage fallback)
- Documentation Viewer (live file watching from AGENT_PROJECT_PATH)
- Multi-tab docs (README, PROJECT_GUIDE, agent-conversation.log, etc.)
- WebSocket real-time updates
- Stats cards (components, commits, agents, log entries)

Last Reviewed: 2026-01-09 (added safeguards after destructive Gemini incident)
