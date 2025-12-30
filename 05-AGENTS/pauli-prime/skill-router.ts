/**
 * Skill Router: Routes commands to appropriate Cloud Skills
 *
 * Purpose: Manages delegation from PAULI-PRIME to Skill Orchestrators
 * Handles skill selection, execution, and result aggregation
 *
 * Created: 2025-12-30
 * Author: Claude Code
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

export interface SkillExecutionInput {
  command: string;
  problem: any;
  context: any;
  solution: any;
}

export interface SkillExecutionResult {
  success: boolean;
  output: any;
  skillId: string;
  executionTime: number;
  subAgentsUsed?: string[];
}

export class SkillRouter {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Route command to appropriate skill and execute
   */
  async routeToSkill(skillId: string, input: SkillExecutionInput): Promise<SkillExecutionResult> {
    const startTime = Date.now();

    console.log(`[SKILL-ROUTER] Routing to skill: ${skillId}`);

    try {
      // Get skill configuration from database
      const skill = await this.getSkill(skillId);

      if (!skill) {
        throw new Error(`Skill ${skillId} not found`);
      }

      // Update skill usage count
      await this.incrementSkillUsage(skillId);

      // Execute skill (delegating to skill orchestrator)
      const result = await this.executeSkill(skill, input);

      const executionTime = Date.now() - startTime;

      // Update skill metrics
      await this.updateSkillMetrics(skillId, true, executionTime);

      return {
        success: true,
        output: result,
        skillId,
        executionTime,
        subAgentsUsed: result.subAgentsUsed || []
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Update skill metrics with failure
      await this.updateSkillMetrics(skillId, false, executionTime);

      throw error;
    }
  }

  /**
   * Get skill configuration from database
   */
  private async getSkill(skillId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('cloud_skills')
      .select('*')
      .eq('skill_id', skillId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment skill usage counter
   */
  private async incrementSkillUsage(skillId: string): Promise<void> {
    const { error } = await this.supabase
      .rpc('increment', {
        table_name: 'cloud_skills',
        id_column: 'skill_id',
        id_value: skillId,
        column_name: 'usage_count',
        increment_by: 1
      });

    // If RPC doesn't exist, fallback to manual update
    if (error) {
      const skill = await this.getSkill(skillId);
      await this.supabase
        .from('cloud_skills')
        .update({ usage_count: skill.usage_count + 1 })
        .eq('skill_id', skillId);
    }
  }

  /**
   * Update skill performance metrics
   */
  private async updateSkillMetrics(
    skillId: string,
    success: boolean,
    executionTime: number
  ): Promise<void> {
    const skill = await this.getSkill(skillId);

    // Calculate new success rate
    const totalExecutions = skill.usage_count;
    const currentSuccessRate = skill.success_rate || 0;
    const previousSuccesses = Math.round((currentSuccessRate / 100) * (totalExecutions - 1));
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    const newSuccessRate = (newSuccesses / totalExecutions) * 100;

    // Calculate new average execution time
    const currentAvgTime = skill.avg_execution_time || 0;
    const newAvgTime = Math.round(
      ((currentAvgTime * (totalExecutions - 1)) + executionTime) / totalExecutions
    );

    // Update skill
    await this.supabase
      .from('cloud_skills')
      .update({
        success_rate: newSuccessRate,
        avg_execution_time: newAvgTime
      })
      .eq('skill_id', skillId);
  }

  /**
   * Execute skill orchestrator
   *
   * NOTE: This is a placeholder. In production, this would:
   * 1. Load the skill's orchestrator code
   * 2. Spawn necessary sub-agents
   * 3. Execute the skill's logic
   * 4. Return results
   *
   * For MVP, we return a mock result.
   */
  private async executeSkill(skill: any, input: SkillExecutionInput): Promise<any> {
    console.log(`[SKILL-ROUTER] Executing skill: ${skill.name}`);
    console.log(`[SKILL-ROUTER] Orchestrator: ${skill.orchestrator_agent_id}`);

    // TODO: Implement actual skill orchestrator execution
    // For now, return a mock result
    return {
      status: 'completed',
      message: `${skill.name} would execute here (NOT IMPLEMENTED YET)`,
      skillId: skill.skill_id,
      orchestratorId: skill.orchestrator_agent_id,
      input: input.command,
      subAgentsUsed: [],
      note: 'This is a mock response. Actual skill execution will be implemented per skill.'
    };
  }

  /**
   * Get all available skills
   */
  async getAvailableSkills(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('cloud_skills')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<any> {
    return this.getSkill(skillId);
  }
}
