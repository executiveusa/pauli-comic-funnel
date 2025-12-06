import { CliUtils } from "../utils/cli.util";

/**
 * Detects which coding assistants are installed on the system.
 *
 * @returns Promise resolving to a map of assistant IDs to installation status
 *
 * @example
 * ```ts
 * const installed = await detectInstalledAgents();
 * // Returns: { 'claude-code': true, 'cursor': false, 'kilocode': true }
 * ```
 */
export const detectInstalledAgents = async (): Promise<
  Record<string, boolean>
> => {
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
};
