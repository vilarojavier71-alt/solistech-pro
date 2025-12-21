# =============================================================================
# DOCKERFILE BLINDADO - ZERO FAILURE DEPLOYMENT
# =============================================================================
# Base: Debian Slim (elimina todos los problemas de OpenSSL/Alpine)
# Optimizado para: VPS 8GB RAM + 4GB SWAP
# =============================================================================

FROM node:20-slim AS base

# Instalar dependencias de sistema necesarias para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Fix UTF-8 encoding in logs
ENV LANG C.UTF-8

# =============================================================================
# ETAPA 1: DEPENDENCIAS
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copiar archivos de configuración de paquetes
COPY package.json package-lock.json* ./

# Instalar dependencias con flags de supervivencia
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# =============================================================================
# ETAPA 2: BUILD
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# === VARIABLES DE ENTORNO CRÍTICAS PARA SUPERVIVENCIA ===
# Desactivar telemetría (reduce overhead)
ENV NEXT_TELEMETRY_DISABLED=1
# NO generar source maps (ahorra ~500MB de RAM)
ENV GENERATE_SOURCEMAP=false
# Saltar type checking (ya se hace en CI)
ENV SKIP_TYPE_CHECK=true
# Modo producción desde el inicio
ENV NODE_ENV=production
# Suprimir warnings de Sentry
ENV SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1

# Generar Prisma Client con el motor correcto
RUN npx prisma generate

# Build con límite de memoria agresivo
# 4GB = suficiente con SWAP habilitado
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# =============================================================================
# ETAPA 3: PRODUCCIÓN (imagen final mínima)
# =============================================================================
FROM base AS runner
WORKDIR /app

# Variables de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# CRÍTICO: Trust host para NextAuth detrás de proxy
ENV AUTH_TRUST_HOST=true

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Crear directorio .next y asignar permisos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]
