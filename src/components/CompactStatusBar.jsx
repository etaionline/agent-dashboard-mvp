import { useState, useEffect } from 'react';

export function CompactStatusBar({ stats, connected, loadingStats }) {
  return (
    <div className="w-full h-10 bg-slate-800/30 border-b border-slate-700/50 flex items-center px-6 text-sm text-slate-300">
      {loadingStats ? (
        <span className="text-slate-500">Loading stats...</span>
      ) : (
        <>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">🤖</span>
            <span>{stats.activeAgents} Agents</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-purple-400">👥</span>
            <span>2 Active Assistants</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">💰</span>
            <span>$0 Cost</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">📦</span>
            <span>{stats.components} Components</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-blue-400">📝</span>
            <span>{stats.gitCommits} Commits</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">📋</span>
            <span>{stats.logEntries} Log Entries</span>
          </span>
          <span className="mx-3 text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className={connected ? 'text-emerald-400' : 'text-slate-500'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
