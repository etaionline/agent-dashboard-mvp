/**
 * DONT PANIC Error Boundary — Agent Dashboard MVP
 * Shows large Hitchhiker-style "DONT PANIC" with the actual error in small print below.
 */
import React from 'react';

export default class DontPanicErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[DONT PANIC] Error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-8">
          <div className="text-center">
            <div className="text-6xl md:text-8xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                DONT PANIC
              </span>
            </div>
            <p className="mt-6 text-slate-400 max-w-xl mx-auto">
              Something went wrong. Keep calm and carry on.
            </p>
            <div className="mt-8 bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-left">
              <div className="text-xs text-slate-400">
                {this.state.error?.message || String(this.state.error)}
              </div>
              {this.state.info?.componentStack && (
                <pre className="mt-2 text-[10px] leading-snug text-slate-500 whitespace-pre-wrap">
                  {this.state.info.componentStack}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
