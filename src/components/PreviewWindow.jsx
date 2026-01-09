import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Live Preview Window
 *
 * Shows live preview of painting-estimator (or other projects) running.
 * Completes the "Mission Control" vision: see and direct from one place.
 *
 * Agent: CLAUDE-4.5
 * Created: 2026-01-09
 */

const PREVIEW_PROJECTS = [
  {
    id: 'painting-estimator',
    name: 'Painting Estimator',
    url: 'http://localhost:5174', // Assuming painting-estimator runs on 5174
    description: 'Professional painting cost calculator'
  },
  {
    id: 'painting-estimator-netlify',
    name: 'Painting Estimator (Production)',
    url: 'https://painting-estimator.netlify.app',
    description: 'Live production site'
  }
];

export const PreviewWindow = () => {
  const [activeProject, setActiveProject] = useState(PREVIEW_PROJECTS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const refreshPreview = () => {
    setIsLoading(true);
    setLoadError(false);
    // Force iframe reload
    const iframe = document.getElementById('preview-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const openInNewTab = () => {
    window.open(activeProject.url, '_blank');
  };

  return (
    <div className={`bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700 flex flex-col ${
      isFullscreen ? 'fixed inset-4 z-50' : 'h-[70vh]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Live Preview</h2>
            <p className="text-xs text-slate-400">{activeProject.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <select
            value={activeProject.id}
            onChange={(e) => {
              const project = PREVIEW_PROJECTS.find(p => p.id === e.target.value);
              if (project) {
                setActiveProject(project);
                setIsLoading(true);
                setLoadError(false);
              }
            }}
            className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            {PREVIEW_PROJECTS.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Controls */}
          <button
            onClick={refreshPreview}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
            title="Refresh preview"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openInNewTab}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative bg-slate-950/50">
        {isLoading && !loadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10"
          >
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-300">Loading preview...</p>
            </div>
          </motion.div>
        )}

        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Preview Unavailable</h3>
              <p className="text-slate-400 mb-4">
                Unable to load preview. The app might not be running locally.
              </p>
              <div className="space-y-2 text-sm text-slate-500 mb-4">
                <p>Current URL: <code className="text-cyan-400">{activeProject.url}</code></p>
                <p>Make sure the project is running on this port.</p>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={refreshPreview}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
                >
                  Try Again
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Open Directly
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            id="preview-iframe"
            src={activeProject.url}
            className="w-full h-full border-0 rounded-b-xl"
            title={`Preview: ${activeProject.name}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-950/30 rounded-b-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Previewing: <span className="text-slate-400 font-mono">{activeProject.url}</span>
          </span>
          <span className="text-slate-500">
            {isLoading ? (
              <span className="text-cyan-400">Loading...</span>
            ) : loadError ? (
              <span className="text-amber-400">Connection failed</span>
            ) : (
              <span className="text-emerald-400">● Live</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
