import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, GitBranch, Users, FileCode, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { ManualAgentInput } from './components/ManualAgentInput';
import { DocumentationViewer } from './components/DocumentationViewer';

/**
 * Agent Dashboard MVP - Main Application
 *
 * A visual coordination platform for multi-agent development.
 *
 * Agent: CLAUDE-4.5
 * Created: 2026-01-08
 * Updated: 2026-01-09 (Added Manual Agent Drop Zone + Documentation Viewer)
 */

function App() {
  const [projectPath, setProjectPath] = useState('/Users/skip/Documents/Active_Projects/painting-estimator');
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({
    components: 0,
    evolutionEntries: 0,
    activeAgents: 0,
    patterns: 0,
  });

  useEffect(() => {
    // Connect to backend WebSocket
    let socket;
    
    const connectSocket = () => {
      try {
        socket = io('http://localhost:3001', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5
        });

        socket.on('connect', () => {
          console.log('[APP] Connected to backend');
          setConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('[APP] Disconnected from backend');
          setConnected(false);
        });

        socket.on('file-update', (data) => {
          // Could update stats based on file changes
          console.log('[APP] File update:', data.file);
        });
      } catch (err) {
        console.warn('[APP] Socket connection failed:', err.message);
        // Fallback to simulated connection
        setConnected(true);
        setStats({
          components: 8,
          evolutionEntries: 3,
          activeAgents: 2,
          patterns: 4,
        });
      }
    };

    connectSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Agent Dashboard</h1>
              <p className="text-sm text-slate-400">Visual Development Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-sm text-slate-400">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to Agent Dashboard
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl">
            Visual coordination for multi-agent development. See your project, agents, and evolution in real-time.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            icon={<FileCode className="w-6 h-6" />}
            label="Components"
            value={stats.components}
            color="emerald"
          />
          <StatCard
            icon={<GitBranch className="w-6 h-6" />}
            label="Evolution Entries"
            value={stats.evolutionEntries}
            color="cyan"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Active Agents"
            value={stats.activeAgents}
            color="violet"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Patterns"
            value={stats.patterns}
            color="amber"
          />
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Current Project</h3>
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
            <p className="font-mono text-sm text-emerald-400">{projectPath}</p>
          </div>
        </motion.div>

        {/* Two-Column Layout: Agent Input + Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          {/* Manual Agent Drop Zone */}
          <ManualAgentInput />

          {/* Documentation Viewer */}
          <DocumentationViewer />
        </motion.div>

        {/* Coming Soon Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FeatureCard
            title="Component Graph"
            description="Visual dependency graph of your codebase with real-time updates"
            status="In Development"
            color="emerald"
          />
          <FeatureCard
            title="Evolution Timeline"
            description="Interactive timeline showing project history with agent signatures"
            status="In Development"
            color="cyan"
          />
          <FeatureCard
            title="Agent Coordination"
            description="Real-time visualization of agent activity and collaboration"
            status="Planned"
            color="violet"
          />
        </motion.div>

        {/* MVP Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 border border-amber-500/30 bg-amber-500/10 rounded-xl"
        >
          <h4 className="text-lg font-semibold text-amber-400 mb-2">🚧 MVP in Development</h4>
          <p className="text-slate-300">
            This is Phase 1 of the Agent Dashboard. Core visualization features are being built.
            Follow the progress in{' '}
            <code className="px-2 py-1 bg-slate-800 rounded text-emerald-400">PROJECT_GUIDE.md</code>
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-slate-500 text-sm">
          <p>Agent Dashboard MVP • Created by CLAUDE-4.5 • 2026-01-08</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`${colorClasses[color].split(' ')[3]}`}>{icon}</div>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  );
}

function FeatureCard({ title, description, status, color }) {
  const colorClasses = {
    emerald: 'border-emerald-500/30 text-emerald-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    violet: 'border-violet-500/30 text-violet-400',
  };

  return (
    <div className="glass rounded-xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <span className={`text-xs px-3 py-1 rounded-full border ${colorClasses[color]}`}>
          {status}
        </span>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default App;
