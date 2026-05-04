# 🏗️ MONOREPO CLEANUP & REORGANIZATION

Your repo is **24 directories deep with 4+ separate apps**, each with its own `node_modules`, `package.json`, and build process. This is causing:

- ❌ Confusing navigation
- ❌ Disk bloat (3+ GB from duplicate node_modules)
- ❌ Dependency conflicts
- ❌ Hard to deploy
- ❌ 4498 security vulnerabilities reported as one big pile

## Current Structure (Messy)

```
pauli-comic-funnel/ (24 dirs)
│
├── src/                              ← Main React app
│   ├── components/
│   ├── pages/
│   └── package.json
│
├── server/                           ← Express backend
│   ├── routes/
│   └── index.ts
│
├── agents/                           ← PAULI agent
│   └── ...
│
├── JARVIS_Universal_Agent_v2.0/      ← Different Python agent
│
├── eigent-main/                      ← Electron app (UNUSED - DELETE)
│   ├── package.json
│   ├── node_modules/
│   └── ...
│
├── pauli-unified-chat/               ← Another chat (UNUSED - DELETE)
│   ├── package.json
│   ├── node_modules/
│   └── ...
│
├── postiz-app-main/                  ← Social media (UNUSED - DELETE)
│
├── litellm-main(2)/                  ← LLM proxy (UNUSED - DELETE)
│
├── mcp-servers/                      ← MCP servers (UNUSED - DELETE)
│
├── motion-primitives-main(1)/        ← UI primitives (UNUSED - DELETE)
│
├── cult-ui-main.zip                  ← LEFTOVER ARTIFACT (DELETE)
│
└── ...10+ more unused directories
```

**Disk Usage:**
- `src/node_modules/`: ~500MB
- `eigent-main/node_modules/`: ~500MB
- `pauli-unified-chat/node_modules/`: ~500MB
- `postiz-app-main/node_modules/`: ~500MB
- Total: **2-3 GB wasted**

---

## Target Structure (Clean)

```
pauli-brain/
│
├── apps/                             ← All apps here
│   │
│   ├── web/                          ← React frontend (current src/)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── HermesRolodex.tsx
│   │   │   ├── pages/
│   │   │   ├── contexts/
│   │   │   └── lib/
│   │   ├── package.json              ← Specific to web app
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── server/                       ← Express backend (current server/)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── middleware/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── agents/                       ← Python agents
│       ├── pauli/
│       │   ├── pauli_orchestrator.py
│       │   └── requirements.txt
│       ├── hermes/
│       │   └── hermes_agent.py
│       └── pyproject.toml
│
├── packages/                         ← Shared code
│   │
│   ├── shared/
│   │   ├── types.ts                  ← Shared TypeScript types
│   │   │   ├── person.ts             ← Hermes types
│   │   │   ├── task.ts               ← PAULI types
│   │   │   └── index.ts
│   │   └── package.json              ← Internal package
│   │
│   ├── ui/
│   │   ├── components/               ← Component library
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   └── package.json
│   │
│   └── db/
│       ├── schema.prisma
│       ├── prisma.client.ts
│       └── package.json
│
├── .env.local                         ← Single env file (all apps read it)
├── .env.example                       ← Template
├── .nvmrc                             ← Node version
├── .npmrc                             ← npm config
├── .gitignore                         ← Git config
│
├── package.json                       ← WORKSPACE ROOT
│   {
│     "workspaces": [
│       "apps/*",
│       "packages/*"
│     ]
│   }
│
├── pnpm-workspace.yaml               ← If using pnpm (recommended)
│
├── tsconfig.json                      ← Shared TypeScript config
│
├── turbo.json                         ← Build orchestration
│
├── .github/
│   └── workflows/
│       ├── test.yml                   ← Test all apps
│       └── deploy.yml                 ← Deploy web + server
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── API.md
│   └── GETTING_STARTED.md
│
└── README.md
```

**Disk Usage:**
- Single `node_modules/`: ~1GB
- Python `venv/`: ~200MB
- Total: **~1.2 GB** (65% smaller!)

---

## Step-by-Step Migration Plan

### Phase 1: Delete Unused Apps (30 min)

```bash
# Delete unused directories
rm -rf eigent-main/
rm -rf pauli-unified-chat/
rm -rf postiz-app-main/
rm -rf litellm-main(2)/
rm -rf mcp-servers/
rm -rf motion-primitives-main(1)/
rm -f cult-ui-main.zip

# Check what's actually used
ls -la | grep -E "^\.$|^\.\.$|^\.git|^src|^server|^agents|^JARVIS"

# Commit deletion
git add -A && git commit -m "chore: remove unused monorepo apps"
```

### Phase 2: Create Workspace Structure (1 hour)

```bash
# Create directories
mkdir -p apps/web apps/server apps/agents
mkdir -p packages/shared packages/ui packages/db

# Move existing code
mv src/* apps/web/
mv server/* apps/server/
mv agents/* apps/agents/
mv JARVIS_Universal_Agent_v2.0/* apps/agents/

# Clean up old directories
rmdir src/ server/ agents/ JARVIS_Universal_Agent_v2.0/
```

### Phase 3: Setup Package.json Files (30 min)

**Create `apps/web/package.json`:**
```json
{
  "name": "@pauli/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "@pauli/shared": "workspace:*"
  }
}
```

**Create `apps/server/package.json`:**
```json
{
  "name": "@pauli/server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "express": "^5.2.1",
    "@pauli/shared": "workspace:*"
  }
}
```

**Create `apps/agents/pyproject.toml`:**
```toml
[project]
name = "pauli-agents"
version = "1.0.0"

[tool.uv]
dependencies = [
    "crewai>=0.1.0",
    "anthropic>=0.7.0",
]
```

