import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Code2,
  Rocket,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Github,
  Lock,
  Unlock,
  DollarSign
} from 'lucide-react';

const AGENTS = [
  {
    id: 'mistral',
    name: 'Mistral Le Chat',
    icon: Brain,
    color: 'purple',
    tier: 'Free',
    hasGitHub: true,
    hasLocalRepo: false,
    strengths: ['Strategic Planning', 'Architecture Design', 'Code Review', 'Ideation'],
    bestFor: 'Planning complex features and reviewing architecture',
    context: 'Lots of conversation context - your ideation harbor',
    cost: '$0',
    daysRemaining: null,
    status: 'unlimited',
    usage: 'Use for strategic planning and architecture decisions'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: MessageSquare,
    color: 'green',
    tier: 'Free',
    hasGitHub: true,
    hasLocalRepo: false,
    strengths: ['Task Breakdown', 'Documentation', 'Explanations', 'Problem Solving'],
    bestFor: 'Breaking down complex tasks into steps',
    context: 'Good general knowledge, can read your GitHub repos',
    cost: '$0',
    daysRemaining: null,
    status: 'unlimited',
    usage: 'Use for task planning and documentation'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: Sparkles,
    color: 'blue',
    tier: 'Free',
    hasGitHub: true,
    hasLocalRepo: false,
    strengths: ['Alternative Perspectives', 'Code Analysis', 'Multi-modal', 'Research'],
    bestFor: 'Getting second opinions and alternative approaches',
    context: 'Can read GitHub repos and analyze code',
    cost: '$0',
    daysRemaining: null,
    status: 'unlimited',
    usage: 'Use for alternative perspectives and code review'
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: Rocket,
    color: 'orange',
    tier: 'Free (via X)',
    hasGitHub: false,
    hasLocalRepo: false,
    strengths: ['Raw Power', 'Specialized Analysis', 'Data Processing', 'Complex Logic'],
    bestFor: 'Intensive analysis when you can provide all context',
    context: 'Locked box - you must copy-paste everything',
    cost: '$0',
    daysRemaining: null,
    status: 'unlimited',
    usage: 'Use ONLY when you need raw analytical power on specific data',
    warning: 'Requires manual context - no repo access'
  },
  {
    id: 'gemini-code-assist',
    name: 'Gemini Code Assist',
    icon: Code2,
    color: 'cyan',
    tier: 'Free Trial',
    hasGitHub: false,
    hasLocalRepo: true,
    strengths: ['Code Completion', 'IDE Integration', 'Real-time Suggestions', 'Refactoring'],
    bestFor: 'Actually writing code in your IDE',
    context: 'Full access to your local repo and workspace',
    cost: '$0 (30 days free)',
    daysRemaining: 29,
    status: 'active',
    usage: '⚡ USE THIS FOR ALL CODING! Free for 30 days',
    highlight: true
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    icon: Zap,
    color: 'indigo',
    tier: 'Free Trial',
    hasGitHub: false,
    hasLocalRepo: true,
    strengths: ['Code Completion', 'IDE Integration', 'Multi-language', 'GitHub Trained'],
    bestFor: 'Backup code assistant when Gemini struggles',
    context: 'Full access to your local repo and workspace',
    cost: '$0 (30 days free)',
    daysRemaining: 30,
    status: 'active',
    usage: '⚡ USE THIS FOR ALL CODING! Free for 30 days',
    highlight: true
  },
  {
    id: 'claude',
    name: 'Claude (Me)',
    icon: Shield,
    color: 'teal',
    tier: 'Free',
    hasGitHub: false,
    hasLocalRepo: true,
    strengths: ['Orchestration', 'Teaching', 'Complex Tasks', 'Local Repo Access'],
    bestFor: 'Teaching you the system and handling complex orchestration',
    context: 'Full local repo access, delegation mode',
    cost: '$0',
    daysRemaining: null,
    status: 'unlimited',
    usage: 'Use for orchestration teaching and complex problems code assistants can\'t handle'
  }
];

