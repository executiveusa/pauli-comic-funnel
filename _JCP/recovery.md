# JCP Recovery Protocol

**Purpose**: Enable any agent (or future session) to resume work if interrupted

---

## Quick Recovery Steps

1. **Read these files in order**:
   ```
   _JCP/features.json      # What features exist and their status
   _JCP/progress.md        # Overall progress and context
   00-SYSTEM/INIT-RECONNAISSANCE-REPORT.md  # Initial state analysis
   00-SYSTEM/VERIFICATION-RESPONSE-001.json # Verification results
   ```

2. **Identify last completed feature**:
   ```bash
   cat _JCP/features.json | grep -A5 '"status": "COMPLETED"'
   ```

3. **Find current in-progress feature**:
   ```bash
   cat _JCP/features.json | grep -A5 '"status": "IN_PROGRESS"'
   ```

4. **Load recovery checkpoint** for that feature:
   ```bash
   cat _JCP/checkpoints/F00X.md
   ```

5. **Resume work** from checkpoint instructions

---

## Recovery Checkpoints

Each feature has a checkpoint file: `_JCP/checkpoints/F00X.md`

Checkpoint format:
```markdown
# Feature: [Name]
**ID**: F00X
**Status**: IN_PROGRESS
**Progress**: X%

## What Was Completed
- [x] Step 1
- [x] Step 2

## What Remains
- [ ] Step 3
- [ ] Step 4

## Context Needed
- File: path/to/file.ts
- Concept: Brief explanation
- Decision: Why we chose X over Y

## Next Action
Exact next command or file to create

## Tests To Run
- Command 1
- Command 2
```

---

## Recovery Scenarios

### Scenario 1: Session Timeout (Context Limit Reached)
**Symptoms**: Context usage at 90%+, need to start fresh session

**Recovery**:
1. New agent reads _JCP/progress.md
2. Reviews features.json for current status
3. Reads checkpoint for IN_PROGRESS feature
4. Continues from checkpoint

### Scenario 2: Error/Blocker Encountered
**Symptoms**: Feature cannot proceed due to missing dependency, API error, etc.

**Recovery**:
1. Mark feature as BLOCKED in features.json
2. Add blocker description to checkpoint
3. Move to next feature that isn't blocked
4. Return to blocked feature when blocker resolved

### Scenario 3: Architecture Change Required
**Symptoms**: Realize current approach won't work, need to refactor

**Recovery**:
1. Document why current approach failed
2. Create new feature for refactor
3. Mark old feature as DEPRECATED
4. Link new feature to old in features.json

### Scenario 4: External Approval Needed
**Symptoms**: Waiting for human/architect approval before proceeding

**Recovery**:
1. Mark feature as AWAITING_APPROVAL in features.json
2. Create checkpoint with "What we built" and "What we need approval for"
3. Work on other features while waiting
4. Resume when approval received

---

## Feature Status Definitions

| Status | Meaning | Recovery Action |
|--------|---------|-----------------|
| PENDING | Not started | Start from beginning |
| IN_PROGRESS | Partially complete | Load checkpoint, continue |
| BLOCKED | Cannot proceed | Skip, work on other features |
| AWAITING_APPROVAL | Needs review | Wait or work on others |
| COMPLETED | Fully done + tested | Move to next feature |
| DEPRECATED | Approach abandoned | Read why, use new feature |

---

## Critical Recovery Rules

1. **NEVER mark feature COMPLETED without**:
   - Running all tests
   - Adversarial review (when system ready)
   - Git commit
   - Creating recovery checkpoint

2. **ALWAYS create checkpoint when**:
   - Context usage reaches 70%
   - Feature reaches 50% progress
   - Switching to different feature
   - Session about to end

3. **ALWAYS update progress.md when**:
   - Feature status changes
   - Session starts/ends
   - Blocker encountered
   - Major milestone reached

4. **File Recovery Locations**:
   ```
   System state:        00-SYSTEM/
   JCP tracking:        _JCP/
   Feature checkpoints: _JCP/checkpoints/
   Code:                05-AGENTS/, 03-CLOUD-SKILLS/, etc.
   Database:            supabase/migrations/
   Documentation:       08-DOCS/, */README.md
   ```

---

## Example Recovery Flow

```
NEW SESSION STARTS
↓
Read _JCP/progress.md
↓
Check features.json
↓
F001: COMPLETED ✓
F002: COMPLETED ✓
F003: IN_PROGRESS (60%)
↓
Read _JCP/checkpoints/F003.md
↓
Checkpoint says:
"Completed: llms.txt installed, watcher script created
 Remaining: Test watcher, create initial llms.txt files
 Next: Run 'python llms_watcher.py' and verify output"
↓
Resume from that exact point
↓
Complete F003
↓
Mark COMPLETED in features.json
↓
Update progress.md
↓
Move to F004
```

---

## Contact / Escalation

If recovery fails or you're unsure how to proceed:

1. **Document what you tried** in _JCP/recovery-issues.md
2. **Check for ARCHITECT directives** in 00-SYSTEM/
3. **Review original mission prompt** (if available)
4. **Ask human relay** for clarification

**Do NOT**:
- Guess at partial state
- Mark features complete without verification
- Skip recovery checkpoints
- Proceed without understanding context

---

**Last Updated**: 2025-12-30T00:00:00Z
**Protocol Version**: JCP v1.0
