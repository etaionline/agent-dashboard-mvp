import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Code2,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock
} from 'lucide-react';

// Task complexity analyzer
const analyzeTask = (taskDescription) => {
  const task = taskDescription.toLowerCase();

  // High complexity keywords
  const highComplexity = [
    'architecture', 'refactor', 'optimize', 'database', 'security',
    'authentication', 'api design', 'scalability', 'migration', 'system design'
  ];

  // Medium complexity keywords
  const mediumComplexity = [
    'feature', 'component', 'integration', 'workflow', 'logic',
    'state management', 'routing', 'form', 'validation'
  ];

  // Low complexity keywords
  const lowComplexity = [
    'style', 'css', 'color', 'button', 'text', 'layout', 'spacing',
    'dark mode', 'theme', 'icon', 'margin', 'padding'
  ];

  // Check complexity
  const isHigh = highComplexity.some(keyword => task.includes(keyword));
  const isMedium = mediumComplexity.some(keyword => task.includes(keyword));
  const isLow = lowComplexity.some(keyword => task.includes(keyword));

  if (isHigh) return 'HIGH';
  if (isMedium) return 'MEDIUM';
  if (isLow) return 'LOW';
  return 'MEDIUM'; // default
};

// Recommend best agent based on task complexity
const recommendAgent = (complexity, taskDescription) => {
  const task = taskDescription.toLowerCase();

  switch(complexity) {
    case 'HIGH':
      // High complexity: Use Mistral for planning, then code assistants
      return {
        primary: {
          name: 'Mistral Le Chat',
          icon: Brain,
          reason: 'Strategic planning needed - Mistral has GitHub access and lots of context',
          color: 'purple',
          hasGitHub: true
        },
        secondary: {
          name: 'Gemini Code Assist',
          icon: Code2,
          reason: 'After Mistral provides the plan, use Code Assist to implement',
          color: 'blue',
          hasGitHub: false
        },
        backup: {
          name: 'ChatGPT',
          icon: Sparkles,
          reason: 'Alternative planner with GitHub access',
          color: 'green',
          hasGitHub: true
        },
        dontUse: ['GitHub Copilot alone', 'Grok (needs too much context)']
      };

    case 'MEDIUM':
      // Medium: Code assistants can handle with light guidance
      return {
        primary: {
          name: 'Gemini Code Assist',
          icon: Code2,
          reason: 'Perfect for feature implementation in your IDE',
          color: 'blue',
          hasGitHub: false
        },
        secondary: {
          name: 'GitHub Copilot',
          icon: Zap,
          reason: 'Backup code assistant if Gemini struggles',
          color: 'cyan',
          hasGitHub: false
        },
        backup: {
          name: 'Mistral Le Chat',
          icon: Brain,
          reason: 'If you need architecture advice first',
          color: 'purple',
          hasGitHub: true
        },
        dontUse: ['Claude (overkill)', 'Grok (overkill)']
      };

    case 'LOW':
      // Low: Code assistants only
      return {
        primary: {
          name: 'Gemini Code Assist',
          icon: Code2,
          reason: 'Simple styling/UI - let autocomplete do the work',
          color: 'blue',
          hasGitHub: false
        },
        secondary: {
          name: 'GitHub Copilot',
          icon: Zap,
          reason: 'Alternative autocomplete',
          color: 'cyan',
          hasGitHub: false
        },
        backup: null,
        dontUse: ['Mistral (too simple)', 'ChatGPT (too simple)', 'Claude (too simple)', 'Grok (way overkill)']
      };

    default:
      return recommendAgent('MEDIUM', taskDescription);
  }
};

// Generate workflow steps
const generateWorkflow = (complexity, recommendation, taskDescription) => {
  const steps = [];

  if (complexity === 'HIGH') {
    steps.push({
      number: 1,
      agent: recommendation.primary.name,
      action: 'Strategic Planning',
      instruction: `Open Mistral Le Chat and paste this prompt:`,
      prompt: `Review the agent-dashboard-mvp repository on GitHub and provide an architecture plan for:\n\n"${taskDescription}"\n\nInclude:\n- Recommended approach\n- Files to modify/create\n- Potential challenges\n- Implementation steps`,
      needsCopy: true
    });

    steps.push({
      number: 2,
      agent: 'You',
      action: 'Review Plan',
      instruction: 'Read Mistral\'s plan and paste the response into the Manual Agent Drop Zone',
      prompt: null,
      needsCopy: false
    });

    steps.push({
      number: 3,
      agent: recommendation.secondary.name,
      action: 'Implementation',
      instruction: 'Open your IDE and use Code Assist. Type a comment with the plan:',
      prompt: `// Task: ${taskDescription}\n// [Paste key points from Mistral's plan]\n// Let Code Assist autocomplete the implementation`,
      needsCopy: true
    });

    steps.push({
      number: 4,
      agent: 'You',
      action: 'Test & Log',
      instruction: 'Test the implementation, then paste results into Manual Agent Drop Zone',
      prompt: null,
      needsCopy: false
    });
  } else if (complexity === 'MEDIUM') {
    steps.push({
      number: 1,
      agent: recommendation.primary.name,
      action: 'Direct Implementation',
      instruction: 'Open your IDE and use Code Assist. Type a comment:',
      prompt: `// Task: ${taskDescription}\n// [Let Code Assist autocomplete]`,
      needsCopy: true
    });

    steps.push({
      number: 2,
      agent: 'You',
      action: 'Test & Log',
      instruction: 'Test the implementation, then paste results into Manual Agent Drop Zone',
      prompt: null,
      needsCopy: false
    });
  } else {
    // LOW complexity
    steps.push({
      number: 1,
      agent: recommendation.primary.name,
      action: 'Quick Implementation',
      instruction: 'Open your IDE and let autocomplete do the work:',
      prompt: `// ${taskDescription}`,
      needsCopy: true
    });

    steps.push({
      number: 2,
      agent: 'You',
      action: 'Verify',
      instruction: 'Check it looks good - no need to log simple style changes',
      prompt: null,
      needsCopy: false
    });
  }

  return steps;
};