const getColorClasses = (color) => {
  const colors = {
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      icon: 'text-purple-400'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-500/40',
      text: 'text-green-300',
      icon: 'text-green-400'
    },
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/40',
      text: 'text-blue-300',
      icon: 'text-blue-400'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-500/40',
      text: 'text-orange-300',
      icon: 'text-orange-400'
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-600/20',
      border: 'border-cyan-500/40',
      text: 'text-cyan-300',
      icon: 'text-cyan-400'
    },
    indigo: {
      bg: 'from-indigo-500/20 to-indigo-600/20',
      border: 'border-indigo-500/40',
      text: 'text-indigo-300',
      icon: 'text-indigo-400'
    },
    teal: {
      bg: 'from-teal-500/20 to-teal-600/20',
      border: 'border-teal-500/40',
      text: 'text-teal-300',
      icon: 'text-teal-400'
    }
  };
  return colors[color] || colors.blue;
};

export const AgentCapabilities = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const codeAssistants = AGENTS.filter(a => a.highlight);
  const planningAgents = AGENTS.filter(a => !a.highlight);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/40">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Agent Capabilities</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Your AI army - know what each agent can do and when to use them
        </p>
      </div>

      {/* Bougie Budget Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <DollarSign className="w-8 h-8 text-green-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-300 mb-2">Bougie Budget Strategy</h3>
            <p className="text-green-200/80 text-sm mb-4">
              Maximize free resources, minimize costs. You're running a lean, powerful operation.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white mb-1">7</div>
                <div className="text-xs text-slate-400">Free AI Agents</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-cyan-400 mb-1">2</div>
                <div className="text-xs text-slate-400">Active Code Assistants</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400 mb-1">$0</div>
                <div className="text-xs text-slate-400">Monthly Cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Assistants - Highlighted Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Code Assistants</h3>
          <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-300 font-medium">
            ⚡ USE THESE FOR ALL CODING
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {codeAssistants.map((agent) => {
            const colors = getColorClasses(agent.color);
            return (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-6 cursor-pointer ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <agent.icon className={`w-8 h-8 ${colors.icon}`} />
                    <div>
                      <h4 className={`text-lg font-bold ${colors.text}`}>{agent.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/60">{agent.tier}</span>
                        {agent.daysRemaining && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Calendar className="w-3 h-3" />
                            {agent.daysRemaining} days left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {agent.hasLocalRepo && (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-300 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        Local Repo
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-white/80 mb-3">{agent.bestFor}</p>
                <p className="text-xs text-white/60 mb-4 italic">{agent.context}</p>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-medium text-white/90 mb-2">Strengths:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.strengths.map((strength, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm font-medium text-white/90 bg-slate-900/70 rounded-lg p-3">
                  💡 {agent.usage}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Planning & Strategy Agents */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Planning & Strategy Agents</h3>
          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300 font-medium">
            Use for complex planning
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planningAgents.map((agent) => {
            const colors = getColorClasses(agent.color);
            return (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-6 cursor-pointer transition`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <agent.icon className={`w-7 h-7 ${colors.icon}`} />
                    <div>
                      <h4 className={`text-lg font-bold ${colors.text}`}>{agent.name}</h4>
                      <span className="text-xs text-white/60">{agent.tier}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {agent.hasGitHub ? (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-300 flex items-center gap-1">
                        <Github className="w-3 h-3" />
                        GitHub
                      </span>
                    ) : agent.hasLocalRepo ? (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-300 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        Local
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        No Repo
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-white/80 mb-3">{agent.bestFor}</p>
                <p className="text-xs text-white/60 mb-4 italic">{agent.context}</p>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-medium text-white/90 mb-2">Strengths:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.strengths.map((strength, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-white/90 bg-slate-900/70 rounded-lg p-3">
                  💡 {agent.usage}
                </div>

                {agent.warning && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                    <span>⚠️</span>
                    <span>{agent.warning}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Reference Guide */}
      <div className="mt-8 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Quick Decision Guide
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Simple code/styling:</span>
              <span className="text-slate-300"> → Gemini Code Assist or GitHub Copilot</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Feature planning:</span>
              <span className="text-slate-300"> → Mistral Le Chat (has GitHub access)</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Task breakdown:</span>
              <span className="text-slate-300"> → ChatGPT (good at steps)</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Alternative opinion:</span>
              <span className="text-slate-300"> → Gemini (different perspective)</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Complex analysis:</span>
              <span className="text-slate-300"> → Grok (but prepare full context)</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-white font-medium">Orchestration help:</span>
              <span className="text-slate-300"> → Claude/me (teaching mode)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
