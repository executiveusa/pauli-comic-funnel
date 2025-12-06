import chalk from "chalk";
import ora from "ora";
import type { Spinner, LogContext } from "./types.js";

/**
 * Display logger responsible for user-facing console output.
 *
 * This class follows the Single Responsibility Principle by handling
 * only console output operations with colors and spinners.
 *
 * @example
 * ```ts
 * const logger = new DisplayLogger();
 * logger.userSuccess("Project created successfully!");
 * const spinner = logger.startSpinner("Processing...");
 * ```
 */
export class DisplayLogger {
  private spinner?: Spinner;

  /**
   * Logs user-facing informational message with cyan color.
   * @param message - The message to display to the user
   */
  userInfo(message: string): void {
    if (this.spinner) {
      this.spinner.info(chalk.cyan(message));
    } else {
      console.log(chalk.cyan(message));
    }
  }

  /**
   * Logs user-facing success message with green color and checkmark.
   * @param message - The success message to display
   */
  userSuccess(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
    } else {
      console.log(chalk.green(`✅ ${message}`));
    }
  }

  /**
   * Logs user-facing error message with red color and X mark.
   * @param message - The error message to display
   */
  userError(message: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
    } else {
      console.error(chalk.red(`❌ ${message}`));
    }
  }

  /**
   * Logs user-facing warning message with yellow color and warning symbol.
   * @param message - The warning message to display
   */
  userWarning(message: string): void {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(message));
    } else {
      console.warn(chalk.yellow(`⚠️  ${message}`));
    }
  }

  /**
   * Starts an ora spinner for long-running operations.
   * @param text - Initial spinner text
   * @returns The spinner instance
   */
  startSpinner(text: string): Spinner {
    if (!this.spinner) {
      this.spinner = ora(text).start();
    }
    return this.spinner;
  }

  /**
   * Gets the current spinner instance if one exists.
   * @returns The current spinner or undefined
   */
  getSpinner(): Spinner | undefined {
    return this.spinner;
  }

  /**
   * Creates a child display logger with additional context.
   * For display logger, this is mainly for API compatibility.
   * @param _context - Context (ignored for display logger)
   * @returns New display logger instance
   */
  child(_context: LogContext): DisplayLogger {
    return new DisplayLogger();
  }
}
