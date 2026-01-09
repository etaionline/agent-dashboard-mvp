# 🎨 Agent Dashboard MVP

**Visual coordination platform for multi-agent development**

## 🎯 What is This?

The Agent Dashboard is a web-based visual interface that transforms the Agent Coordination System into an interactive, real-time development environment. Think of it as "mission control" for multi-agent coding.

## 🌟 Features (MVP)

### Phase 1: Core Visualization
- [x] Concept design
- [ ] Component dependency graph
- [ ] Evolution Log timeline
- [ ] PROJECT_GUIDE.md parser
- [ ] Real-time file watcher
- [ ] WebSocket server

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start backend
npm run server
```

### Point to a Project

```bash
# Set environment variable to your project
export AGENT_PROJECT_PATH="/Users/skip/Documents/Active_Projects/painting-estimator"

# Start dashboard
npm run dev
```

The dashboard will automatically:
1. Find PROJECT_GUIDE.md
2. Parse Evolution Log
3. Build component dependency graph
4. Watch for file changes
5. Display real-time updates

## 📁 Project Structure

```
agent-dashboard-mvp/
├── src/
│   ├── App.jsx                 # Main application
│   ├── components/
│   │   ├── ProjectCanvas.jsx   # Component dependency graph
│   │   ├── EvolutionTimeline.jsx  # Timeline view
│   │   ├── AgentPanel.jsx      # Active agents display
│   │   ├── PatternLibrary.jsx  # Pattern cards
│   │   └── ArchitectureView.jsx  # Architecture diagrams
│   ├── hooks/
│   │   ├── useProjectData.js   # Load project data
│   │   ├── useFileWatcher.js   # Real-time updates
│   │   └── useWebSocket.js     # WebSocket connection
│   ├── stores/
│   │   └── projectStore.js     # Zustand state management
│   └── utils/
│       ├── parser.js           # PROJECT_GUIDE.md parser
│       ├── graphBuilder.js     # Build dependency graph
│       └── fileAnalyzer.js     # Analyze source files
├── server/
│   ├── index.js                # Express + Socket.io server
│   ├── fileWatcher.js          # Chokidar file watching
│   ├── parser.js               # Markdown parsing
│   └── analyzer.js             # Code analysis
├── public/
│   └── index.html
├── package.json
└── vite.config.js
```

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Flow** - Graph visualization
- **D3.js** - Data visualization
- **Framer Motion** - Animations
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing

### Backend
- **Node.js + Express** - Server
- **Socket.io** - Real-time updates
- **Chokidar** - File watching
- **Unified.js** - Markdown parsing
- **simple-git** - Git operations

## 🔧 Configuration

Create `.env` file:

```bash
# Project to visualize
AGENT_PROJECT_PATH="/path/to/your/project"

# Server port
PORT=3001

# WebSocket port
WS_PORT=3002
```

## 📊 Features Roadmap

### Phase 1: Core Visualization (Current)
- [ ] Basic component graph
- [ ] Evolution Log timeline
- [ ] PROJECT_GUIDE.md viewer
- [ ] File watcher integration

### Phase 2: Real-Time Features
- [ ] Live file change tracking
- [ ] Agent activity indicators
- [ ] Live diff viewing
- [ ] WebSocket updates

### Phase 3: Interactive Editing
- [ ] Monaco editor integration
- [ ] Visual PROJECT_GUIDE.md editor
- [ ] Pattern drag-and-drop
- [ ] In-place code editing

### Phase 4: AI Integration
- [ ] Agent task assignment
- [ ] Natural language commands
- [ ] Pattern suggestions
- [ ] Vibe coding mode

## 🎯 Development Guide

### Adding a New Component

1. Create component file in `src/components/`
2. Use TypeScript for props
3. Follow Tailwind styling
4. Add to `App.jsx`

```jsx
// Example: src/components/NewFeature.jsx
export const NewFeature = ({ data }) => {
  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      {/* Your component */}
    </div>
  );
};
```

### Error UI Standard: "DONT PANIC"
- All unexpected UI errors render a friendly Hitchhiker-style screen with large bold "DONT PANIC" and the actual error in small print below.
- Implemented via a global error boundary wrapping the app in `src/main.jsx` using `src/components/DontPanicErrorBoundary.jsx`.
- For runtime errors outside React render (e.g., network failures), components should continue to log diagnostics but avoid crashing; the boundary will catch render errors.
- When adding new views/components, no additional work is needed—errors default to the DONT PANIC screen.

### Adding a New Visualization

1. Use D3.js or React Flow
2. Store data in Zustand
3. Update on WebSocket events
4. Animate with Framer Motion

```javascript
// Example: src/utils/newVisualization.js
import * as d3 from 'd3';

