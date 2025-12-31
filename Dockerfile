# Multi-stage build for Pauli Effect
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY bun.lockb* ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["serve", "-s", "dist", "-l", "3000"]
