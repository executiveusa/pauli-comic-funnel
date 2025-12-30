/**
 * Approval Gates: Safety system for PAULI-PRIME
 *
 * Purpose: Determine which actions require human approval before execution
 * Implements tiered approval system based on risk and impact
 *
 * Created: 2025-12-30
 * Author: Claude Code
 */

export interface ApprovalCheck {
  requiresApproval: boolean;
  autoApproved: boolean;
  approvalTier: 'auto' | 'draft' | 'confirm' | 'block';
  reason: string;
}

export class ApprovalGates {
  /**
   * Check if a solution requires approval
   */
  async checkApproval(solution: any): Promise<ApprovalCheck> {
    const skillId = solution.skillId;

    // AUTO-EXECUTE: Read operations, queries, analysis
    if (this.isAutoApproved(skillId, solution)) {
      return {
        requiresApproval: false,
        autoApproved: true,
        approvalTier: 'auto',
        reason: 'Safe read-only or query operation'
      };
    }

    // SHOW DRAFT: Content creation, emails, social posts
    if (this.requiresDraft(skillId, solution)) {
      return {
        requiresApproval: true,
        autoApproved: false,
        approvalTier: 'draft',
        reason: 'Content creation requires review before sending'
      };
    }

    // REQUIRE CONFIRMATION: Deployments, database changes, financial ops
    if (this.requiresConfirmation(skillId, solution)) {
      return {
        requiresApproval: true,
        autoApproved: false,
        approvalTier: 'confirm',
        reason: 'High-impact operation requires explicit confirmation'
      };
    }

    // HARD BLOCK: Legal documents, contracts, irreversible actions
    if (this.isBlocked(skillId, solution)) {
      return {
        requiresApproval: true,
        autoApproved: false,
        approvalTier: 'block',
        reason: 'Critical operation blocked - requires manual handling'
      };
    }

    // Default: require confirmation for unknown operations
    return {
      requiresApproval: true,
      autoApproved: false,
      approvalTier: 'confirm',
      reason: 'Unknown operation - requires confirmation'
    };
  }

  /**
   * Auto-approved operations (safe, read-only)
   */
  private isAutoApproved(skillId: string, solution: any): boolean {
    const autoApprovedSkills = [
      '03-marketing-growth', // Analysis and insights
      '18-legacy-keeper', // Knowledge retrieval
      // Add more as needed
    ];

    // Also auto-approve if explicitly marked as query
    const isQueryOperation =
      solution.approach?.includes('query') ||
      solution.approach?.includes('search') ||
      solution.approach?.includes('analyze');

    return autoApprovedSkills.includes(skillId) || isQueryOperation;
  }

  /**
   * Operations requiring draft review
   */
  private requiresDraft(skillId: string, solution: any): boolean {
    const draftSkills = [
      '14-internal-comms', // Communications
      '03-marketing-growth', // Marketing content
      '07-avatar-comic-scriptwriter', // Creative content
      '15-gratitude-department', // Thank you notes
    ];

    const isContentCreation =
      solution.approach?.includes('create') ||
      solution.approach?.includes('write') ||
      solution.approach?.includes('draft');

    return draftSkills.includes(skillId) || isContentCreation;
  }

  /**
   * Operations requiring explicit confirmation
   */
  private requiresConfirmation(skillId: string, solution: any): boolean {
    const confirmSkills = [
      '01-deployment-devops', // Deployments
      '05-finance-ops', // Financial operations
      '04-fundraising-investor', // Investor relations
      '06-client-delivery', // Client deliverables
    ];

    const isHighImpact =
      solution.approach?.includes('deploy') ||
      solution.approach?.includes('delete') ||
      solution.approach?.includes('modify database') ||
      solution.approach?.includes('payment');

    return confirmSkills.includes(skillId) || isHighImpact;
  }

  /**
   * Operations that are blocked (never auto-execute)
   */
  private isBlocked(skillId: string, solution: any): boolean {
    const blockedKeywords = [
      'contract',
      'legal agreement',
      'sign document',
      'irreversible',
      'delete all',
      'drop database',
      'format',
      'sudo',
    ];

    const commandLower = solution.approach?.toLowerCase() || '';

    return blockedKeywords.some(keyword => commandLower.includes(keyword));
  }

  /**
   * Get approval tier description
   */
  getApprovalTierDescription(tier: ApprovalCheck['approvalTier']): string {
    const descriptions = {
      auto: 'Automatically executed - safe operation',
      draft: 'Draft created for your review before sending',
      confirm: 'Requires your explicit confirmation to proceed',
      block: 'Blocked - must be handled manually'
    };

    return descriptions[tier];
  }
}
