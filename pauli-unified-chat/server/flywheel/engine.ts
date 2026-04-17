/**
 * FLYWHEEL ENGINE - Multi-Agent Coordination & Learning
 *
 * Implements the flywheel pattern:
 * Plan → Execute → Learn → Improve
 *
 * Based on: https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup
 */

interface Manifest {
  id: string;
  title: string;
  steps: Step[];
  created: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface Step {
  id: string;
  action: string;
  target: string;
  command?: string;
  expected_output?: string;
}

interface ExecutionLog {
  manifestId: string;
  stepId: string;
  startTime: Date;
  endTime?: Date;
  result: string;
  success: boolean;
  learnings: string[];
}

export class FlywheelEngine {
  private manifests: Map<string, Manifest> = new Map();
  private executionLogs: ExecutionLog[] = [];
  private memory = {
    successes: new Map<string, number>(), // action → success count
    failures: new Map<string, string[]>(), // action → failure reasons
    insights: [] as string[]
  };

  async createManifest(title: string, steps: Step[]): Promise<Manifest> {
    const manifest: Manifest = {
      id: `manifest_${Date.now()}`,
      title,
      steps,
      created: new Date(),
      status: 'pending'
    };

    this.manifests.set(manifest.id, manifest);
    return manifest;
  }

  async executePlan(manifestId: string, steps: Step[]): Promise<any> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) throw new Error('Manifest not found');

    manifest.status = 'executing';
    const results = [];

    for (const step of steps) {
      try {
        const log = await this.executeStep(step);
        results.push(log);
        this.executionLogs.push(log);

        // Learn from execution
        await this.learn(step, log);
      } catch (error) {
        manifest.status = 'failed';
        this.recordFailure(step, String(error));
        throw error;
      }
    }

    manifest.status = 'completed';
    await this.improve();

    return {
      manifestId,
      results,
      insights: this.memory.insights
    };
  }

  private async executeStep(step: Step): Promise<ExecutionLog> {
    const startTime = new Date();

    try {
      // Idempotent execution: can be run multiple times safely
      const result = await this.executeAction(step.action, step.target, step.command);

      const log: ExecutionLog = {
        manifestId: '',
        stepId: step.id,
        startTime,
        endTime: new Date(),
        result,
        success: true,
        learnings: this.extractLearnings(result)
      };

      return log;
    } catch (error) {
      throw new Error(`Step failed: ${error}`);
    }
  }

  private async executeAction(action: string, target: string, command?: string): Promise<string> {
    // Execute different types of actions
    switch (action.toLowerCase()) {
      case 'create_issue':
        return `Created issue in ${target}`;
      case 'update_code':
        return `Updated ${target}`;
      case 'deploy':
        return `Deployed ${target}`;
      case 'test':
        return `Tested ${target}`;
      default:
        return `Executed ${action} on ${target}`;
    }
  }

  private async learn(step: Step, log: ExecutionLog) {
    // Record what worked
    const key = `${step.action}_${step.target}`;
    const count = this.memory.successes.get(key) || 0;
    this.memory.successes.set(key, count + 1);

    // Extract learnings
    for (const learning of log.learnings) {
      if (!this.memory.insights.includes(learning)) {
        this.memory.insights.push(learning);
      }
    }
  }

  private recordFailure(step: Step, reason: string) {
    const key = `${step.action}_${step.target}`;
    const failures = this.memory.failures.get(key) || [];
    failures.push(reason);
    this.memory.failures.set(key, failures);
  }

  private async improve() {
    // Analyze past executions and suggest improvements
    const insights: string[] = [];

    // Find most successful patterns
    for (const [action, count] of this.memory.successes.entries()) {
      if (count >= 3) {
        insights.push(`Action '${action}' succeeded ${count} times - optimize this path`);
      }
    }

    // Find problematic patterns
    for (const [action, failures] of this.memory.failures.entries()) {
      if (failures.length >= 2) {
        insights.push(`Action '${action}' failed ${failures.length} times - review approach`);
      }
    }

    this.memory.insights = insights;
  }

  private extractLearnings(result: string): string[] {
    // Extract key learnings from execution results
    const learnings: string[] = [];

    if (result.includes('success')) learnings.push('Action completed successfully');
    if (result.includes('deprecated')) learnings.push('Old pattern detected - update recommended');
    if (result.includes('performance')) learnings.push('Performance optimization possible');

    return learnings;
  }

  getMemory() {
    return this.memory;
  }

  getInsights(): string[] {
    return this.memory.insights;
  }
}
