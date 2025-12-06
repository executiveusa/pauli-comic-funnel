import type { FrameworkKnowledge } from "../index.js";

/**
 * Returns Agno framework knowledge for documentation and prompts.
 *
 * @returns Framework knowledge object
 *
 * @example
 * ```ts
 * const knowledge = getKnowledge();
 * console.log(knowledge.setupInstructions);
 * ```
 */
export const getKnowledge = (): FrameworkKnowledge => ({
  setupInstructions: "Python w/uv + pytest",
  toolingInstructions:
    "Review the .cursorrules and llms.txt files for Agno best practices",
  agentsGuideSection: `## Framework-Specific Guidelines

### Agno Framework

**Always follow Agno best practices:**

- Refer to the \`.cursorrules\` file for Agno-specific coding standards
- Consult \`llms.txt\` for comprehensive Agno documentation
- Use Agno's agent building patterns and conventions
- Follow Agno's recommended project structure

**Key Agno Resources:**
- Documentation: https://docs.agno.com/
- GitHub: https://github.com/agno-agi/agno
- Local files: \`.cursorrules\` and \`llms.txt\`

**When implementing agent features:**
1. Review Agno documentation for best practices
2. Use Agno's built-in tools and utilities
3. Follow Agno's patterns for agent state management
4. Leverage Agno's testing utilities

---
`,
});

