# Multi-stage build for Pauli Effect - The Pauli Comic Funnel Frontend
# Stage 1: Build the frontend
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Node.js (lightweight approach)
FROM node:20-alpine

WORKDIR /app

# Install serve to run static site
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Create a simple health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
