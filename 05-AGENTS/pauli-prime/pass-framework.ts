/**
 * PASS Framework: Problem-Amplification-Solution-System
 *
 * Purpose: Decision-making framework for PAULI-PRIME
 * Steps:
 *   P - Problem: Understand the user's request
 *   A - Amplification: Gather context from all sources
 *   S - Solution: Identify which skill(s) to use
 *   S - System: Execute via Skill Orchestrator
 *
 * Created: 2025-12-30
 * Author: Claude Code
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

export interface Problem {
  type: 'query' | 'task' | 'creation' | 'analysis' | 'deployment' | 'communication';
  intent: string;
  entities: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  scope: 'simple' | 'moderate' | 'complex';
}

export interface Context {
  relevantProjects: any[];
  relevantTasks: any[];
  historicalDecisions: any[];
  secondBrainResults: any[];
  notionResults: any[];
}

export interface Solution {
  skillId: string;
  approach: string;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  requiresApproval: boolean;
  subTasks: string[];
}

export class PASSFramework {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * STEP 1: PROBLEM - Analyze and categorize the user's request
   */
  async analyzeProblem(command: string): Promise<Problem> {
    const commandLower = command.toLowerCase();

    // Determine problem type based on keywords
    let type: Problem['type'] = 'query';
    if (commandLower.includes('deploy') || commandLower.includes('build')) {
      type = 'deployment';
    } else if (commandLower.includes('create') || commandLower.includes('generate')) {
      type = 'creation';
    } else if (commandLower.includes('analyze') || commandLower.includes('review')) {
      type = 'analysis';
    } else if (commandLower.includes('email') || commandLower.includes('message')) {
      type = 'communication';
    } else if (commandLower.includes('do') || commandLower.includes('run') || commandLower.includes('execute')) {
      type = 'task';
    }

    // Extract entities (simplified - would use NLP in production)
    const entities = this.extractEntities(command);

    // Determine urgency
    const urgency = commandLower.includes('urgent') || commandLower.includes('asap')
      ? 'critical'
      : commandLower.includes('important')
      ? 'high'
      : 'medium';

    // Determine scope
    const scope = commandLower.split(' ').length > 20 ? 'complex' : commandLower.split(' ').length > 10 ? 'moderate' : 'simple';

    return {
      type,
      intent: command,
      entities,
      urgency,
      scope
    };
  }

  /**
   * STEP 2: AMPLIFICATION - Gather context from all available sources
   */
  async amplifyContext(problem: Problem, userContext?: Record<string, any>): Promise<Context> {
    // Query database for relevant context
    const [projects, tasks, decisions] = await Promise.all([
      this.getRelevantProjects(problem),
      this.getRelevantTasks(problem),
      this.getHistoricalDecisions(problem)
    ]);

    return {
      relevantProjects: projects,
      relevantTasks: tasks,
      historicalDecisions: decisions,
      secondBrainResults: [], // TODO: Implement when Second Brain ready
      notionResults: [] // TODO: Implement when Notion sync ready
    };
  }

  /**
   * STEP 3: SOLUTION - Identify which skill(s) to use and approach
   */
  async identifySolution(problem: Problem, context: Context): Promise<Solution> {
    // Map problem types to skills
    const skillMapping: Record<Problem['type'], string> = {
      deployment: '01-deployment-devops',
      creation: '08-web-artifacts-builder',
      analysis: '03-marketing-growth',
      communication: '14-internal-comms',
      task: '06-client-delivery',
      query: '18-legacy-keeper'
    };

    const skillId = skillMapping[problem.type];

    // Determine if approval is required
    const requiresApproval =
      problem.type === 'deployment' ||
      problem.type === 'communication' ||
      problem.urgency === 'critical';

    // Break down into sub-tasks
    const subTasks = this.generateSubTasks(problem, context);

    return {
      skillId,
      approach: `Use ${skillId} to handle ${problem.type} request`,
      estimatedComplexity: problem.scope,
      requiresApproval,
      subTasks
    };
  }

  /**
   * Helper: Extract entities from command (simplified)
   */
  private extractEntities(command: string): string[] {
    // In production, would use NLP library like compromise or spaCy
    const words = command.split(' ');
    // Return capitalized words as entities
    return words.filter(w => w[0] === w[0].toUpperCase() && w.length > 1);
  }

  /**
   * Helper: Get relevant projects from database
   */
  private async getRelevantProjects(problem: Problem): Promise<any[]> {
    const { data } = await this.supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .limit(5);

    return data || [];
  }

  /**
   * Helper: Get relevant tasks from database
   */
  private async getRelevantTasks(problem: Problem): Promise<any[]> {
    const { data } = await this.supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .limit(10);

    return data || [];
  }

  /**
   * Helper: Get historical decisions
   */
  private async getHistoricalDecisions(problem: Problem): Promise<any[]> {
    const { data } = await this.supabase
      .from('decisions')
      .select('*')
      .eq('status', 'accepted')
      .order('decided_at', { ascending: false })
      .limit(5);

    return data || [];
  }

  /**
   * Helper: Generate sub-tasks based on problem
   */
  private generateSubTasks(problem: Problem, context: Context): string[] {
    const subTasks: string[] = [];

    switch (problem.scope) {
      case 'simple':
        subTasks.push('Execute primary action');
        break;
      case 'moderate':
        subTasks.push('Prepare resources');
        subTasks.push('Execute primary action');
        subTasks.push('Verify results');
        break;
      case 'complex':
        subTasks.push('Analyze requirements');
        subTasks.push('Design approach');
        subTasks.push('Prepare resources');
        subTasks.push('Execute in phases');
        subTasks.push('Test and validate');
        subTasks.push('Document and report');
        break;
    }

    return subTasks;
  }
}
