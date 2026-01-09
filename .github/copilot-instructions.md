# AI Agent Instructions - Agent Dashboard MVP

**Visual coordination platform for multi-agent development**

## Project Purpose

This is a **real-time visualization interface** for the Agent Coordination System. It enables multi-agent teams to coordinate development by showing:
- Component dependency graphs across projects
- Evolution logs tracking agent decisions
- Live agent activity and task progress
- Shared pattern library between agents

## Architecture Overview

### Frontend Stack (React 18 + Vite)
- **React 18** with Framer Motion animations
- **Zustand** for state management (lightweight alternative to Redux)
- **Tailwind CSS** for styling (dark theme by default)
- **Monaco Editor** for code viewing (future enhancement)
- **D3.js** + **React Flow** for graph visualization

**Key files:**
- [src/App.jsx](src/App.jsx) - Main app entry point, layout structure, stats display
- [src/components/DocumentationViewer.jsx](src/components/DocumentationViewer.jsx) - Renders markdown docs from external projects
- [src/components/ManualAgentInput.jsx](src/components/ManualAgentInput.jsx) - Logs agent responses to shared conversation log

### Backend Stack (Node.js + Express)
- **Express** server proxied through Vite dev server
- **Socket.io** for real-time updates (partially implemented)
- **File system reading** via `/api/docs/:filename`

**Key files:**
- [server/index.js](server/index.js) - Express server, log entry endpoints, file serving

### Critical Data Flow
```
Agent (external) → ManualAgentInput → /api/log-entry → agent-conversation.log
                      ↓
                  localStorage (fallback)
                  
DocumentationViewer → /api/docs/:filename → project files (read-only)
```

## Developer Workflows

### Starting Development
```bash
npm install                  # Install dependencies
npm run dev                  # Terminal 1: Frontend (port 5173)
npm run server              # Terminal 2: Backend (port 3001)
```

### Production Build
```bash
npm run build               # Creates dist/ folder
npm run preview            # Test production build locally
```

### Critical Environment Variable
```bash
export AGENT_PROJECT_PATH="/path/to/project"  # Points to external project
```
The backend reads from this path to serve documentation files.

## Code Patterns & Conventions

### Component Structure
- **Functional components only** (no class components)
- Use **Framer Motion** for animations: `initial → animate → transition`
- Always include JSDoc header with Agent signature and date
- Use **Lucide React** icons (consistent icon library)

Example pattern from DocumentationViewer:
```jsx
export const MyComponent = () => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    loadData();
  }, [dependencies]);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Content */}
    </motion.div>
  );
};
```

### Error Handling
- **Graceful degradation**: Fall back to localStorage if backend is unavailable
- Always log errors to console with context: `console.log('Context message')`
- Show user-friendly messages in UI instead of raw errors

Pattern from ManualAgentInput:
```javascript
try {
  // Attempt backend call
} catch (err) {
  console.log('Backend not ready, using fallback');
  // Use localStorage fallback
}
```

### State Management (Zustand)
- Store centralized project data (components, evolution log, agents)
- Avoid prop drilling by using store hooks
- Keep stores simple and focused

### Styling
- **Tailwind CSS** exclusively (no CSS files)
- **Dark theme**: `bg-slate-900`, `text-slate-400`
- **Accent colors**: Emerald (primary), Cyan (secondary)
- Use semantic classnames: `grid-cols-1 md:grid-cols-4` for responsive layout

## Integration Points

### External Project Connection
The dashboard points to an external project via `AGENT_PROJECT_PATH` env var. It reads:
- `PROJECT_GUIDE.md` - Architecture and evolution log (future parsing)
- `agent-conversation.log` - Shared coordination log (current feature)
- Other markdown docs (.md files in project root)

### Backend-Frontend Communication
- **HTTP GET** `/api/docs/:filename` - Fetch markdown content
- **HTTP POST** `/api/log-entry` - Append agent responses
- **HTTP GET** `/api/log-entries?limit=20` - Retrieve recent entries
- **Socket.io** (partial) - Real-time file watch updates

### Data Format: Agent Log Entry
```javascript
{
  timestamp: "01/09/2026, 12:34:56",  // AST timezone
  agent: "CLAUDE-4.5",                 // AI agent name
  type: "manual-paste",                // Entry type
  task: "Build UI component",          // Optional task context
  content: "Full response text..."     // Log content
}
```

## Testing & Debugging

### Quick Checks
1. **Frontend runs**: `npm run dev` → http://localhost:5173
2. **Backend runs**: `npm run server` → listens on port 3001
3. **Backend file serving**: Visit http://localhost:3001/api/docs/README.md
4. **Logs**: Check browser console (frontend) and terminal (backend)

### Common Issues
- **"Failed to load document"**: Ensure backend is running and AGENT_PROJECT_PATH is set
- **"Backend not ready"**: App gracefully falls back to localStorage
- **Port conflicts**: Change ports in [vite.config.js](vite.config.js) and [server/index.js](server/index.js)

## Important Patterns to Follow

1. **Always add JSDoc headers** with Agent name and timestamp
2. **Use error boundaries** for graceful degradation
3. **Fetch with fallbacks** - never let missing backend break the app
4. **Sign evolution log entries** - include agent identifier (e.g., CLAUDE-4.5, GPT-4)
5. **Keep components small** - under 200 lines when possible
6. **Responsive design first** - mobile-first Tailwind approach

## Next Phase Features (Roadmap)

- Component dependency graph visualization (D3/React Flow)
- Evolution timeline with interactive filtering
- Real-time Socket.io updates for file changes
- PROJECT_GUIDE.md parser for architecture rendering
- Agent panel showing active coordinating agents

## Key Dependencies to Understand

| Library | Purpose | Usage |
|---------|---------|-------|
| `react` | UI framework | Components, hooks |
| `framer-motion` | Animations | `motion.div` components |
| `zustand` | State management | Store creation & hooks |
| `socket.io-client` | Real-time updates | WebSocket events (WIP) |
| `react-markdown` | Markdown rendering | Doc viewer display |
| `express` | Backend server | API routes |
| `d3` | Data visualization | Graph layouts (future) |

---

**Last Updated**: Jan 9, 2026 | **Author**: CLAUDE-4.5 | **Status**: MVP Phase 1
