# ===========================================
# PAULI EFFECT - Production Docker Image
# Optimized for Coolify deployment
# ===========================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client (if schema exists)
RUN npx prisma generate 2>/dev/null || echo "Prisma schema not found, skipping"

# Build frontend
RUN npm run build

# Install serve for static files and tsx for TypeScript
RUN npm install -g serve tsx

# Create startup script inline
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting PAULI Effect..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy 2>/dev/null || echo "Migration skipped"' >> /app/start.sh && \
    echo 'serve -s dist -l 3000 &' >> /app/start.sh && \
    echo 'tsx server/index.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3001

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["/bin/sh", "/app/start.sh"]
