/**
 * PAULI-PRIME: Master Orchestrator & Decision Engine
 *
 * Purpose: Central coordination agent for THE PAULI EFFECT autonomous system
 * Framework: PASS (Problem-Amplification-Solution-System)
 * Model: claude-sonnet-4-5-20250929
 * Authority: SUPREME
 *
 * Created: 2025-12-30
 * Author: Claude Code (Builder Agent)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';
import { PASSFramework } from './pass-framework';
import { SkillRouter } from './skill-router';
import { ApprovalGates } from './approval-gates';

export interface CommandInput {
  command: string;
  source: 'voice' | 'text' | 'scheduled';
  user_context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  skill_used?: string;
  output: any;
  execution_id: string;
  approval_required: boolean;
  error?: string;
}

export class PAULIPrime {
  private supabase: ReturnType<typeof createClient<Database>>;
  private pass: PASSFramework;
  private router: SkillRouter;
  private approvalGates: ApprovalGates;
  private agentId = 'PAULI-PRIME';

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );

    this.pass = new PASSFramework(this.supabase);
    this.router = new SkillRouter(this.supabase);
    this.approvalGates = new ApprovalGates();

    this.logAgentStartup();
  }

  /**
   * Main entry point for all commands
   */
  async processCommand(input: CommandInput): Promise<ExecutionResult> {
    const executionId = await this.createExecution(input);

    try {
      // STEP 1: PROBLEM - Understand the user's request
      const problem = await this.pass.analyzeProblem(input.command);
      console.log(`[PAULI-PRIME] Problem analyzed:`, problem);

      // STEP 2: AMPLIFICATION - Gather context
      const context = await this.pass.amplifyContext(problem, input.user_context);
      console.log(`[PAULI-PRIME] Context gathered:`, context);

      // STEP 3: SOLUTION - Identify which skill(s) to use
      const solution = await this.pass.identifySolution(problem, context);
      console.log(`[PAULI-PRIME] Solution identified:`, solution);

      // STEP 4: Check approval gates
      const approvalCheck = await this.approvalGates.checkApproval(solution);

      if (approvalCheck.requiresApproval && !approvalCheck.autoApproved) {
        // Mark execution as pending approval
        await this.updateExecution(executionId, {
          status: 'in_progress',
          output_result: {
            status: 'awaiting_approval',
            solution,
            approvalCheck
          }
        });

        return {
          success: false,
          skill_used: solution.skillId,
          output: {
            message: 'Approval required before execution',
            solution,
            approvalReason: approvalCheck.reason
          },
          execution_id: executionId,
          approval_required: true
        };
      }

      // STEP 5: SYSTEM - Execute via Skill Orchestrator
      const result = await this.router.routeToSkill(solution.skillId, {
        command: input.command,
        problem,
        context,
        solution
      });

      // Update execution with results
      await this.updateExecution(executionId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        success: true,
        output_result: result,
        skill_id: solution.skillId
      });

      return {
        success: true,
        skill_used: solution.skillId,
        output: result,
        execution_id: executionId,
        approval_required: false
      };

    } catch (error) {
      console.error(`[PAULI-PRIME] Execution failed:`, error);

      await this.updateExecution(executionId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        success: false,
        error_message: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        output: null,
        execution_id: executionId,
        approval_required: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create execution record in database
   */
  private async createExecution(input: CommandInput): Promise<string> {
    const { data, error } = await this.supabase
      .from('agent_executions')
      .insert({
        agent_id: this.agentId,
        command: input.command,
        status: 'started',
        input_context: input.user_context || {},
        metadata: {
          source: input.source,
          ...input.metadata
        }
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Update execution record
   */
  private async updateExecution(
    executionId: string,
    updates: Partial<Database['public']['Tables']['agent_executions']['Update']>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('agent_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) throw error;
  }

  /**
   * Log agent startup to database
   */
  private async logAgentStartup(): Promise<void> {
    const { error } = await this.supabase
      .from('agents')
      .upsert({
        agent_id: this.agentId,
        name: 'PAULI-PRIME',
        role: 'Master Orchestrator & Decision Engine',
        model: 'claude-sonnet-4-5-20250929',
        agent_type: 'orchestrator',
        status: 'active',
        capabilities: [
          'command_processing',
          'skill_routing',
          'approval_management',
          'context_gathering',
          'decision_making'
        ],
        tools: [
          'supabase',
          'notion_search',
          'google_drive_search',
          'conversation_search',
          'bash_tool'
        ]
      });

    if (error) {
      console.error('[PAULI-PRIME] Failed to log startup:', error);
    } else {
      console.log('[PAULI-PRIME] Agent started successfully');
    }
  }

  /**
   * Query Second Brain for context
   */
  private async querySecondBrain(query: string): Promise<any> {
    // TODO: Implement when Second Brain pipeline is ready
    console.log(`[PAULI-PRIME] Second Brain query: ${query} (NOT IMPLEMENTED YET)`);
    return null;
  }

  /**
   * Query Notion for current state
   */
  private async queryNotion(query: string): Promise<any> {
    // TODO: Implement when Notion sync is ready
    console.log(`[PAULI-PRIME] Notion query: ${query} (NOT IMPLEMENTED YET)`);
    return null;
  }

  /**
   * Get agent performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    const { data, error } = await this.supabase
      .from('agent_executions')
      .select('*')
      .eq('agent_id', this.agentId);

    if (error) throw error;

    const total = data.length;
    const successful = data.filter(ex => ex.success).length;
    const failed = data.filter(ex => !ex.success).length;
    const avgExecutionTime = data
      .filter(ex => ex.execution_time)
      .reduce((sum, ex) => sum + (ex.execution_time || 0), 0) / data.length || 0;

    return {
      total_executions: total,
      successful_executions: successful,
      failed_executions: failed,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      avg_execution_time_ms: Math.round(avgExecutionTime)
    };
  }
}

// Export singleton instance
export const pauliPrime = new PAULIPrime();
