import { useState, useEffect } from 'react';
import { Send, RefreshCw, MessageSquare, AlertTriangle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Manual Agent Drop Zone
 *
 * Staging area for manually pasting agent responses from non-integrated AIs.
 * Logs all entries to agent-conversation.log for inter-agent coordination.
 * Supports tags and deduplication.
 *
 * Agent: CLAUDE-4.5
 * Created: 2026-01-09
 */

const TAG_OPTIONS = [
  { id: 'general', label: 'General', color: 'bg-slate-500' },
  { id: 'feature', label: 'Feature', color: 'bg-emerald-500' },
  { id: 'bugfix', label: 'Bug Fix', color: 'bg-red-500' },
  { id: 'docs', label: 'Docs', color: 'bg-blue-500' },
  { id: 'refactor', label: 'Refactor', color: 'bg-purple-500' },
  { id: 'chat', label: 'Chat', color: 'bg-cyan-500' },
  { id: 'analysis', label: 'Analysis', color: 'bg-amber-500' },
];

const AUTO_TAGS = [
  { pattern: /^(feat|feature|add):/i, tag: 'feature' },
  { pattern: /^(fix|bug|fix:|bugfix:)/i, tag: 'bugfix' },
  { pattern: /^(docs?|documentation)/i, tag: 'docs' },
  { pattern: /^(refactor|refactor:|rename)/i, tag: 'refactor' },
  { pattern: /^(chat|conversation|discuss)/i, tag: 'chat' },
  { pattern: /^(analyze|analysis|review)/i, tag: 'analysis' },
];

export const ManualAgentInput = () => {
  const [manualInput, setManualInput] = useState('');
  const [agentName, setAgentName] = useState('');
  const [taskContext, setTaskContext] = useState('');
  const [selectedTag, setSelectedTag] = useState('general');
  const [manualEntries, setManualEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingForce, setPendingForce] = useState(false);

  // Load recent entries on mount
  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/log-entries?limit=10');
      if (response.ok) {
        const data = await response.json();
        setManualEntries(data.entries || []);
      }
    } catch (err) {
      console.log('Backend not ready yet, using local storage');
      const stored = localStorage.getItem('manualEntries');
      if (stored) {
        setManualEntries(JSON.parse(stored));
      }
    }
  };

  // Auto-detect tag from content
  useEffect(() => {
    if (!manualInput.trim()) {
      setSelectedTag('general');
      return;
    }
    
    for (const { pattern, tag } of AUTO_TAGS) {
      if (pattern.test(manualInput.trim())) {
        setSelectedTag(tag);
        break;
      }
    }
  }, [manualInput]);

  const handleSaveManualEntry = async (force = false) => {
    if (!manualInput.trim() || !agentName.trim()) {
      alert('Please provide both agent name and content');
      return;
    }

    setIsSaving(true);
    setDuplicateWarning(null);

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Halifax',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const entry = {
      timestamp,
      agent: agentName.trim(),
      task: taskContext.trim() || 'General',
      content: manualInput.trim(),
      type: selectedTag
    };

    try {
      // Try to save to backend
      const url = force ? 'http://localhost:3001/api/log-entry?force=true' : 'http://localhost:3001/api/log-entry';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      const data = await response.json();

      if (data.duplicate && !force) {
        // Show duplicate warning
        setDuplicateWarning({
          existingEntry: data.existingEntry,
          message: data.message
        });
        setIsSaving(false);
        return;
      }

      if (response.ok) {
        console.log('Entry saved to backend');
      } else {
        throw new Error(data.error || 'Backend save failed');
      }
    } catch (err) {
      console.warn('Backend not available, saving locally:', err);
      // Fallback to localStorage
      const updated = [entry, ...manualEntries].slice(0, 50);
      localStorage.setItem('manualEntries', JSON.stringify(updated));
    }

    // Update UI
    setManualEntries(prev => [entry, ...prev]);
    setDuplicateWarning(null);

    // Clear form
    setManualInput('');
    setTaskContext('');
    setSelectedTag('general');
    setIsSaving(false);
    setPendingForce(false);
  };

  const formatTimestamp = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return ts;
    }
  };

  const getAgentColor = (agent) => {
    const colors = {
      'CLAUDE': 'emerald',
      'GPT': 'blue',
      'CHATGPT': 'blue',
      'GEMINI': 'amber',
      'GROK': 'violet',
      'MISTRAL': 'cyan',
      'BLACKBOX': 'slate',
      'HUMAN': 'purple'
    };

    const key = Object.keys(colors).find(k => agent.toUpperCase().includes(k));
    return colors[key] || 'slate';
  };

  const getTagInfo = (tagId) => {
    return TAG_OPTIONS.find(t => t.id === tagId) || TAG_OPTIONS[0];
  };

  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    violet: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    slate: 'bg-slate-500/10 border-slate-500/30 text-slate-400'
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700 p-6 h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Manual Agent Drop Zone</h2>
        </div>
        <button
          onClick={loadRecentEntries}
          className="text-slate-400 hover:text-white transition"
          title="Refresh entries"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Paste responses from any AI agent. All entries are logged to{' '}
        <code className="text-emerald-400 bg-slate-950/50 px-2 py-0.5 rounded">
          agent-conversation.log
        </code>
      </p>

      {/* Duplicate Warning */}
      <AnimatePresence>
        {duplicateWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-amber-400 font-medium mb-1">Duplicate Entry Detected</h4>
                <p className="text-sm text-slate-300 mb-3">
                  This content was already logged by {duplicateWarning.existingEntry?.agent || 'same agent'}
                  {' '}at {formatTimestamp(duplicateWarning.existingEntry?.timestamp || '')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveManualEntry(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition"
                  >
                    Append Anyway
                  </button>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <div className="mb-4 space-y-3">
        {/* Agent & Task Row */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
            placeholder="Agent name (e.g., Claude-4.5)"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          />
          <input
            type="text"
            className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
            placeholder="Task/Context (optional)"
            value={taskContext}
            onChange={(e) => setTaskContext(e.target.value)}
          />
        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">Tag:</span>
          {TAG_OPTIONS.map(tag => {
            const isSelected = selectedTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-2 py-1 rounded-full text-xs transition ${
                  isSelected
                    ? `${tag.color} text-white`
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Content Input */}
        <textarea
          className="w-full bg-slate-950/80 text-slate-100 p-4 rounded-lg resize-none font-mono text-sm border border-slate-700 focus:border-emerald-500 focus:outline-none"
          placeholder="Paste agent response here...&#10;&#10;Tip: Content starting with 'feat:', 'fix:', 'docs:' will auto-tag."
          rows={6}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />

        {/* Save Button */}
        <button
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition flex items-center justify-center gap-2"
          onClick={() => handleSaveManualEntry(false)}
          disabled={isSaving || !manualInput.trim() || !agentName.trim()}
        >
          <Send className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save & Log Entry'}
        </button>
      </div>

      {/* Recent Entries */}
      <div className="flex-1 overflow-y-auto border-t border-slate-700 pt-4">
        <h3 className="text-lg mb-3 text-white font-medium">Recent Agent Exchanges</h3>

        <AnimatePresence>
          {manualEntries.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No entries yet. Paste your first agent response above.
            </div>
          ) : (
            <div className="space-y-3">
              {manualEntries.map((entry, i) => {
                const color = getAgentColor(entry.agent);
                const tagInfo = getTagInfo(entry.type || 'general');
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded border ${colorClasses[color]}`}>
                          {entry.agent}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${tagInfo.color} bg-opacity-10 text-white`}>
                          {tagInfo.label}
                        </span>
                        {entry.task && entry.task !== 'General' && (
                          <span className="text-xs text-slate-500">
                            → {entry.task}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-slate-300 font-mono leading-relaxed">
                      {entry.content.slice(0, 400)}
                      {entry.content.length > 400 && (
                        <span className="text-slate-500"> ... [truncated]</span>
                      )}
                    </pre>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
