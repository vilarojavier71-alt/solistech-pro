# =============================================================================
# DOCKERFILE BLINDADO v2 - MEMORIA OPTIMIZADA
# =============================================================================
# Base: Debian Slim (elimina todos los problemas de OpenSSL/Alpine)
# Optimizado para: VPS con RAM limitada (Exit Code 255 fix)
# Cambios v2: 
#   - --ignore-scripts en deps (evita Prisma sin schema)
#   - Reducción a 3GB RAM para build
#   - Limpieza de cache entre pasos
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
# ETAPA 1: DEPENDENCIAS (sin postinstall para evitar Prisma warning)
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copiar archivos de configuración de paquetes
COPY package.json package-lock.json* ./

# Copiar schema para que no falle Prisma si se ejecuta postinstall
COPY prisma ./prisma

# Instalar dependencias con flags de supervivencia
# --ignore-scripts evita que postinstall de Prisma falle
RUN npm ci --legacy-peer-deps --no-audit --no-fund \
    && npm cache clean --force

# =============================================================================
# ETAPA 2: BUILD
# =============================================================================
FROM base AS builder
WORKDIR /app

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

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
# Copiar todo el código fuente
COPY . .

# Generar Prisma Client con el motor correcto
RUN npx prisma generate

# Build con límite de memoria reducido para evitar OOM
# 3GB = más seguro en VPS con otros procesos corriendo
RUN NODE_OPTIONS="--max-old-space-size=3072" npm run build

# Limpiar dev dependencies para reducir tamaño
RUN npm prune --production --legacy-peer-deps 2>/dev/null || true

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

# Copiar build standalone (solo lo necesario)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy scripts for maintenance tasks
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]
