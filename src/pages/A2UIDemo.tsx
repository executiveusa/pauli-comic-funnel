import React from 'react';
import { PauliCopilotKitProvider } from '@/integrations/copilotkit';
import { A2UIChat } from '@/integrations/a2ui';

/**
 * A2UI Demo Page for Pauli Effect Project
 *
 * This page demonstrates the integration of:
 * - CopilotKit: AI-powered chat and agentic interactions
 * - A2UI: Agent-to-User Interface generation
 *
 * Agents can dynamically generate UIs in response to user requests,
 * creating forms, visualizations, and interactive components on-the-fly.
 */
export default function A2UIDemo() {
  return (
    <div className="min-h-screen bg-slate-950">
      <PauliCopilotKitProvider>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              🪁 A2UI + CopilotKit Integration
            </h1>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Experience the power of agent-driven interfaces. Ask the AI to create
              forms, dashboards, visualizations, or any interactive component - watch
              as it generates secure, declarative UIs using Google's A2UI protocol.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FeatureCard
              icon="🔒"
              title="Security First"
              description="Declarative data format, not executable code. Only approved components can be rendered."
            />
            <FeatureCard
              icon="🎨"
              title="Framework Agnostic"
              description="Same A2UI JSON works across React, Flutter, Angular, and more."
            />
            <FeatureCard
              icon="🤖"
              title="LLM Friendly"
              description="Optimized format for AI agents to generate and update UIs incrementally."
            />
          </div>

          {/* Chat Interface */}
          <div className="bg-slate-900 rounded-lg shadow-2xl border border-slate-800 overflow-hidden">
            <div className="h-[600px]">
              <A2UIChat
                placeholder="Try: 'Create a contact form' or 'Build a dashboard widget'"
              />
            </div>
          </div>

          {/* Examples Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Try These Examples
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ExamplePrompt text="Create a user profile form" />
              <ExamplePrompt text="Build a temperature converter" />
              <ExamplePrompt text="Design a task management widget" />
              <ExamplePrompt text="Make a color picker interface" />
              <ExamplePrompt text="Create a data visualization dashboard" />
              <ExamplePrompt text="Build a feedback survey form" />
            </div>
          </div>

          {/* Documentation Links */}
          <div className="mt-12 p-6 bg-purple-950/30 border border-purple-800/50 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Learn More</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <a
                href="https://a2ui.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-purple-400 transition-colors"
              >
                <span>📚</span>
                <span>A2UI Documentation</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="https://github.com/google/A2UI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-purple-400 transition-colors"
              >
                <span>💻</span>
                <span>A2UI GitHub Repository</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="https://www.copilotkit.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-purple-400 transition-colors"
              >
                <span>🚀</span>
                <span>CopilotKit Website</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="https://github.com/CopilotKit/CopilotKit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-purple-400 transition-colors"
              >
                <span>⚡</span>
                <span>CopilotKit GitHub</span>
                <span className="text-slate-500">↗</span>
              </a>
            </div>
          </div>
        </div>
      </PauliCopilotKitProvider>
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-purple-600 transition-colors">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

// Example Prompt Component
interface ExamplePromptProps {
  text: string;
}

function ExamplePrompt({ text }: ExamplePromptProps) {
  return (
    <button
      onClick={() => {
        // This would trigger sending the prompt to the chat
        console.log('Example prompt clicked:', text);
      }}
      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-600 rounded-lg p-4 text-left text-slate-300 hover:text-white transition-all"
    >
      <span className="text-purple-400 mr-2">→</span>
      {text}
    </button>
  );
}
