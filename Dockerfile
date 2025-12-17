FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat and OpenSSL 1.1 for Prisma compatibility on Alpine
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
    if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# === MEMORY OPTIMIZATION ENVIRONMENT VARIABLES ===
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
# Disable source map generation (critical for memory)
ENV GENERATE_SOURCEMAP=false
# Skip type checking during build (already done in CI)
ENV SKIP_TYPE_CHECK=true

# Generate Prisma client
RUN npm exec prisma generate

# Build with aggressive memory limit (3GB) - leaves 5GB for system/Docker on 8GB VPS
RUN NODE_OPTIONS="--max-old-space-size=3072" npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

