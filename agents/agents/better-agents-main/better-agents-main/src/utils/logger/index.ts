import { LoggerFacade } from './logger-facade.js';

/**
 * Default logger instance for global use throughout the application.
 *
 * This logger provides unified logging with:
 * - User-facing console output with colors and spinners
 * - Structured JSON logging to timestamped files
 * - Debug console output when --debug flag is used
 *
 * @example
 * ```ts
 * import { logger } from '../utils/logger/index.js';
 *
 * logger.userSuccess("Operation completed!");
 * logger.debug('step-finished', { duration: 150 });
 * ```
 */
export const logger = new LoggerFacade();

// Export types for external use
export type { Logger, LogContext, LogLevel } from './types.js';
