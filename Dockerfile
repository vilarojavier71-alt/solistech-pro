# ============================================
# MPE-OS V3.0.0: Multi-Stage Build (Zero Trust - No Secrets Baked)
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

# Build-time variables (NON-SENSITIVE only)
# SECRETS MUST BE INJECTED AT RUNTIME BY COOLIFY (Zero Trust Policy)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Generate Prisma Client and build application
# Note: DATABASE_URL and NEXTAUTH_SECRET are NOT needed at build time
# They will be injected at runtime by Coolify
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

# Use existing 'node' user from base image (UID 1000)
# Why: node:20-slim already includes user 'node' with UID 1000
# No need to create new user (avoids UID conflict)
# Ensure proper ownership
RUN chown -R node:node /app

# Copy built application from builder
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script from source context
COPY scripts/docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown node:node /app/entrypoint.sh

# Switch to non-root user (existing 'node' user from base image)
USER node

EXPOSE 3000

# Healthcheck (ISO 27001: Monitoring & Availability)
# Uses dedicated health endpoint for comprehensive system checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode < 500 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

# Use entrypoint script for robust startup
# SECRETS (DATABASE_URL, NEXTAUTH_SECRET, etc.) are injected at runtime by Coolify
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
