# AI Agent Instructions — Agent Dashboard MVP

## Purpose
Multi-AI orchestration platform ("Bougie Budget" strategy) — coordinate 7 free-tier AI agents to build projects with $0 cost. Task Router analyzes complexity and routes work to appropriate agents (Gemini Code Assist for coding, Mistral for planning, Grok for analysis).

## Critical Architecture

**Single-Screen Command Center Design:**
- Task Router (default view) → analyzes task → recommends agent → generates workflow
- Compact status bar (always visible) → 40px horizontal bar with stats
- Quick Decision Guide (right sidebar, 220px) → collapsible agent reference
- Floating windows for Preview + Docs (only one visible at a time)
- Four views: Task Router | Agents | Workflows | Dashboard

**Key Components:**
- `TaskRouter.jsx` (418 lines) — complexity analyzer, agent recommender, workflow generator
- `AgentCapabilities.jsx` (485 lines) — 7 AI agents matrix (GitHub access, local repo, capabilities)
- `WorkflowGenerator.jsx` (462 lines) — pre-built workflow templates with step tracking
- `CompactStatusBar.jsx` — single-line stats (agents | cost | components | commits)
- `QuickDecisionGuide.jsx` — right sidebar with agent quick reference
- `FloatingWindow.jsx` — (in progress by Blackbox) draggable windows for Preview/Docs

**Data Flow:**
- Frontend (React 18 + Vite + Tailwind + Framer Motion) ←→ Backend (Express + Socket.io on :3001)
- ManualAgentInput → POST `/api/log-entry` → `agent-conversation.log` (SHA-256 deduplication)
- DocumentationViewer → GET `/api/docs/:filename` from `AGENT_PROJECT_PATH`
- PreviewWindow → iframe to localhost:5174 (painting-estimator) or production URL
- Stats: GET `/api/stats` → real data from painting-estimator (components, commits, log entries)

**Backend (server/index.js):**
- File watcher (chokidar) on `AGENT_PROJECT_PATH` → WebSocket events on changes
- Endpoints: `/api/health`, `/api/stats`, `/api/log-entry` (POST), `/api/log-entries`, `/api/docs/:filename`
- Rate limiting (express-rate-limit)
- Path integrity enforcement ("Basement Protocol" after Gemini incident)

## Workflows & Conventions

**Git Workflow:**
- Always branch for >1 file changes: `git checkout -b ai/[agent]/[feature]`
- Commit format: `feat: description\n\n🤖 Generated with [Claude Code]\n\nCo-Authored-By: [Agent Name]`
- Never force push to main without explicit user approval
- Recovery: `git reset --hard HEAD` if things break

**Agent Coordination:**
- Log all work to `agent-conversation.log` with timestamp, actor, type, content
- Use Manual Agent Drop Zone UI for pasting responses from non-API agents (Grok, web-based AIs)
- Task Router tells you which agent to use (don't guess)
- Code assistants (Gemini Code Assist, Copilot) do ALL simple coding
- Planning agents (Mistral, ChatGPT, Gemini) only for complex architecture
- Grok only when you need raw analytical power (requires full context paste)

**UI Patterns:**
- Dark theme (bg-slate-900, text-slate-400)
- Framer Motion: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- Copy-to-clipboard with feedback (checkmark on success)
- Lucide React icons (import from 'lucide-react')
- Mobile responsive: `hidden lg:block` for desktop-only features
- Compact status bar shows on ALL views (40px fixed height)
- QuickDecisionGuide: fixed right sidebar, collapsible, localStorage persistence

**State Management:**
- React useState for local component state
- localStorage for persistence (guide open/closed, floating window positions)
- WebSocket for real-time updates (file changes, log entries)
- Fallback to mock data if backend unavailable

**Testing:**
- Vitest + React Testing Library
- Run: `npm test` or `npm run test:run`
- Test files: `*.test.jsx` alongside components

## Run & Develop

```bash
# Install
npm install

# Start frontend (port 5173)
npm run dev

# Start backend (port 3001) in separate terminal
npm run server

# Point to external project (painting-estimator)
export AGENT_PROJECT_PATH="/Users/skip/Documents/Active_Projects/painting-estimator"

# Tests
npm test
```

**Quick Verifications:**
- Frontend: http://localhost:5173
- Backend health: http://localhost:3001/api/health
- Docs endpoint: http://localhost:3001/api/docs/README.md
- Stats: http://localhost:3001/api/stats

## Critical Don'ts

**Never remove or restructure these without explicit approval:**
- `src/components/TaskRouter.jsx` — core orchestration logic
- `src/components/AgentCapabilities.jsx` — agent matrix
- `src/components/ManualAgentInput.jsx` — log entry surface
- `src/components/DocumentationViewer.jsx` — docs viewer
- `src/App.jsx` — view system and layout

**Safeguards:**
- Communicate plans before editing >50 lines or >1 file
- Preserve WebSocket + localStorage fallback pattern
- Never block UI on backend (optimistic updates)
- Don't remove working surfaces (Manual Input, Docs Viewer)
- Recovery: `git stash` or `git reset --hard HEAD`

## Key Files Reference

**Core Components:**
- Entry: `src/main.jsx` → wraps App in DontPanicErrorBoundary
- App: `src/App.jsx` → view system, WebSocket connection, stats fetching
- Task Router: `src/components/TaskRouter.jsx` — task analysis, agent routing
- Agent Matrix: `src/components/AgentCapabilities.jsx` — 7 agents overview
- Workflows: `src/components/WorkflowGenerator.jsx` — workflow templates
- Status Bar: `src/components/CompactStatusBar.jsx` — horizontal stats
- Quick Guide: `src/components/QuickDecisionGuide.jsx` — right sidebar

**Backend:**
- Server: `server/index.js` — Express + Socket.io gateway
- Utils: `server/utils/parser.js` — log parsing utilities
- Tests: `server/__tests__/api.test.js` — backend API tests

## Current State (Jan 9, 2026)

**Completed:**
- ✅ Task Router system (complexity analysis, agent recommendations, workflow generation)
- ✅ Agent Capabilities matrix (7 free agents, GitHub access indicators)
- ✅ Workflow Generator (5 pre-built templates with progress tracking)
- ✅ Compact Status Bar (single-line stats, always visible)
- ✅ Quick Decision Guide (collapsible right sidebar)
- ✅ Manual Agent Drop Zone (paste responses, SHA-256 deduplication)
- ✅ Documentation Viewer (tabbed interface, search, auto-refresh)
- ✅ Preview Window (iframe to painting-estimator, fullscreen toggle)

**In Progress:**
- ⏳ FloatingWindow component (Blackbox AI building) — draggable windows for Preview/Docs

**Planned:**
- Merge Agents + Workflows into unified view
- Agent cards with built-in manual entry toggle
- Single-screen command center (no scrolling, maximum density)

## Agent-Specific Notes

**Gemini Code Assist / Copilot:**
- Use for ALL coding tasks — 30 days free trial
- Has full local repo context
- Perfect for UI polish, styling, refactoring

**Mistral Le Chat:**
- Has GitHub access — can review repo
- Use for strategic planning, architecture
- Example: "Review agent-dashboard-mvp on GitHub and suggest architecture for [feature]"

**ChatGPT / Gemini:**
- Has GitHub access
- Use for task breakdown, documentation, alternative opinions

**Grok:**
- No repo access — requires full context paste
- Use ONLY for intensive analysis on specific data

**Blackbox AI / Cline:**
- Effective at building components from detailed specs
- Works well in parallel with other agents

Last Reviewed: 2026-01-09 (Task Router deployment)
