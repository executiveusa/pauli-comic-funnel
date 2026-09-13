import Anthropic from '@anthropic-ai/sdk';
import { RTKHook } from '../hooks/rtk.js';
import { MCPIntegration } from '../mcp/integration.js';
import { FlywheelEngine } from '../flywheel/engine.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class AgentOrchestrator {
  private client: Anthropic;
  private conversationHistory: Map<string, Message[]> = new Map();
  private rtk: RTKHook;
  private mcp: MCPIntegration;
  private flywheel: FlywheelEngine;

  constructor(config: { rtk: RTKHook; mcp: MCPIntegration; flywheel: FlywheelEngine }) {
    this.client = new Anthropic();
    this.rtk = config.rtk;
    this.mcp = config.mcp;
    this.flywheel = config.flywheel;
  }

  async processMessage(message: string, userId: string) {
    const history = this.conversationHistory.get(userId) || [];
    history.push({ role: 'user', content: message });

    try {
      // RTK optimization: filter command if present
      const optimizedInput = await this.rtk.filterInput(message);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: `You are PAULI, an autonomous agent with access to all user data and GitHub projects.
You can:
- Browse projects and understand their status
- Execute plans automatically via GitHub API
- Learn from past executions
- Suggest improvements

When user asks about a project, search your knowledge base and provide actionable insights.
When user approves a plan, create an executable manifest and prepare for execution.`,
        messages: history as any
      });

      const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
      history.push({ role: 'assistant', content: assistantMessage });
      this.conversationHistory.set(userId, history);

      return {
        message: assistantMessage,
        tokens_saved: await this.rtk.getTokensSaved(),
        suggestions: this.extractSuggestions(assistantMessage)
      };
    } catch (error) {
      throw new Error(`Agent processing failed: ${error}`);
    }
  }

  async *streamMessage(message: string, userId: string) {
    const history = this.conversationHistory.get(userId) || [];
    history.push({ role: 'user', content: message });

    const stream = await this.client.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: `You are PAULI, operating in streaming mode.
Provide real-time responses as you think through problems.
Use MCP tools (GitHub, filesystem) when needed.`,
      messages: history as any
    });

    let fullContent = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
        fullContent += chunk.delta.text;
      }
    }

    history.push({ role: 'assistant', content: fullContent });
    this.conversationHistory.set(userId, history);
  }

  async listProjects() {
    return this.mcp.listGitHubProjects();
  }

  private extractSuggestions(text: string): string[] {
    const lines = text.split('\n');
    return lines
      .filter(line => line.includes('→') || line.includes('→'))
      .map(line => line.trim())
      .slice(0, 3);
  }

  clearHistory(userId: string) {
    this.conversationHistory.delete(userId);
  }
}