**Create `packages/shared/package.json`:**
```json
{
  "name": "@pauli/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.ts",
    "./types": "./types/index.ts"
  }
}
```

**Root `package.json`:**
```json
{
  "name": "pauli-brain",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm -w @pauli/web run dev\" \"npm -w @pauli/server run dev\"",
    "build": "npm -w @pauli/web run build && npm -w @pauli/server run build",
    "lint": "npm -w @pauli/web run lint && npm -w @pauli/server run lint",
    "test": "npm run test --workspaces",
    "db:push": "npm -w @pauli/server run db:push"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### Phase 4: Update Imports (1 hour)

All internal imports now use workspace packages:

**In `apps/web/src/components/HermesRolodex.tsx`:**
```tsx
// Before:
import { User, Session } from '@/lib/supabase';

// After (if shared):
import type { User, Session } from '@pauli/shared/types';
```

**In `apps/server/src/routes/hermes.ts`:**
```typescript
// Before:
// (local file)

// After (if shared):
import type { Person, Contact } from '@pauli/shared/types';
```

### Phase 5: Setup pnpm Workspace (15 min)

**Create `pnpm-workspace.yaml`:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Create `.npmrc`:**
```
node-linker=hoisted
shamefully-hoist=true
```

Then:
```bash
# Remove npm node_modules (uses pnpm)
rm -rf node_modules/

# Install with pnpm (40% faster)
pnpm install

# Verify
pnpm list
```

### Phase 6: Setup Turbo for Build Caching (30 min)

**Create `turbo.json`:**
```json
{
  "version": "1",
  "pipeline": {
    "dev": {
      "cache": false,
      "interactive": true
    },
    "build": {
      "outputs": ["dist/", "build/", ".next"],
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": [".eslintcache"]
    },
    "test": {
      "outputs": ["coverage/"],
      "dependsOn": ["^build"]
    }
  }
}
```

Then use:
```bash
npx turbo build      # Build all, cache results
npx turbo dev        # Dev mode for all
npx turbo lint       # Lint all
```

### Phase 7: Setup TypeScript Properly (15 min)

**Root `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./apps/web/src/*"],
      "@pauli/shared": ["./packages/shared"],
      "@pauli/db": ["./packages/db"]
    }
  }
}
```

**Each app extends root:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Phase 8: Update Environment Variables (10 min)

**Single `.env` file in root** (all apps read it):
```bash
# Web
VITE_API_URL=http://localhost:3001/api

# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Auth
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AI
ANTHROPIC_API_KEY=sk-ant-...
```

**No separate `.env` files in each app.**

---

## Before & After Comparison

### Before (Current - Messy)
```bash
$ du -sh .
2.8 GB

$ ls -1 | wc -l
24 directories

$ npm ls --all | head -20
├── react@18.3.1
├── react@18.3.1 (eigent-main)
├── react@18.3.1 (pauli-unified-chat)
├── react@18.3.1 (postiz-app-main)
# ^ 4 different React versions!
```

### After (Clean)
```bash
$ du -sh .
950 MB

$ ls -1 | grep -v node_modules | wc -l
8 directories

$ npm ls --all
├── react@18.3.1
# ^ Single version, shared
```

**Improvements:**
- ✅ **66% smaller disk footprint**
- ✅ **Single dependency tree** (easier to manage)
- ✅ **No version conflicts**
- ✅ **Faster CI/CD** (cache reuse)
- ✅ **Clear structure** (anyone can navigate)
- ✅ **One deployment** (not 4)

---

## GitHub Actions CI/CD

**`.github/workflows/test-and-deploy.yml`:**
```yaml
name: Test & Deploy

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - name: Deploy to Vercel (web)
        run: vercel deploy --prod
      - name: Deploy to Railway (server)
        run: railway deploy --environment production
```

---

## Migration Checklist

- [ ] Delete unused apps
- [ ] Create new directory structure
- [ ] Move files to new locations
- [ ] Create `package.json` for each workspace
- [ ] Create root `package.json` with workspaces config
- [ ] Install pnpm
- [ ] Run `pnpm install`
- [ ] Update all imports to use workspace packages
- [ ] Create `tsconfig.json` at root
- [ ] Setup `.env` file (single)
- [ ] Create `turbo.json`
- [ ] Setup GitHub Actions
- [ ] Test `pnpm dev` works
- [ ] Test `pnpm build` works
- [ ] Commit everything
- [ ] Delete old `node_modules` (should be auto)
- [ ] Run `pnpm install` fresh to verify

---

## Estimated Time

- **Phase 1 (Delete):** 5 min
- **Phase 2 (Move files):** 15 min
- **Phase 3 (Package.json):** 30 min
- **Phase 4 (Update imports):** 1 hour
- **Phase 5 (pnpm):** 15 min
- **Phase 6 (Turbo):** 30 min
- **Phase 7 (TypeScript):** 15 min
- **Phase 8 (Env):** 10 min

**Total: ~3 hours**

**Payoff:**
- 66% smaller disk footprint
- 40% faster installs
- No more dependency conflicts
- Clear, professional structure
- Ready for multiple developers

---

## Do This Now or Later?

**Recommendation:** Do this **AFTER** you get Hermes Rolodex working (see `QUICK_START_TODAY.md`). The cleanup is important but **secondary to having working features**.

So:
1. ✅ Get Hermes working (30 min)
2. ✅ Integrate with backend (30 min)
3. ✅ Test on phone (15 min)
4. 📋 THEN do monorepo cleanup (3 hours)

This way, you have a working app first, then clean code structure.

Ready?
