import { useState, useEffect } from 'react';
import { ChevronRight, X, Copy } from 'lucide-react';

const agentCategories = [
  {
    icon: '💻',
    title: 'Code/Style',
    agents: [
      { name: 'Gemini Assist', prompt: 'Help with code completion and suggestions' },
      { name: 'Copilot', prompt: 'AI-powered code completion and generation' },
    ],
  },
  {
    icon: '🧠',
    title: 'Planning',
    agents: [
      { name: 'Mistral', prompt: 'Complex planning and reasoning tasks' },
    ],
  },
  {
    icon: '📋',
    title: 'Tasks',
    agents: [
      { name: 'ChatGPT', prompt: 'General task completion and Q&A' },
    ],
  },
  {
    icon: '⚡',
    title: 'Power',
    agents: [
      { name: 'Grok', prompt: 'High-performance tasks and optimization' },
    ],
  },
  {
    icon: '🎯',
    title: 'Orchestration',
    agents: [
      { name: 'Claude', prompt: 'Complex orchestration and project management' },
    ],
  },
];

export function QuickDecisionGuide({ isOpen, onToggle }) {
  const [copied, setCopied] = useState(null);

  const handleAgentClick = (agent) => {
    // Copy prompt to clipboard
    navigator.clipboard.writeText(agent.prompt);
    setCopied(agent.name);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-slate-800 text-slate-300 px-3 py-6 rounded-l-lg border border-slate-700 border-r-0 hover:bg-slate-700 transition hidden lg:block"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        Quick Guide
      </button>
    );
  }

  return (
    <>
      {/* Sidebar - hidden on mobile */}
      <aside className="fixed right-0 top-[57px] bottom-0 w-[220px] bg-slate-800/95 border-l border-slate-700 z-40 overflow-y-auto hidden lg:block">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Quick Guide</h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Agent Categories */}
        <div className="p-3 space-y-4">
          {agentCategories.map((category, idx) => (
            <div key={idx}>
              <h4 className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                <span>{category.icon}</span>
                <span>{category.title}</span>
              </h4>
              <div className="space-y-1">
                {category.agents.map((agent, agentIdx) => (
                  <button
                    key={agentIdx}
                    onClick={() => handleAgentClick(agent)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded transition group"
                  >
                    <span className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      <span>{agent.name}</span>
                    </span>
                    {copied === agent.name ? (
                      <span className="text-xs text-emerald-400">✓</span>
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700 bg-slate-800/80 backdrop-blur">
          <p className="text-xs text-slate-500">
            Click agent to copy prompt
          </p>
        </div>
      </aside>
    </>
  );
}