export const createVisualization = (data) => {
  // D3 visualization logic
};
```

## 🧪 Testing

```bash
# Test with painting-estimator project
export AGENT_PROJECT_PATH="/Users/skip/Documents/Active_Projects/painting-estimator"
npm run dev

# You should see:
# - Component graph with EstimateTool, Dashboard, etc.
# - Evolution Log with entries
# - Real-time file watching
```

## 🎨 Design System

### Colors

```javascript
// Agent identity colors
const AGENT_COLORS = {
  'CLAUDE': '#10B981',    // Green
  'GPT': '#3B82F6',       // Blue
  'GEMINI': '#F59E0B',    // Amber
  'HUMAN': '#8B5CF6',     // Purple
};

// Status colors
const STATUS_COLORS = {
  active: '#10B981',
  idle: '#6B7280',
  error: '#EF4444',
  success: '#22C55E',
};
```

### Typography

```css
/* Tailwind classes */
.font-display { font-family: 'Inter', system-ui; }
.font-mono { font-family: 'Fira Code', monospace; }
```

## 📚 API Reference

### WebSocket Events

```javascript
// Client → Server
socket.emit('project:load', { path: '/path/to/project' });
socket.emit('file:watch', { pattern: '**/*.jsx' });

// Server → Client
socket.on('project:loaded', (data) => {
  // Project data with Evolution Log, component graph
});

socket.on('file:changed', (data) => {
  // File path, diff, timestamp
});

socket.on('agent:activity', (data) => {
  // Agent name, file, action
});
```

### Store API

```javascript
import { useProjectStore } from './stores/projectStore';

const {
  components,      // Component dependency graph
  evolutionLog,    // Parsed Evolution Log
  activeAgents,    // Currently active agents
  patterns,        // Documented patterns
  setProject,      // Load new project
  updateFile       // Handle file changes
} = useProjectStore();
```

## 🚀 Deployment

### Development

```bash
npm run dev
# Opens at http://localhost:5173
# Backend at http://localhost:3001
```

### Production

```bash
npm run build
# Creates dist/ folder
# Deploy to Vercel, Netlify, etc.
```

### Desktop App (Future)

```bash
# Electron wrapper
npm run electron:build
```

## 🎓 Learning Resources

- [React Flow Documentation](https://reactflow.dev/)
- [D3.js Examples](https://observablehq.com/@d3/gallery)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Socket.io Documentation](https://socket.io/docs/v4/)

## 🐛 Troubleshooting

### WebSocket Connection Failed

```bash
# Check backend is running
curl http://localhost:3001/health

# Check firewall settings
```

### Project Not Loading

```bash
# Verify PROJECT_GUIDE.md exists
ls $AGENT_PROJECT_PATH/PROJECT_GUIDE.md

# Check file permissions
```

### Graph Not Rendering

```bash
# Check browser console for errors
# Verify React Flow is installed
npm list react-flow-renderer
```

## 🤝 Contributing

This is an MVP - contributions welcome!

1. Fork the repo
2. Create feature branch
3. Update PROJECT_GUIDE.md (if applicable)
4. Submit PR with Evolution Log entry

## 📝 License

MIT License - See LICENSE file

## 🎉 Status

**Current Phase**: Phase 1 - Core Visualization
**Next Milestone**: Working component graph + timeline
**Target**: 2-week MVP sprint

---

**Created**: 2026-01-08
**Agent**: CLAUDE-4.5
**Status**: Active Development
**Related**: [VISUAL_PLATFORM_CONCEPT.md](../painting-estimator/VISUAL_PLATFORM_CONCEPT.md)
