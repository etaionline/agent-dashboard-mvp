# 🚀 Port & Build Architecture

## Port Layout

```
┌─────────────────────────────────────────────────────┐
│          Agent Dashboard MVP (Port 5173)            │
│  ◆ Main control center                              │
│  ◆ Shows project overview, logs, stats              │
│  ◆ Controls preview & documentation                 │
└─────────────────────────────────────────────────────┘
           ↓                               ↓
    ┌──────────────┐           ┌──────────────────┐
    │ Port 5174    │           │ Port 3001        │
    │ Painting     │           │ Backend Server   │
    │ Estimator    │           │ ◆ API endpoints  │
    │ (Production  │           │ ◆ WebSocket      │
    │  Build)      │           │ ◆ File Watcher   │
    └──────────────┘           └──────────────────┘
    
    ┌──────────────┐
    │ Port 5175+   │
    │ Temp Preview │
    │ (Isolated)   │
    │ ◆ Safe clone │
    │ ◆ No side    │
    │   effects    │
    └──────────────┘
```

## Running Services

### 1. Start Agent Dashboard (Main)
```bash
cd agent-dashboard-mvp
npm run dev          # Port 5173 - Control center
npm run server       # Port 3001 - Backend
```

### 2. Start Painting Estimator (Production)
```bash
cd painting-estimator
npm run dev          # Port 5174 - Live editing
```

### 3. Start Temporary Preview Build (Optional - Isolated)
```bash
cd painting-estimator
scripts/preview-temp-build.sh [port]  # Port 5175+ - Safe sandbox
# Default: 5175
# Example: scripts/preview-temp-build.sh 5176
```

## What Each Does

| Service | Port | Purpose | Safe to Edit? |
|---------|------|---------|---------------|
| Dashboard | 5173 | Control center, view docs, stats | Yes (isolated UI) |
| Backend | 3001 | API, WebSocket, file watching | Yes (no UI) |
| Estimator (Prod) | 5174 | Live development, real changes | Yes (your main work) |
| Estimator (Preview) | 5175+ | Temporary isolated build | **Never** - it's temporary |

## Preview Build Safety

The `preview-temp-build.sh` script:
- ✅ Creates isolated `/tmp/` clone (won't affect your source)
- ✅ Copies entire project structure
- ✅ Installs fresh node_modules
- ✅ Uses custom port (5175, 5176, etc.)
- ✅ Auto-cleanup on exit (Ctrl+C)

**Perfect for:**
- Testing experimental changes without risking main build
- Showing changes to clients without affecting development
- Running multiple versions simultaneously
- Comparing old vs new builds

## Quick Start

Terminal 1 - Dashboard & Backend:
```bash
cd agent-dashboard-mvp
npm run dev &
npm run server &
```

Terminal 2 - Painting Estimator:
```bash
cd painting-estimator
npm run dev      # Runs on 5174
```

Terminal 3 - Optional Preview:
```bash
cd painting-estimator
scripts/preview-temp-build.sh 5175    # Isolated sandbox
```

Then open:
- http://localhost:5173 - Agent Dashboard (control center)
- http://localhost:5174 - Painting Estimator (your main build)
- http://localhost:5175 - Preview Build (if running)
