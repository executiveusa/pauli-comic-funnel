/**
 * Validates OpenAI API key format.
 *
 * @param value - The API key to validate
 * @returns true if valid, error message if invalid
 *
 * @example
 * ```ts
 * const result = validateOpenAIKey('sk-abc123');
 * // Returns: true
 * ```
 */
export const validateOpenAIKey = (value: string): true | string => {
  if (!value || value.trim().length === 0) {
    return "API key is required";
  }
  if (!value.startsWith("sk-")) {
    return 'OpenAI API key should start with "sk-"';
  }
  return true;
};
