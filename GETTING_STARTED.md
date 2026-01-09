# 🚀 Getting Started with Agent Dashboard MVP

**Quick setup guide to get the visual platform running**

---

## 📋 Prerequisites

- Node.js 18+ installed
- A project with the Agent Coordination System (PROJECT_GUIDE.md)
- VS Code (recommended)

---

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd agent-dashboard-mvp
npm install
```

### 2. Start Development Server

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (Phase 2)
npm run server
```

### 3. Open in Browser

Visit: http://localhost:5173

You should see the beautiful Agent Dashboard MVP interface!

---

## 🎯 What You'll See

### Landing Page
- **Header**: Dashboard title with connection status
- **Stats Cards**: Components, Evolution entries, Active agents, Patterns
- **Project Info**: Current project path
- **Feature Cards**: Upcoming features (Component Graph, Timeline, etc.)
- **MVP Notice**: Development status

### Visual Design
- Dark theme with gradient backgrounds
- Glassmorphism effects
- Smooth animations (Framer Motion)
- Color-coded by feature type

---

## 🔧 Configuration

### Point to Your Project

Edit `src/App.jsx`:

```javascript
const [projectPath, setProjectPath] = useState(
  '/path/to/your/project'  // Change this
);
```

Or set environment variable:

```bash
export AGENT_PROJECT_PATH="/Users/skip/Documents/Active_Projects/painting-estimator"
npm run dev
```

---

## 📁 Project Structure Tour

```
agent-dashboard-mvp/
├── src/
│   ├── App.jsx          ← Main component (start here)
│   ├── main.jsx         ← Entry point
│   ├── index.css        ← Tailwind + custom styles
│   └── components/      ← Feature components (Phase 2+)
├── public/
│   └── index.html       ← HTML template
├── package.json         ← Dependencies
├── vite.config.js       ← Vite configuration
└── tailwind.config.js   ← Tailwind theme
```

---

## 🎨 Customizing the Dashboard

### Change Colors

Edit `src/App.jsx` color classes:

```javascript
const colorClasses = {
  emerald: 'from-emerald-500/20 ...',  // Green
  cyan: 'from-cyan-500/20 ...',        // Blue
  violet: 'from-violet-500/20 ...',    // Purple
  amber: 'from-amber-500/20 ...',      // Orange
};
```

### Add New Stats

In `src/App.jsx`:

```javascript
const [stats, setStats] = useState({
  components: 0,
  evolutionEntries: 0,
  activeAgents: 0,
  patterns: 0,
  yourNewStat: 0,  // Add here
});
```

Then add a `<StatCard />` component.

### Modify Animations

Edit Framer Motion properties:

```javascript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}  // Customize
>
```

---

## 🔌 Adding Real Data (Phase 2)

### Step 1: Create WebSocket Hook

```javascript
// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('project:loaded', (data) => {
      // Handle project data
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return { socket, connected };
};
```

### Step 2: Use in App Component

```javascript
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { socket, connected } = useWebSocket();

  // Now you have real-time connection!
}
```

---

## 🧪 Testing the MVP

### Test Checklist

- [ ] Dashboard loads without errors
- [ ] Stats cards display numbers
- [ ] Animations play smoothly
- [ ] Hover effects work on cards
- [ ] Connection indicator shows green
- [ ] Responsive on mobile (try resizing)
- [ ] Dark theme looks good

### Performance Check

```bash
# Check bundle size
npm run build

# Should be under 500KB for MVP
```

---

## 🐛 Troubleshooting

### Dashboard Not Loading

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Styles Not Applying

```bash
# Rebuild Tailwind
rm -rf node_modules/.vite
npm run dev
```

### Framer Motion Errors

```bash
# Ensure correct version
npm install framer-motion@^10.16.4
```

---

## 🎯 Next Steps

### Phase 1: Core Visualization (Current)
- [x] Basic landing page
- [x] Stats display
- [x] Beautiful UI
- [ ] Real project data loading
- [ ] Component dependency graph
- [ ] Evolution Log timeline

### Phase 2: Real-Time Features
- [ ] WebSocket server
- [ ] File watching
- [ ] Live updates
- [ ] Agent activity tracking

### Your First Feature

Pick one:

**Option A: Build Component Graph**
```bash
# Create component
touch src/components/ProjectCanvas.jsx

# Install React Flow
npm install react-flow-renderer

# Implement graph visualization
```

**Option B: Build Evolution Timeline**
```bash
# Create component
touch src/components/EvolutionTimeline.jsx

# Parse PROJECT_GUIDE.md
# Display as timeline
```

**Option C: Add PROJECT_GUIDE.md Parser**
```bash
# Create utility
touch src/utils/parser.js

# Install unified
npm install unified remark-parse remark-gfm

# Parse markdown to JSON
```

---

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

### Tutorials
- [React Flow Tutorial](https://reactflow.dev/learn)
- [D3.js for React](https://www.d3indepth.com/)
- [WebSocket with React](https://socket.io/how-to/use-with-react)

### Inspiration
- [Linear App](https://linear.app) - Beautiful UI
- [Figma](https://figma.com) - Collaborative design
- [GitHub Insights](https://github.com) - Data visualization

---

## 💡 Tips

### Development

1. **Hot Reload**: Vite supports HMR - changes appear instantly
2. **Browser DevTools**: Use React DevTools extension
3. **Performance**: Monitor with Lighthouse
4. **Debugging**: Console logs are your friend

### Code Style

```javascript
// Use descriptive component names
<FeatureCard />  // Good
<Card1 />        // Bad

// Destructure props
const MyComponent = ({ title, description }) => {}

// Use Tailwind utilities
className="bg-slate-900 hover:bg-slate-800 transition"
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/component-graph

# Make changes, commit
git add .
git commit -m "feat: add component graph visualization [CLAUDE-4.5]"

# Push and PR
git push origin feature/component-graph
```

---

## 🎉 You're Ready!

The Agent Dashboard MVP is now running. You have:

✅ Beautiful landing page
✅ Animated UI components
✅ Tailwind + Framer Motion setup
✅ Project structure ready
✅ Clear path to Phase 2

**Next**: Choose a feature from "Next Steps" and start building!

---

## 🆘 Need Help?

- Check `VISUAL_PLATFORM_CONCEPT.md` for design reference
- See `README.md` for architecture details
- Review `package.json` for available scripts
- Look at `src/App.jsx` for code examples

---

**Created**: 2026-01-08
**Agent**: CLAUDE-4.5
**Status**: Ready to Build 🚀
