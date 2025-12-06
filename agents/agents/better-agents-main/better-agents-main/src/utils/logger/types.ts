/**
 * Context data for debug logging operations.
 * Uses unknown instead of any for type safety while allowing dynamic properties.
 */
export type LogContext = Record<string, unknown>;

/**
 * Known log levels for structured logging.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Simplified interface for ora spinner to avoid complex typing.
 */
export interface Spinner {
  text: string;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  start(): void;
  stop(): void;
}

/**
 * Unified logging interface for Better Agents.
 *
 * This logger provides both user-facing console output (with colors and formatting)
 * and structured debug logging (JSON format for analysis and debugging).
 *
 * @example
 * ```ts
 * import { logger } from '../utils/logger/index.js';
 *
 * // User-facing messages (preserve UX)
 * logger.userSuccess("Project created successfully!");
 * logger.userInfo("Configuration complete");
 *
 * // Debug logging (structured JSON)
 * logger.debug('step-completed', { step: 'config', duration: 150 });
 *
 * // Performance timing
 * const endTimer = logger.startTimer('file-generation');
 * // ... do work ...
 * endTimer(); // Logs duration automatically
 * ```
 */
export interface Logger {
  /**
   * Logs user-facing informational message with cyan color.
   * @param message - The message to display to the user
   */
  userInfo(message: string): void;

  /**
   * Logs user-facing success message with green color and checkmark.
   * @param message - The success message to display
   */
  userSuccess(message: string): void;

  /**
   * Logs user-facing error message with red color and X mark.
   * @param message - The error message to display
   */
  userError(message: string): void;

  /**
   * Logs user-facing warning message with yellow color and warning symbol.
   * @param message - The warning message to display
   */
  userWarning(message: string): void;

  /**
   * Logs debug information in structured JSON format.
   * Only outputs when debug mode is enabled.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for debugging
   */
  debug(step: string, context?: LogContext): void;

  /**
   * Logs informational debug data in structured JSON format.
   * Only outputs when debug mode is enabled.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for analysis
   */
  info(step: string, context?: LogContext): void;

  /**
   * Logs error with stack trace in structured JSON format.
   * @param error - The error that occurred
   * @param context - Additional context about the error
   */
  error(error: Error, context?: LogContext): void;

  /**
   * Starts a performance timer and returns a function to end it.
   * @param label - Identifier for the timed operation
   * @returns Function that ends the timer and logs duration
   */
  startTimer(label: string): () => number;

  /**
   * Creates a child logger with additional context.
   * @param context - Context to add to all log entries from this child
   * @returns New logger instance with inherited context
   */
  child(context: LogContext): Logger;

  /**
   * Starts an ora spinner for long-running operations.
   * @param text - Initial spinner text
   * @returns The spinner instance
   */
  startSpinner(text: string): Spinner;

  /**
   * Gets the current spinner instance if one exists.
   * @returns The current spinner or undefined
   */
  getSpinner(): Spinner | undefined;
}
