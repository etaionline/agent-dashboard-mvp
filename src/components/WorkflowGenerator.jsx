import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks,
  Copy,
  CheckCircle2,
  Circle,
  ArrowRight,
  Brain,
  Code2,
  User,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

export const WorkflowGenerator = () => {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [copiedStep, setCopiedStep] = useState(null);

  // Pre-defined workflow templates
  const templates = [
    {
      id: 'high-complexity',
      name: 'High Complexity Feature',
      description: 'For complex features requiring planning then implementation',
      steps: [
        {
          agent: 'Mistral Le Chat',
          action: 'Strategic Planning',
          instruction: 'Open Mistral Le Chat and paste:',
          prompt: 'Review the agent-dashboard-mvp repository on GitHub and provide an architecture plan for:\n\n[DESCRIBE YOUR FEATURE]\n\nInclude:\n- Recommended approach\n- Files to modify/create\n- Potential challenges\n- Implementation steps',
          completed: false
        },
        {
          agent: 'You',
          action: 'Review & Log Plan',
          instruction: 'Read Mistral\'s response and paste it into Manual Agent Drop Zone',
          prompt: null,
          completed: false
        },
        {
          agent: 'Gemini Code Assist',
          action: 'Implementation',
          instruction: 'Open your IDE and type:',
          prompt: '// Task: [YOUR FEATURE]\n// [Paste key points from Mistral\'s plan]\n// Let Code Assist autocomplete the implementation',
          completed: false
        },
        {
          agent: 'You',
          action: 'Test & Log Results',
          instruction: 'Test the implementation, then paste results into Manual Agent Drop Zone',
          prompt: null,
          completed: false
        }
      ]
    },
    {
      id: 'medium-complexity',
      name: 'Medium Complexity Feature',
      description: 'For straightforward features code assistants can handle',
      steps: [
        {
          agent: 'Gemini Code Assist',
          action: 'Direct Implementation',
          instruction: 'Open your IDE and type:',
          prompt: '// Task: [DESCRIBE YOUR FEATURE]\n// Let Code Assist autocomplete',
          completed: false
        },
        {
          agent: 'You',
          action: 'Test & Log',
          instruction: 'Test the implementation, then paste results into Manual Agent Drop Zone',
          prompt: null,
          completed: false
        }
      ]
    },
    {
      id: 'style-change',
      name: 'Quick Style/UI Change',
      description: 'For simple styling or UI tweaks',
      steps: [
        {
          agent: 'Gemini Code Assist',
          action: 'Quick Implementation',
          instruction: 'Open your IDE and let autocomplete do the work:',
          prompt: '// [DESCRIBE STYLE CHANGE]',
          completed: false
        },
        {
          agent: 'You',
          action: 'Verify',
          instruction: 'Check it looks good - no logging needed for simple styles',
          prompt: null,
          completed: false
        }
      ]
    },
    {
      id: 'grok-analysis',
      name: 'Grok Power Analysis',
      description: 'When you need intensive analysis on specific data',
      steps: [
        {
          agent: 'You',
          action: 'Prepare Context',
          instruction: 'Gather all relevant files/data that Grok needs to see',
          prompt: null,
          completed: false
        },
        {
          agent: 'Grok',
          action: 'Analysis',
          instruction: 'Paste into Grok with full context:',
          prompt: 'Here\'s my project context:\n\n[PASTE RELEVANT FILES/CODE]\n\nTask: [YOUR ANALYSIS REQUEST]\n\nProvide detailed analysis and recommendations.',
          completed: false
        },
        {
          agent: 'You',
          action: 'Log Results',
          instruction: 'Paste Grok\'s analysis into Manual Agent Drop Zone',
          prompt: null,
          completed: false
        }
      ]
    },
    {
      id: 'multi-agent',
      name: 'Multi-Agent Collaboration',
      description: 'When you need multiple perspectives',
      steps: [
        {
          agent: 'Mistral Le Chat',
          action: 'Initial Plan',
          instruction: 'Ask Mistral for architectural approach:',
          prompt: 'Review agent-dashboard-mvp on GitHub and suggest architecture for:\n\n[YOUR FEATURE]',
          completed: false
        },
        {
          agent: 'ChatGPT',
          action: 'Alternative Opinion',
          instruction: 'Ask ChatGPT for alternative approach:',
          prompt: 'Review agent-dashboard-mvp on GitHub and provide an alternative approach to:\n\n[YOUR FEATURE]\n\nI already got one plan, looking for different perspective.',
          completed: false
        },
        {
          agent: 'You',
          action: 'Compare & Decide',
          instruction: 'Review both plans and choose the best approach, log your decision',
          prompt: null,
          completed: false
        },
        {
          agent: 'Gemini Code Assist',
          action: 'Implementation',
          instruction: 'Implement chosen approach in your IDE',
          prompt: '// Task: [YOUR FEATURE]\n// Approach: [CHOSEN PLAN]\n// Let Code Assist implement',
          completed: false
        },
        {
          agent: 'You',
          action: 'Test & Log',
          instruction: 'Test and log final results',
          prompt: null,
          completed: false
        }
      ]
    }
  ];

  const createWorkflowFromTemplate = (template) => {
    const newWorkflow = {
      id: Date.now(),
      name: template.name,
      description: template.description,
      steps: template.steps.map((step, idx) => ({ ...step, id: idx })),
      createdAt: new Date().toISOString()
    };
    setWorkflows([...workflows, newWorkflow]);
    setActiveWorkflow(newWorkflow.id);
  };

  const toggleStepComplete = (workflowId, stepId) => {
    setWorkflows(workflows.map(workflow => {
      if (workflow.id === workflowId) {
        return {
          ...workflow,
          steps: workflow.steps.map(step =>
            step.id === stepId ? { ...step, completed: !step.completed } : step
          )
        };
      }
      return workflow;
    }));
  };

  const deleteWorkflow = (workflowId) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    if (activeWorkflow === workflowId) {
      setActiveWorkflow(null);
    }
  };

  const copyToClipboard = (text, stepId) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const getAgentIcon = (agentName) => {
    if (agentName.includes('Mistral')) return Brain;
    if (agentName.includes('Code Assist') || agentName.includes('Copilot')) return Code2;
    if (agentName.includes('ChatGPT')) return Sparkles;
    if (agentName.includes('You')) return User;
    return Circle;
  };

  const activeWorkflowData = workflows.find(w => w.id === activeWorkflow);
  const completedSteps = activeWorkflowData?.steps.filter(s => s.completed).length || 0;
  const totalSteps = activeWorkflowData?.steps.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg border border-blue-500/40">
            <ListChecks className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Workflow Generator</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Pre-built workflows so you never forget a step. Track progress as you go.
        </p>
      </div>

      {/* Workflow Templates */}
      {workflows.length === 0 ? (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Choose a Workflow Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => createWorkflowFromTemplate(template)}
                className="bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 cursor-pointer transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Plus className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{template.name}</h4>
                    <p className="text-xs text-slate-400">{template.description}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {template.steps.length} steps
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Workflows */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Active Workflows</h3>
              <button
                onClick={() => setActiveWorkflow(null)}
                className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg text-sm hover:bg-cyan-500/30 transition"
              >
                + New Workflow
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {workflows.map((workflow) => {
                const completed = workflow.steps.filter(s => s.completed).length;
                const total = workflow.steps.length;
                const workflowProgress = (completed / total) * 100;

                return (
                  <motion.div
                    key={workflow.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveWorkflow(workflow.id)}
                    className={`relative bg-slate-800/50 border rounded-lg p-4 cursor-pointer transition ${
                      activeWorkflow === workflow.id
                        ? 'border-cyan-500/50 ring-2 ring-cyan-500/30'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(workflow.id);
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <h4 className="font-bold text-white mb-2 pr-8">{workflow.name}</h4>
                    <p className="text-xs text-slate-400 mb-3">{workflow.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span>{completed}/{total} steps</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${workflowProgress}%` }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* No workflow selected */}
          {!activeWorkflowData && (
            <div className="text-center py-12">
              <div className="text-slate-500 mb-4">Select a workflow above or create a new one</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createWorkflowFromTemplate(template)}
                    className="bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 cursor-pointer transition"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Plus className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-white mb-1">{template.name}</h4>
                        <p className="text-xs text-slate-400">{template.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {template.steps.length} steps
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Active Workflow Details */}
          {activeWorkflowData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-lg border border-slate-700 p-6"
            >
              {/* Workflow Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-white">{activeWorkflowData.name}</h3>
                  <div className="text-sm text-slate-400">
                    {completedSteps}/{totalSteps} completed
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
                <p className="text-sm text-slate-400">{activeWorkflowData.description}</p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {activeWorkflowData.steps.map((step, index) => {
                  const AgentIcon = getAgentIcon(step.agent);
                  const isCompleted = step.completed;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-slate-900/50 border rounded-lg p-5 ${
                        isCompleted
                          ? 'border-green-500/40 opacity-60'
                          : 'border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Step Number & Checkbox */}
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleStepComplete(activeWorkflowData.id, step.id)}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-green-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-500 hover:text-cyan-400 transition" />
                            )}
                          </button>
                          <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center justify-center text-cyan-300 font-bold text-sm">
                            {index + 1}
                          </div>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <AgentIcon className="w-5 h-5 text-cyan-400" />
                            <span className="text-white font-bold">{step.agent}</span>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                            <span className="text-cyan-300">{step.action}</span>
                          </div>

                          <p className="text-slate-300 text-sm mb-3">{step.instruction}</p>

                          {step.prompt && (
                            <div className="relative">
                              <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                {step.prompt}
                              </pre>
                              <button
                                onClick={() => copyToClipboard(step.prompt, step.id)}
                                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition"
                              >
                                {copiedStep === step.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Completion Message */}
              {progress === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-300 font-medium">Workflow Complete!</p>
                      <p className="text-green-200/80 text-sm">
                        Great job following the process. Ready for the next task?
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};
