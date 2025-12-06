/**
 * Validates project goal input.
 *
 * @param value - The project goal to validate
 * @returns true if valid, error message if invalid
 *
 * @example
 * ```ts
 * const result = validateProjectGoal('Build a chatbot');
 * // Returns: true
 * ```
 */
export const validateProjectGoal = (value: string): true | string => {
  if (!value || value.trim().length === 0) {
    return "Please describe what you want to build";
  }
  return true;
};
