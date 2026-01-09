import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Book, FileText, GitBranch, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Documentation Viewer Content
 *
 * Your cognitive scaffold - view all project documentation in one place.
 * Auto-refreshes when files change. Now designed to work inside FloatingWindow wrapper.
 *
 * Agent: CLAUDE-4.5
 * Created: 2026-01-09
 * Updated: 2026-01-09 (Refactored for FloatingWindow)
 */

const DOCS = [
  { id: 'readme', label: 'README', icon: Book, file: 'README.md' },
  { id: 'guide', label: 'PROJECT_GUIDE', icon: FileText, file: 'PROJECT_GUIDE.md' },
  { id: 'getting-started', label: 'Getting Started', icon: FileText, file: 'GETTING_STARTED.md' },
  { id: 'log', label: 'Agent Log', icon: GitBranch, file: 'agent-conversation.log' },
  { id: 'changelog', label: 'Change Log', icon: GitBranch, file: 'change_log.txt' },
];

export const DocumentationViewer = () => {
  const [activeTab, setActiveTab] = useState('readme');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load document content
  const loadDocument = async (filename) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/docs/${filename}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || 'Document is empty');
        setLastUpdated(new Date());
      } else {
        setContent(`⚠️ Document not found: ${filename}\n\nThis file may not exist yet in your project.`);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setContent('❌ Failed to load document. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  // Load active document on tab change
  useEffect(() => {
    const doc = DOCS.find(d => d.id === activeTab);
    if (doc) {
      loadDocument(doc.file);
    }
  }, [activeTab]);

  // Auto-refresh on WebSocket events
  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectSocket = () => {
      try {
        socket = io('http://localhost:3001', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socket.on('connect', () => {
          console.log('[DOCS] Connected to backend');
        });

        socket.on('disconnect', () => {
          console.log('[DOCS] Disconnected from backend');
        });

        // Listen for file updates from painting-estimator
        socket.on('file-update', (data) => {
          console.log('[DOCS] File update received:', data.file);
          const currentDoc = DOCS.find(d => d.id === activeTab);
          if (currentDoc && data.file === currentDoc.file) {
            // Refresh current document
            loadDocument(currentDoc.file);
          }
        });
      } catch (err) {
        console.warn('[DOCS] Socket connection failed:', err.message);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [activeTab]);

  // Filter content by search term
  const filteredContent = searchTerm
    ? content.split('\n').filter(line =>
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : content;

  const activeDoc = DOCS.find(d => d.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/30">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => loadDocument(activeDoc.file)}
          className="text-slate-400 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-slate-700 bg-slate-900/20">
        {DOCS.map(doc => {
          const Icon = doc.icon;
          const isActive = activeTab === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveTab(doc.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{doc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/20 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search in document..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950/50 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading document...
            </div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeDoc.file.endsWith('.md') ? (
              <div className="prose prose-invert prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom styling for markdown elements
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 border-b border-slate-700 pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mb-3 mt-6" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-white mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-300 mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside text-slate-300 mb-3 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside text-slate-300 mb-3 space-y-1" {...props} />,
                    code: ({node, inline, ...props}) => inline
                      ? <code className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-sm font-mono" {...props} />
                      : <code className="block bg-slate-900 text-emerald-300 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-3" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-slate-900 rounded-lg overflow-x-auto mb-3" {...props} />,
                    a: ({node, ...props}) => <a className="text-cyan-400 hover:text-cyan-300 underline" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-400 mb-3" {...props} />,
                  }}
                >
                  {filteredContent}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {filteredContent}
              </pre>
            )}

            {searchTerm && filteredContent === '' && (
              <div className="text-center text-slate-500 py-8">
                No matches found for "{searchTerm}"
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-950/30 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Viewing: <span className="text-slate-400 font-mono">{activeDoc.file}</span>
        </span>
        {searchTerm && (
          <span className="text-cyan-400">
            Filtering results...
          </span>
        )}
      </div>
    </div>
  );
};
