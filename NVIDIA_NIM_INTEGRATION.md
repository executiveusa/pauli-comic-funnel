# NVIDIA NIM Integration — Quick Start

**Status**: ✅ Integrated  
**Date**: 2026-05-25  
**Cost Savings**: 100% on chat endpoint

---

## What Changed

The `/api/chat` endpoint now uses **NVIDIA NIM** (free LLM inference proxy) instead of Anthropic Claude.

**Before**:
- Service: Anthropic Claude Sonnet 4
- Cost: ~$5 per 1M tokens
- Monthly estimate: $150-500 at current scale

**After**:
- Service: NVIDIA NIM (moonshotai/kimi-k2-thinking)
- Cost: **$0.00** (free proxy)
- Monthly estimate: **$0.00**

**Savings**: 100% ✅

---

## Quick Test

```bash
# 1. Start the server
npm run server

# 2. Test chat endpoint (in another terminal)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, PAULI! Tell me about quantum physics.",
    "sessionId": "test-session"
  }'

# Expected: JSON response with message field containing explanation
```

---

## Environment Variables

Add to your `.env` (already in `.env.example`):

```bash
NVIDIA_NIM_BASE_URL=http://31.220.58.212:8082
NVIDIA_NIM_API_KEY=dummy
NVIDIA_NIM_MODEL=moonshotai/kimi-k2-thinking
```

**Note**: The API key `dummy` is intentional — the proxy doesn't validate keys.

---

## Files Created

1. **`server/services/nvidia-nim.ts`** - NIM client with auto-retry on rate limits
2. **`server/routes/chat.ts`** - Chat route using NIM
3. **`TOKEN_SAVER_PROTOCOL.md`** - Full documentation
4. **`scripts/token-saver-check.sh`** - Integration health check
5. **`.claude/settings.json`** - Cost guard configuration
6. **`ops/reports/`** - Token tracking logs directory

---

## Rate Limits

- **Limit**: 40 requests/minute
- **Auto-retry**: 2-second delay + retry on 429 (rate limit)
- **Sufficient for**: Current production traffic

---

## Monitoring

Run the health check:

```bash
bash scripts/token-saver-check.sh
```

Track costs:

```bash
# View session logs (when created)
ls -lh ops/reports/

# Check daily cost (NIM is free, so this will show $0)
cat ops/reports/daily-cost-$(date +%Y-%m-%d).json 2>/dev/null || echo "No cost data (using free NIM)"
```

---

## Failover Strategy

If NIM proxy is unavailable:
1. Server returns 500 error
2. **Future**: Implement automatic failover to Anthropic Claude
3. **Current**: Monitor uptime, NIM proxy has been stable

---

## Full Documentation

See: **`TOKEN_SAVER_PROTOCOL.md`** for complete details including:
- Cost guard configuration
- Model routing strategy
- Future optimization opportunities
- Troubleshooting guide

---

**Summary**: Chat endpoint now uses free NVIDIA NIM inference, saving ~$150-500/month vs Anthropic.
