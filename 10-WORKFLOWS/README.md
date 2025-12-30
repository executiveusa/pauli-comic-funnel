# 10-WORKFLOWS: Automation Workflows

**Purpose**: Scheduled jobs, automation scripts, and workflow definitions

---

## Structure

```
10-WORKFLOWS/
├── scheduled/             # Cron jobs and scheduled tasks
│   ├── daily-sync.sh     # Triple-sync execution
│   ├── weekly-reports.sh # Lightning Agent reports
│   └── backup.sh         # System backups
├── github-actions/        # GitHub Actions workflows
│   ├── ci-cd.yml
│   ├── security-scan.yml
│   └── dependency-update.yml
├── automation/            # Other automation scripts
│   ├── byte-rover.config.json
│   └── commit-watcher.sh
└── README.md             # This file
```

---

## Scheduled Workflows

### Daily (3:00 AM)
- **Second Brain Sync**: Fetch ChatGPT exports from Google Drive
- **Database Backup**: Supabase backup
- **Security Scan**: Dependency vulnerability check

### Every 15 Minutes
- **Notion Sync**: Bidirectional local ↔ Notion sync
- **Byte Rover Auto-commit**: Git auto-commit on file changes

### Weekly (Sunday 9:00 AM)
- **Lightning Agent Report**: Performance metrics and learning insights
- **Agent Performance Review**: Analyze all agents
- **Dependency Updates**: Check for package updates

---

## Auto-Commit Workflow (Byte Rover)

**Purpose**: Automatically commit and push changes to GitHub

**Configuration**: `.byterover.json` (in root)

**Behavior**:
- Watches all directories (except node_modules, .git)
- Debounce: 5 seconds after last file change
- Auto-commit with descriptive message
- Auto-push to remote

**Status**: PENDING (to be configured)

---

## GitHub Actions

### CI/CD Pipeline
- Run tests on every push
- Deploy to staging on merge to develop
- Deploy to production on merge to main

### Security Scanning
- Dependency vulnerability scan
- Code security analysis
- Secret detection

### Automated Updates
- Dependabot for dependency updates
- Automated PR creation for security patches

---

## Status

**Current**: Basic git workflow
**Next**: Configure Byte Rover, set up scheduled jobs
**Priority**: MEDIUM (improves automation but not critical for MVP)
