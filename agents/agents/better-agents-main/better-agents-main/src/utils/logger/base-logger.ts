import * as fs from "fs/promises";
import * as path from "path";
import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import type { LogContext } from './types.js';

/**
 * Base logger responsible for structured JSON logging to files.
 *
 * This class follows the Single Responsibility Principle by handling
 * only structured logging operations and file management.
 *
 * @example
 * ```ts
 * const logger = new BaseLogger('/path/to/project');
 * logger.info('step-completed', { duration: 150 });
 * ```
 */
export class BaseLogger {
  private projectLogger?: PinoLogger;
  private timers = new Map<string, number>();

  /**
   * Creates a new base logger instance.
   * @param projectPath - Optional path to project for debug log file creation
   */
  constructor(projectPath?: string) {
    if (projectPath) {
      this.setupProjectLogging(projectPath);
    }
  }

  /**
   * Sets up project-specific JSON logging to a timestamped debug log file.
   */
  private async setupProjectLogging(projectPath: string): Promise<void> {
    try {
      const logDir = path.join(projectPath, ".better-agents");

      // Create timestamped log file name: debug-YYYY-MM-DD-HH-MM-SS.log
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const logPath = path.join(logDir, `debug-${timestamp}.log`);

      await fs.mkdir(logDir, { recursive: true });

      this.projectLogger = pino(
        {
          level: "debug",
          formatters: {
            level: (label: string) => ({
              level: label,
              timestamp: new Date().toISOString(),
            }),
          },
        },
        pino.destination(logPath)
      );
    } catch {
      // Silently fail project logging setup - don't break user experience
      // Note: We can't use logger here since we're in the logger setup
    }
  }

  /**
   * Logs debug information in structured JSON format.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for debugging
   */
  debug(step: string, context: LogContext = {}): void {
    this.projectLogger?.debug({ step, ...context });
  }

  /**
   * Logs informational debug data in structured JSON format.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for analysis
   */
  info(step: string, context: LogContext = {}): void {
    this.projectLogger?.info({ step, ...context });
  }

  /**
   * Logs error with stack trace in structured JSON format.
   * @param error - The error that occurred
   * @param context - Additional context about the error
   */
  error(error: Error, context: LogContext = {}): void {
    this.projectLogger?.error({
      step: 'error',
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  /**
   * Starts a performance timer and returns a function to end it.
   * @param label - Identifier for the timed operation
   * @returns Function that ends the timer and logs duration
   */
  startTimer(label: string): () => number {
    const start = Date.now();
    this.timers.set(label, start);
    this.debug('timer-start', { label });

    return () => {
      const duration = Date.now() - start;
      this.timers.delete(label);
      this.debug('timer-end', { label, duration });
      return duration;
    };
  }

  /**
   * Checks if the logger has file logging capability.
   * @returns True if project logging is set up
   */
  hasFileLogging(): boolean {
    return this.projectLogger !== undefined;
  }
}
