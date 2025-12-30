# 05-AGENTS: Agent System

**Purpose**: Core agent infrastructure including PAULI-PRIME, adversarial review, and agent registry

---

## Structure

```
05-AGENTS/
├── pauli-prime/              # Master orchestrator
│   ├── orchestrator.ts       # Main PAULI-PRIME logic
│   ├── pass-framework.ts     # PASS decision engine
│   ├── skill-router.ts       # Routes to Cloud Skills
│   └── approval-gates.ts     # Safety approval system
├── adversarial-review/       # Code quality system
│   ├── coder-agent.ts        # Generates code
│   ├── validator-agent.ts    # Reviews code
│   └── review-loop.ts        # Iterative improvement
├── lightning-monitor/        # Microsoft Lightning Agent
│   ├── monitor.ts            # Performance tracking
│   ├── learning-loops.ts     # Continuous improvement
│   └── optimization.ts       # A/B testing & optimization
├── agent-registry.json       # All agents metadata
└── README.md                # This file
```

---

## Agent Hierarchy

```
PAULI-PRIME (Master Orchestrator)
├── Skill Orchestrators (18 total)
│   ├── Sub-Agents (5-10 per skill)
│   └── CrewAI Swarms (dynamic spawning)
├── Lightning Monitor (Continuous learning)
└── Adversarial Review System
    ├── Coder Agent
    └── Validator Agent
```

---

## PAULI-PRIME (The Orchestrator Prime)

**Agent ID**: PAULI-PRIME
**Model**: claude-sonnet-4-5-20250929
**Authority**: SUPREME

### Responsibilities
- Receive commands from user (voice or text)
- Query Second Brain for context
- Select appropriate Skill Orchestrator
- Monitor all sub-agents
- Enforce approval gates
- Report completion to user

### PASS Framework
**P**roblem: Understand the user's request
**A**mplification: Gather context from Second Brain, Notion, Drive
**S**olution: Identify which skill(s) to use
**S**ystem: Execute via Skill Orchestrator(s)

### Approval Gates
- **Auto-execute**: Read operations, queries, analysis
- **Show draft**: Content creation, emails, social posts
- **Require confirmation**: Deployments, database changes, financial ops
- **Hard block**: Legal documents, contracts, irreversible actions

---

## Adversarial Review System

**Purpose**: Ensure code quality through adversarial peer review

### Process
1. **Coder Agent** generates initial code
2. **Validator Agent** strictly reviews against criteria
3. **Iterative loop** (max 5 iterations)
4. **Final code** must pass all review criteria

### Review Criteria
- Code quality and best practices
- Security vulnerabilities
- Performance considerations
- Test coverage
- Documentation completeness
- Adherence to project conventions

---

## Microsoft Lightning Agent

**Purpose**: Continuous learning and optimization

### Capabilities
- Monitor all agent performance metrics
- Track decision outcomes (success/failure)
- A/B test different approaches
- Optimize prompts based on results
- Alert PAULI-PRIME of anomalies
- Generate weekly improvement reports

### Data Sources
- Agent execution logs
- GitHub commit history
- Notion update patterns
- Voice command transcripts
- User feedback

---

## Agent Registry

All agents are registered in `agent-registry.json`:

```json
{
  "agents": [
    {
      "agent_id": "PAULI-PRIME",
      "role": "Master Orchestrator",
      "model": "claude-sonnet-4-5-20250929",
      "status": "active",
      "created": "2025-12-30",
      "performance": {
        "commands_processed": 0,
        "success_rate": 0,
        "avg_response_time": 0
      }
    }
  ]
}
```

---

## Status

**PAULI-PRIME**: IN PROGRESS
**Adversarial Review**: IN PROGRESS
**Lightning Monitor**: PENDING
