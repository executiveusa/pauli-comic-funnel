# Skills Library — pauli-comic-funnel (lazy-load manifest)

> **Purpose:** A repo-aware lazy-load manifest. Do NOT install everything. Each entry lists
> what it does, when to activate it, and how to load it on demand. Activate a skill only when
> the current task touches its domain.
>
> **Loading rule:** Skills are *referenced* here, not auto-installed. When a task matches a
> skill's "Activate when" trigger, invoke it via the Skill tool (or clone/install per the
> listed action) and keep token use low by reading only the relevant section.

---

## MANDATORY — always-on for this repo

### jcodemunch (jCodeMunch MCP)
- **What:** Token-efficient repo indexer (tree-sitter). Provides repo map, symbol search,
  ranked context, call/import graphs, blast radius, targeted symbol retrieval.
- **Activate when:** ANY codebase task — before direct source-file reads. This is a hard law.
- **Status in this repo:** Installed globally (`uv tool`). Trusted folder added to
  `~/.code-index/config.jsonc`. Project override at `.jcodemunch.jsonc` excludes vendored
  third-party subrepos (litellm, postiz, eigent, motion-primitives, JARVIS, cult-ui) so only
  first-party code is indexed.
- **Load action:** Use `jcodemunch-mcp` MCP tools (repo map, search_symbols, get_symbol).
  If index missing/stale: `jcodemunch-mcp index "<abs path>"`.
- **Source:** https://github.com/jgravelle/jcodemunch-mcp — Leverage 10, Confidence high.

---

## REPO INTELLIGENCE — activate for understanding / refactors

### opensrc (Vercel Labs)
- **What:** Open-source repo exploration pattern — repo map, source discovery, metadata.
- **Activate when:** Mapping an unfamiliar dependency, understanding how a vendored library
  (litellm, postiz) is structured, or comparing this repo to OSS patterns.
- **Load action:** Clone/reference. https://github.com/vercel-labs/opensrc
- **Leverage 8, Confidence medium.**

### graphify
- **What:** Turns code/docs into graphs, relationship maps, dependency/architecture diagrams.
- **Activate when:** We need a visual knowledge graph of the codebase, dependency map, or
  architecture diagram for `/docs/architecture.md` or the "animated world" portfolio viz.
- **Load action:** Clone/reference. https://github.com/safishamsi/graphify
- **Leverage 8, Confidence medium.** Pairs with the in-repo `HermesRolodex` graph-CRM idea.

### Understand-Anything
- **What:** Turns complex repos into explainable maps/wikis.
- **Activate when:** Onboarding a new agent to the repo, or generating the public
  "how PAULI works" explainer for the portfolio.
- **Source:** https://github.com/Lum1104/Understand-Anything — Leverage 10, high.

---

## FRONTEND / PORTFOLIO PAGE — activate when building the PAULI EFFECT portfolio

### pauli-taste-skill (studio-owned)
- **What:** Taste rubric for UI/brand/layout/product polish.
- **Activate when:** Designing or reviewing the portfolio page visual quality.
- **Source:** https://github.com/executiveusa/pauli-taste-skill — Leverage 10, high.

### design-skills
- **What:** Repeatable UI/UX review + generation patterns.
- **Activate when:** Building the portfolio design system / component polish.
- **Source:** https://github.com/ihlamury/design-skills — Leverage 9, high.

### GSAP
- **What:** Animation library for motion-heavy experiences (hero, "animated world").
- **Activate when:** The animated avatar world needs real motion.
- **Source:** https://github.com/greensock/GSAP — Leverage 8, high.

---

## KNOWLEDGE / SECOND BRAIN — activate for the Obsidian + second-brain backend link

### claude-handoff
- **What:** Handoff pattern to transfer project state/decisions/next-actions across sessions.
- **Activate when:** Long-horizon builds, or moving context to the "one pi agent".
- **Source:** https://github.com/willseltzer/claude-handoff — Leverage 9, high.

### agent-rules-books
- **What:** Durable coding-agent policies/style/conventions (AGENTS.md baseline).
- **Activate when:** Establishing repo conventions for the managed agent.
- **Source:** https://github.com/mattpocock/agent-rules-books — Leverage 9, high.

---

## VIEWPOINT — GLM-5.2 operating standard
This repo follows the GLM-5.2 global engineering rules (R-A-L-P-H-Y loop, jCodeMunch-first,
token budget, security guardrails). See `/docs/glm-system-prompt.md` if committed, or the
in-session global prompt. Always: retrieve targeted context first, make the smallest correct
change, validate, update `/docs/agent-context.md`.

---

## How to use this file
1. Inspect the task. Identify the domain (frontend / backend / agents / knowledge / infra).
2. Load ONLY the matching skill(s) above.
3. Keep jCodeMunch on for every code touch.
4. Update this manifest when a new skill proves repeatedly useful in this repo.
