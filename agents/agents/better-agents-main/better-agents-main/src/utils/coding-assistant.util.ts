import { CliUtils } from "./cli.util";

/**
 * Utility class for coding assistant-related operations.
 */
export class CodingAssistantUtils {
  /**
   * Detects which coding assistants are installed on the system.
   *
   * @returns Promise resolving to a map of assistant IDs to installation status
   *
   * @example
   * ```ts
   * const installed = await CodingAssistantUtils.detectInstalledAgents();
   * // Returns: { 'claude-code': true, 'cursor': false, 'kilocode': true }
   * ```
   */
  static async detectInstalledAgents(): Promise<Record<string, boolean>> {
    const [hasClaude, hasCursor, hasKilocode] = await Promise.all([
      CliUtils.isCommandAvailable("claude"),
      CliUtils.isCommandAvailable("cursor-agent"),
      CliUtils.isCommandAvailable("kilocode"),
    ]);

    return {
      "claude-code": hasClaude,
      cursor: hasCursor,
      kilocode: hasKilocode,
      none: true, // Always available since it doesn't require installation
    };
  }
}
