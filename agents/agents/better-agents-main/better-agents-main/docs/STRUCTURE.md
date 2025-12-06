# Project Structure

The Better Agent Structure ensures industry best practices, making your agent ready for production:

- [Scenario](https://github.com/langwatch/scenario) agent tests written for every feature to ensure agent behaviour
- Versioning of the prompts for collaboration
- Evaluation notebooks for measuring specific prompts performance
- Already instrumented for full observability
- Standardization of structure for better project maintainability

## Directory Structure

```
my-agent-project/
├── app/ (or src/)           # The actual agent code, structured according to the chosen framework
├── tests/
│   ├── evaluations/         # Jupyter notebooks for evaluations
│   │   └── example_eval.ipynb
│   └── scenarios/           # End-to-end scenario tests
│       └── example_scenario.test.{py,ts}
├── prompts/                 # Versioned prompt files for team collaboration
│   └── sample_prompt.yaml
├── prompts.json             # Prompt registry
├── .mcp.json                # MCP server configuration
├── AGENTS.md                # Development guidelines
├── .env                     # Environment variables
└── .gitignore
```

## Key Components

### AGENTS.md
Development guidelines that ensure every new feature is properly tested, evaluated, and that prompts are versioned.

### .mcp.json
MCP server configuration that makes your coding assistant an expert in your chosen framework and provides access to additional tools.

### Scenario Tests (`tests/scenarios/`)
End-to-end tests that simulate conversations with your agent to ensure it behaves as expected.

### Evaluations (`tests/evaluations/`)
Jupyter notebooks for evaluating pieces of your agent pipeline such as RAG or classification tasks.

### Prompts (`prompts/`)
Versioned prompt files in YAML format, managed through `prompts.json` for team collaboration and playground integration.
