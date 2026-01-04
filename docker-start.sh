#!/bin/sh
# ===========================================
# PAULI EFFECT - Docker Start Script
# Runs frontend (serve) + backend (tsx) concurrently
# ===========================================

echo "🚀 Starting Pauli Effect..."

# Run Prisma migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Running database migrations..."
  npx prisma migrate deploy || echo "⚠️ Migration skipped (may already be applied)"
fi

# Start backend API in background
echo "🔧 Starting API server on port ${PORT:-3001}..."
tsx server/index.ts &
API_PID=$!

# Start frontend static server
echo "🌐 Starting frontend on port 3000..."
serve -s dist -l 3000 &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Pauli Effect is running!"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:${PORT:-3001}"

# Handle shutdown gracefully
trap "kill $API_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
