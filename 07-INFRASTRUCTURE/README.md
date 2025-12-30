# 07-INFRASTRUCTURE: Deployment & Infrastructure

**Purpose**: Infrastructure-as-code, deployment configs, and DevOps automation

---

## Structure

```
07-INFRASTRUCTURE/
├── docker/                # Docker configurations
│   ├── Dockerfile.agents  # Agent system container
│   ├── Dockerfile.web     # Web app container
│   └── docker-compose.yml # Full stack orchestration
├── vercel/                # Vercel deployment configs
├── railway/               # Railway deployment configs
├── supabase/              # Supabase configurations
│   ├── migrations/        # Database migrations
│   ├── functions/         # Edge functions
│   └── config.toml        # Supabase config
├── github-actions/        # CI/CD workflows
│   ├── deploy.yml         # Deployment workflow
│   ├── test.yml           # Testing workflow
│   └── security.yml       # Security scanning
└── README.md             # This file
```

---

## Current Infrastructure

**Web App**:
- Platform: Lovable Cloud
- Framework: Vite + React
- Database: Supabase
- Status: ✅ DEPLOYED

**Agent System**:
- Platform: TBD (likely Railway or self-hosted)
- Runtime: Node.js + TypeScript
- Database: Supabase (shared with web)
- Status: 🟡 IN DEVELOPMENT

---

## Planned Infrastructure

### Multi-Environment Setup

| Environment | Purpose | Hosting |
|-------------|---------|---------|
| **Development** | Local development | Docker Compose |
| **Staging** | Testing before production | Railway |
| **Production** | Live system | Railway + Lovable Cloud |

### Services

| Service | Technology | Purpose |
|---------|------------|---------|
| **Web App** | React + Vite | User interface |
| **Agent System** | Node.js | PAULI-PRIME + agents |
| **Database** | Supabase PostgreSQL | Persistent data |
| **Edge Functions** | Supabase Functions | API endpoints |
| **File Storage** | Supabase Storage | Asset storage |
| **Voice API** | VAPI | Speech-to-text/text-to-speech |

---

## Deployment Strategy

**Web App**:
```bash
# Deployed via Lovable Cloud
# Automatic on git push to main
```

**Agent System**:
```bash
# Railway deployment
railway up
```

**Database Migrations**:
```bash
# Supabase migrations
supabase db push
```

---

## Status

**Current**: Basic infrastructure operational (Supabase + Lovable)
**Next**: Dockerize agent system, set up Railway deployment
**Priority**: HIGH (needed for agent system to run)
