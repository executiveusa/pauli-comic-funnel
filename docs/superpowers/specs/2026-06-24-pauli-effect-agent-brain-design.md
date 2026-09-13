# THE PAULI EFFECT — Agent Brain + Identity Design

**Date:** 2026-06-24
**Status:** Phase 1 (brain + identity) built & verified; Phase 2 (live Supabase + portfolio) pending
**Branch:** `feat/pauli-brain-icm` in `pauli-pi-agent` repo

## Context
Transform `pauli-comic-funnel` (a comic-funnel + internal automation repo, ~190 first-party
files buried under ~7,500 vendored third-party files) into **THE PAULI EFFECT** — a public,
faceless social-purpose portfolio led by a sasquatch named Pauli, running an animated world
of observable AI agents. Backend = one pi agent (`pauli-pi-agent`, a pi-mono fork) linked to
the second brain + Obsidian vault, controlled privately via Tailscale.

## Decisions (from brainstorm)
- **Q1 (architecture):** C-with-twist — comic-funnel becomes reference-only; the **pi agent is
  the backend**; a redesigned frontend is the public portfolio; a multimodal chat bot
  (OpenRouter) drives it; Tailscale is the control plane.
- **Q2 (centerpiece):** B — portfolio of positive projects + a **narrated live activity feed**
  (publicly observable agents doing real good), not raw tool-call streaming.
- **Scope:** Option B — knowledge link + agent identity, in ICM style (folders as architecture,
  per arXiv:2603.16021). Build foundation first; full backend-as-agent (C) later.

## Architecture
```
PUBLIC portfolio (animated avatar world)  →  multimodal chat bot (OpenRouter)
        ↓ drives
ONE PI AGENT = the backend  (pauli-pi-agent: pi-mono fork + company/ + brain/)
        ↓ queries
SECOND BRAIN (Supabase second_brain, primary) ← local vaults (E:\) fallback
        ↓ controlled via
TAILSCALE + Pauli Control Bridge (port 8787, mode-gated, write/ship locked)
```

## Phase 1 — DELIVERED (this session)
- **Brain layer** (`pauli-pi-agent/brain/`): zero-dep `search.mjs` (Supabase RPC primary +
  local fuzzy fallback) + `env-loader.mjs` (allow-listed, never echoes secrets). Verified live
  against `E:\MENTAL MODELS` + `E:\OBSIDIAN SECOND BRAIN`.
- **Identity layer:** `PAULI.md` (top-level ICM identity + navigation) + `company/INDEX.md`
  (doctrine map). Derived from the existing `company/*.md` doctrine (SOUL, HEART, MISSION,
  CYNTHIA, OPERATING, HUMAN_APPROVAL).
- **Control bridge:** `ops/pauli-control/server.js` `buildPrompt()` now injects Pauli identity.
- **Secret hygiene:** `.gitignore` guards + `.env.example` brain keys (placeholders).

## Phase 2 — PENDING (needs you)
1. **Tailscale on VPS** → Supabase reachable privately → flip brain to live Supabase primary.
2. **Brain indexer** — ingest `E:\` vaults into `second_brain.memories` so Supabase is the real
   primary (not just fallback).
3. **Public portfolio frontend** — the animated avatar world (Q2: portfolio + activity feed).
4. **OpenRouter multimodal chat bot** — public entry point driving the agent.
5. **Prune pi-mono baggage** — code-simplifier + ponytail over unused `packages/*`.

## Open risks
- Supabase service-role key + JWT secret are in a plaintext `Downloads` file since March — rotate.
- pi-mono has 3 critical npm vulns + deprecated `@mariozechner/pi-coding-agent`.
- VPS needs a restart (20 zombies, "system restart required").
