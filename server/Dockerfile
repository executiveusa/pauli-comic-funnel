# ===========================================
# PAULI EFFECT - Backend API Server
# Express + Supabase + Keepalive
# ===========================================

FROM node:20-alpine

WORKDIR /app

# Install Python for keepalive script
RUN apk add --no-cache python3 py3-pip

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

# Copy server code
COPY server/ ./server/
COPY prisma/ ./prisma/
COPY scripts/ ./scripts/
COPY tsconfig*.json ./

# Install Python dependencies for keepalive
RUN pip3 install --break-system-packages httpx || true

# Generate Prisma client
RUN npx prisma generate || echo "Prisma generation skipped"

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the backend server with keepalive
CMD ["sh", "-c", "python3 scripts/supabase_keepalive.py & npx tsx server/index.ts"]
