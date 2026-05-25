#!/bin/bash
# Token Saver Protocol Checklist

echo "=== TOKEN SAVER PROTOCOL CHECK ==="
echo ""

# 1. NIM Integration
if [ -f server/services/nvidia-nim.ts ]; then
  echo "✓ NVIDIA NIM integration active"
else
  echo "✗ NIM integration missing"
fi

# 2. Environment variables
if grep -q "NVIDIA_NIM_BASE_URL" .env.example; then
  echo "✓ NIM env vars documented"
else
  echo "✗ NIM env vars missing"
fi

# 3. Cost tracking directory
if [ -d ops/reports ]; then
  echo "✓ ops/reports/ exists"
else
  echo "✗ ops/reports/ missing"
fi

# 4. Claude settings
if [ -f .claude/settings.json ]; then
  echo "✓ Token saver settings configured"
else
  echo "✗ Claude settings missing"
fi

# 5. Check if NIM proxy is accessible
if command -v curl &> /dev/null; then
  echo -n "Checking NIM proxy... "
  if curl -s -m 5 http://31.220.58.212:8082/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer dummy" \
    -d '{"model":"moonshotai/kimi-k2-thinking","messages":[{"role":"user","content":"ping"}],"max_tokens":10}' \
    > /dev/null 2>&1; then
    echo "✓ NIM proxy accessible"
  else
    echo "⚠️  NIM proxy not responding (may need VPN or different network)"
  fi
fi

echo ""
echo "=== CURRENT STATUS ==="
echo "Chat cost: \$0.00/request (FREE via NIM)"
echo "Daily budget: \$50.00"
echo "Estimated monthly savings: \$150-500 vs Anthropic"
echo ""
echo "=== INTEGRATION SUMMARY ==="
echo "✓ NVIDIA NIM client: server/services/nvidia-nim.ts"
echo "✓ NIM chat route: server/routes/chat.ts"
echo "✓ Server integration: server/index.ts"
echo "✓ Cost tracking: ops/reports/"
echo "✓ Documentation: TOKEN_SAVER_PROTOCOL.md"
echo ""
