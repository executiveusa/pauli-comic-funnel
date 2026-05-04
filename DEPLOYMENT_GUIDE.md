# 🚀 PAULI EFFECT - Production Deployment Guide

Complete deployment guide for Railway (backend) and Vercel (frontend).

## Quick Start

### Backend (Railway)
1. Create Railway project
2. Add PostgreSQL
3. Set environment variables
4. Connect GitHub repo
5. Deploy

### Frontend (Vercel)
1. Import GitHub repo
2. Configure build settings (Vite framework preset)
3. No API_URL env var required (uses relative /api/* paths with Vercel rewrites)
4. Deploy

See full guide at: https://railway.app/docs and https://vercel.com/docs

## Health Endpoints

- `/api/health` - Comprehensive health check
- `/api/ready` - Readiness probe
- `/api/live` - Liveness probe
- `/api/metrics` - Prometheus metrics

