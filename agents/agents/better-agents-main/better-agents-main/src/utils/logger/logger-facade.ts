import type { Spinner, Logger, LogContext } from './types.js';
import { BaseLogger } from './base-logger.js';
import { DisplayLogger } from './display-logger.js';
import { ConsoleLogger } from './console-logger.js';

/**
 * Logger facade that coordinates between multiple specialized loggers.
 *
 * This class implements the Facade pattern to provide a unified interface
 * while delegating to specialized loggers for different concerns:
 * - BaseLogger: Structured JSON file logging
 * - DisplayLogger: User-facing console output
 * - ConsoleLogger: Debug console output
 *
 * @example
 * ```ts
 * const logger = new LoggerFacade('/path/to/project');
 * logger.userSuccess("Project created!");
 * logger.debug('step-completed', { duration: 150 });
 * ```
 */
export class LoggerFacade implements Logger {
  private baseLogger: BaseLogger;
  private displayLogger: DisplayLogger;
  private consoleLogger: ConsoleLogger;

  /**
   * Creates a new logger facade instance.
   * @param projectPath - Optional path to project for debug log file creation
   */
  constructor(projectPath?: string) {
    this.baseLogger = new BaseLogger(projectPath);
    this.displayLogger = new DisplayLogger();
    this.consoleLogger = new ConsoleLogger();
  }

  /**
   * Logs user-facing informational message with cyan color.
   * @param message - The message to display to the user
   */
  userInfo(message: string): void {
    this.displayLogger.userInfo(message);
    // Also log to debug systems for consistency
    this.baseLogger.debug('user-info', { message, type: 'info' });
    this.consoleLogger.debug('user-info', { message, type: 'info' });
  }

  /**
   * Logs user-facing success message with green color and checkmark.
   * @param message - The success message to display
   */
  userSuccess(message: string): void {
    this.displayLogger.userSuccess(message);
    // Also log to debug systems for consistency
    this.baseLogger.debug('user-success', { message, type: 'success' });
    this.consoleLogger.debug('user-success', { message, type: 'success' });
  }

  /**
   * Logs user-facing error message with red color and X mark.
   * @param message - The error message to display
   */
  userError(message: string): void {
    this.displayLogger.userError(message);
    // Also log to debug systems for consistency
    this.baseLogger.error(new Error(message), { type: 'user-error' });
    this.consoleLogger.error(new Error(message), { type: 'user-error' });
  }

  /**
   * Logs user-facing warning message with yellow color and warning symbol.
   * @param message - The warning message to display
   */
  userWarning(message: string): void {
    this.displayLogger.userWarning(message);
    // Also log to debug systems for consistency
    this.baseLogger.debug('user-warning', { message, type: 'warning' });
    this.consoleLogger.debug('user-warning', { message, type: 'warning' });
  }

  /**
   * Logs debug information in structured JSON format.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for debugging
   */
  debug(step: string, context: LogContext = {}): void {
    this.baseLogger.debug(step, context);
    this.consoleLogger.debug(step, context);
  }

  /**
   * Logs informational debug data in structured JSON format.
   * @param step - The operation or step being logged
   * @param context - Additional structured data for analysis
   */
  info(step: string, context: LogContext = {}): void {
    this.baseLogger.info(step, context);
    this.consoleLogger.info(step, context);
  }

  /**
   * Logs error with stack trace in structured JSON format.
   * @param error - The error that occurred
   * @param context - Additional context about the error
   */
  error(error: Error, context: LogContext = {}): void {
    this.baseLogger.error(error, context);
    this.consoleLogger.error(error, context);
  }

  /**
   * Starts a performance timer and returns a function to end it.
   * @param label - Identifier for the timed operation
   * @returns Function that ends the timer and logs duration
   */
  startTimer(label: string): () => number {
    return this.baseLogger.startTimer(label);
  }

  /**
   * Creates a child logger with additional context.
   * @param context - Context to add to all log entries from this child
   * @returns New logger instance with inherited context
   */
  child(context: LogContext): Logger {
    // Create a new facade with the same specialized loggers
    // In a more complex implementation, this would merge contexts
    const childFacade = new LoggerFacade();
    // Copy spinner state for continuity
    const currentSpinner = this.displayLogger.getSpinner();
    if (currentSpinner) {
      childFacade.displayLogger = this.displayLogger.child(context);
    }
    return childFacade;
  }

  /**
   * Starts an ora spinner for long-running operations.
   * @param text - Initial spinner text
   * @returns The spinner instance
   */
  startSpinner(text: string): Spinner {
    return this.displayLogger.startSpinner(text);
  }

  /**
   * Gets the current spinner instance if one exists.
   * @returns The current spinner or undefined
   */
  getSpinner(): Spinner | undefined {
    return this.displayLogger.getSpinner();
  }
}