export const TaskRouter = () => {
  const [taskInput, setTaskInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleAnalyze = () => {
    if (!taskInput.trim()) return;

    const complexity = analyzeTask(taskInput);
    const recommendation = recommendAgent(complexity, taskInput);
    const workflow = generateWorkflow(complexity, recommendation, taskInput);

    setAnalysis({
      task: taskInput,
      complexity,
      recommendation,
      workflow
    });
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getComplexityColor = (complexity) => {
    switch(complexity) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'slate';
    }
  };

  const getAgentColor = (color) => {
    const colors = {
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/40 text-purple-300',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/40 text-blue-300',
      green: 'from-green-500/20 to-green-600/20 border-green-500/40 text-green-300',
      cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/40 text-cyan-300'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/40">
            <Brain className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Task Router</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Tell me what you want to build, and I'll tell you exactly which AI agent should do it
        </p>
      </div>

      {/* Task Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          What do you want to build?
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="e.g., Add dark mode toggle, Optimize database queries, Fix button styling..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <motion.button
            onClick={handleAnalyze}
            disabled={!taskInput.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Task
          </motion.button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Complexity Badge */}
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Task Complexity:</span>
            <div className={`px-4 py-2 rounded-lg border ${
              analysis.complexity === 'HIGH'
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : analysis.complexity === 'MEDIUM'
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                : 'bg-green-500/20 border-green-500/40 text-green-300'
            }`}>
              <span className="font-bold">{analysis.complexity}</span>
            </div>
          </div>

          {/* Agent Recommendations */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Recommended Agents
            </h3>

            <div className="space-y-4">
              {/* Primary Agent */}
              <div className={`bg-gradient-to-r ${getAgentColor(analysis.recommendation.primary.color)} rounded-lg border p-4`}>
                <div className="flex items-start gap-3">
                  <analysis.recommendation.primary.icon className="w-6 h-6 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{analysis.recommendation.primary.name}</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">PRIMARY</span>
                      {analysis.recommendation.primary.hasGitHub && (
                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-300">
                          Has GitHub Access
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-90">{analysis.recommendation.primary.reason}</p>
                  </div>
                </div>
              </div>

              {/* Secondary Agent */}
              <div className={`bg-gradient-to-r ${getAgentColor(analysis.recommendation.secondary.color)} rounded-lg border p-4 opacity-80`}>
                <div className="flex items-start gap-3">
                  <analysis.recommendation.secondary.icon className="w-5 h-5 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{analysis.recommendation.secondary.name}</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">SECONDARY</span>
                    </div>
                    <p className="text-sm opacity-90">{analysis.recommendation.secondary.reason}</p>
                  </div>
                </div>
              </div>

              {/* Backup Agent */}
              {analysis.recommendation.backup && (
                <div className={`bg-gradient-to-r ${getAgentColor(analysis.recommendation.backup.color)} rounded-lg border p-3 opacity-60`}>
                  <div className="flex items-start gap-3">
                    <analysis.recommendation.backup.icon className="w-5 h-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{analysis.recommendation.backup.name}</span>
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs">BACKUP</span>
                      </div>
                      <p className="text-xs opacity-90">{analysis.recommendation.backup.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Don't Use */}
              {analysis.recommendation.dontUse.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-slate-500">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <span className="font-medium">Don't waste on: </span>
                    {analysis.recommendation.dontUse.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Step-by-Step Workflow
            </h3>

            <div className="space-y-4">
              {analysis.workflow.map((step, index) => (
                <div key={index} className="bg-slate-900/50 rounded-lg border border-slate-600 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center justify-center text-cyan-300 font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-white font-bold">{step.agent}</span>
                        <span className="text-slate-400 mx-2">→</span>
                        <span className="text-cyan-300">{step.action}</span>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">{step.instruction}</p>

                      {step.prompt && (
                        <div className="relative">
                          <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 overflow-x-auto">
                            {step.prompt}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(step.prompt, index)}
                            className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition"
                          >
                            {copiedIndex === index ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free Resources Reminder */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium mb-1">Bougie Budget Reminder</p>
                <p className="text-green-200/80 text-sm">
                  Gemini Code Assist (30 days free) + GitHub Copilot (30 days free) = Use these for ALL coding!
                  Save premium AIs for planning and complex problems.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
