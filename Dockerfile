# ============================================
# MPE-OS V3.0.0: Multi-Stage Build (FinOps Optimized)
# ============================================
# Stage 1: Dependencies & Prisma Generation
FROM node:20-slim AS deps

# Install system dependencies for Prisma (minimal footprint)
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files (layer caching optimization)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps --omit=dev

# ============================================
# Stage 2: Build Application
FROM node:20-slim AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Clean .next cache before build (critical for Linux path resolution)
RUN rm -rf .next

# Build-time variables (Zero-Flag Policy: no sensitive data exposed)
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Generate Prisma Client and build application
RUN npx prisma@5.10 generate && \
    npm run build

# ============================================
# Stage 3: Production Runtime
FROM node:20-slim AS runner

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user (Docker Security Best Practice)
RUN groupadd -r nodejs && \
    useradd -r -g nodejs -u 1000 nodejs && \
    mkdir -p /app && \
    chown -R nodejs:nodejs /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script from source context
COPY scripts/docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown nodejs:nodejs /app/entrypoint.sh

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Healthcheck (ISO 27001: Monitoring & Availability)
# Uses dedicated health endpoint for comprehensive system checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode < 500 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

# Use entrypoint script for robust startup
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
